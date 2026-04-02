/**
 * DOMUM - Page Templates
 * All page content and rendering logic
 */

const Pages = {
  // Dashboard Page
  dashboard() {
    // Use cached API data if available, otherwise fallback to local data
    const stats = DataStore.getDashboardStatsWithCache();
    const upcomingEvents = DataStore.getUpcomingEventsWithCache(5);
    const recentLeads = DataStore.getRecentLeadsWithCache(5);

    return `
      <div class="page page--dashboard">
        <!-- Metrics Row -->
        <div class="metrics-grid">
          ${Components.metricCard({
            title: 'Propiedades',
            value: stats.totalProperties,
            subtitle: `${stats.availableProperties} disponibles`,
            icon: 'home',
            color: 'cyan'
          })}
          ${Components.metricCard({
            title: 'Leads Activos',
            value: stats.activeLeads,
            icon: 'users',
            trend: 'up',
            trendValue: '+12%',
            color: 'purple'
          })}
          ${Components.metricCard({
            title: 'Ingresos del Mes',
            value: Utils.formatCurrency(stats.monthIncome),
            icon: 'trending-up',
            trend: 'up',
            trendValue: '+8%',
            color: 'green'
          })}
          ${Components.metricCard({
            title: 'Visitas Programadas',
            value: stats.scheduledVisits,
            icon: 'calendar',
            color: 'orange'
          })}
        </div>

        <!-- My Tasks Section -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <div class="card__header">
            <h2 class="card__title">
              <i data-lucide="check-square" style="width: 20px; height: 20px; margin-right: 0.5rem;"></i>
              Mis Tareas
            </h2>
            <button class="btn btn--primary btn--sm" id="new-task-btn">
              <i data-lucide="plus"></i>
              Nueva Tarea
            </button>
          </div>
          <div class="card__body" id="dashboard-tasks-container">
            <div style="text-align: center; padding: 2rem; color: var(--text-tertiary);">
              <i data-lucide="loader-2" class="spin"></i>
              <p style="margin-top: 0.5rem;">Cargando tareas...</p>
            </div>
          </div>
        </div>

        <div class="dashboard-grid">
          <!-- Pipeline Summary -->
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">Pipeline CRM</h2>
              <a href="#crm" class="btn btn--ghost btn--sm">Ver todo</a>
            </div>
            <div class="card__body">
              <div class="pipeline-summary">
                ${DataStore.leadStages.filter(s => !['cerrado_ganado', 'perdido'].includes(s.id)).map(stage => {
                  const count = DataStore.getLeadsByStage(stage.id).length;
                  return `
                    <div class="pipeline-stage">
                      <div class="pipeline-stage__header">
                        <span class="pipeline-stage__dot" style="background: ${stage.color}"></span>
                        <span class="pipeline-stage__name">${stage.name}</span>
                      </div>
                      <span class="pipeline-stage__count">${count}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Upcoming Events -->
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">Próximos Eventos</h2>
              <a href="#calendario" class="btn btn--ghost btn--sm">Ver calendario</a>
            </div>
            <div class="card__body">
              ${upcomingEvents.length > 0 ? `
                <div class="events-list">
                  ${upcomingEvents.map(event => Components.eventItem(event)).join('')}
                </div>
              ` : Components.emptyState('calendar', 'Sin eventos próximos', 'No hay eventos programados')}
            </div>
          </div>

          <!-- Recent Leads -->
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">Leads Recientes</h2>
              <a href="#crm" class="btn btn--ghost btn--sm">Ver todos</a>
            </div>
            <div class="card__body">
              <div class="leads-list">
                ${recentLeads.map(lead => `
                  <div class="lead-row" data-id="${lead.id}">
                    <div class="lead-row__avatar">${Utils.getInitials(lead.name)}</div>
                    <div class="lead-row__info">
                      <span class="lead-row__name">${lead.name}</span>
                      <span class="lead-row__property">${lead.property?.title || 'Sin propiedad'}</span>
                    </div>
                    <span class="badge ${Utils.getStatusClass(lead.stage)}">${Utils.getStatusLabel(lead.stage)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Recent Transactions -->
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">Movimientos Recientes</h2>
              <a href="#caja" class="btn btn--ghost btn--sm">Ver caja</a>
            </div>
            <div class="card__body">
              <div class="transactions-mini">
                ${DataStore.getTransactions().slice(0, 5).map(txn => `
                  <div class="transaction-mini">
                    <div class="transaction-mini__info">
                      <span class="transaction-mini__desc">${Utils.truncate(txn.description, 30)}</span>
                      <span class="transaction-mini__date">${Utils.formatDate(txn.date)}</span>
                    </div>
                    <span class="transaction-mini__amount ${txn.type === 'ingreso' ? 'text-success' : 'text-error'}">
                      ${txn.type === 'ingreso' ? '+' : '-'}${Utils.formatCurrency(txn.amount, txn.currency)}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // Properties Page
  propiedades() {
    const properties = DataStore.getProperties();
    const types = ['departamento', 'casa', 'ph', 'local', 'oficina', 'terreno'];

    return `
      <div class="page page--propiedades">
        <!-- Filters -->
        <div class="filters-bar">
          <div class="filters-bar__left">
            ${Components.tabs([
              { id: 'all', label: 'Todas', count: properties.length },
              { id: 'venta', label: 'Venta', count: properties.filter(p => p.operation === 'venta').length },
              { id: 'alquiler', label: 'Alquiler', count: properties.filter(p => p.operation === 'alquiler').length }
            ], 'all')}
          </div>
          <div class="filters-bar__right">
            <select class="form-select" id="filter-type">
              <option value="">Todos los tipos</option>
              ${types.map(t => `<option value="${t}">${Utils.getPropertyTypeLabel(t)}</option>`).join('')}
            </select>
            <select class="form-select" id="filter-status">
              <option value="">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="reservada">Reservada</option>
              <option value="en_negociacion">En Negociación</option>
            </select>
            <div class="view-toggle">
              <button class="btn btn--ghost btn--icon view-toggle__btn active" data-view="grid">
                <i data-lucide="grid-3x3"></i>
              </button>
              <button class="btn btn--ghost btn--icon view-toggle__btn" data-view="list">
                <i data-lucide="list"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Properties Grid -->
        <div class="properties-grid" id="properties-container">
          ${properties.map(p => Components.propertyCard(p)).join('')}
        </div>

        ${Components.pagination(1, Math.ceil(properties.length / 12))}
      </div>
    `;
  },

  // CRM Page
  crm(activeTab = 'pipeline') {
    const stages = DataStore.leadStages.filter(s => !['perdido'].includes(s.id));
    const archivedLeads = DataStore.getLeadsByStage('perdido');

    return `
      <div class="page page--crm">
        <!-- CRM Tabs -->
        <div class="filters-bar">
          <div class="filters-bar__left">
            ${Components.tabs([
              { id: 'pipeline', label: 'Pipeline de Ventas', icon: 'kanban' },
              { id: 'archivados', label: 'Archivados', icon: 'archive', count: archivedLeads.length }
            ], activeTab)}
          </div>
          <div class="filters-bar__right">
            <div class="search-box search-box--sm">
              <i data-lucide="search" class="search-box__icon"></i>
              <input type="text" class="search-input" id="crm-search" placeholder="Buscar lead...">
            </div>
            <select class="form-select" id="filter-agent">
              <option value="">Todos los agentes</option>
              ${DataStore.users.filter(u => u.role === 'agente').map(u => `
                <option value="${u.id}">${u.name}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Pipeline Board -->
        <div class="pipeline-board" id="crm-pipeline" style="${activeTab !== 'pipeline' ? 'display: none;' : ''}">
          ${stages.map(stage => {
            const leads = DataStore.getLeadsByStage(stage.id);
            return `
              <div class="pipeline-column" data-stage="${stage.id}">
                <div class="pipeline-column__header" style="--stage-color: ${stage.color}">
                  <span class="pipeline-column__title">${stage.name}</span>
                  <span class="pipeline-column__count">${leads.length}</span>
                </div>
                <div class="pipeline-column__body" data-stage="${stage.id}">
                  ${leads.map(lead => Components.leadCard(lead)).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Archived Leads -->
        <div class="archived-leads" id="crm-archivados" style="${activeTab !== 'archivados' ? 'display: none;' : ''}">
          ${archivedLeads.length === 0 ? `
            <div class="empty-state">
              <i data-lucide="archive"></i>
              <h3>Sin leads archivados</h3>
              <p>Los leads marcados como "Perdido" aparecerán aquí</p>
            </div>
          ` : `
            <div class="archived-leads__grid">
              ${archivedLeads.map(lead => {
                const initials = lead.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                return `
                  <div class="archived-lead-card" data-id="${lead.id}">
                    <div class="archived-lead-card__header">
                      <div class="archived-lead-card__avatar">${initials}</div>
                      <div class="archived-lead-card__info">
                        <span class="archived-lead-card__name">${lead.name}</span>
                        <span class="archived-lead-card__source">${lead.source || 'Sin fuente'}</span>
                      </div>
                      <span class="badge badge--danger">Perdido</span>
                    </div>
                    ${lead.lostReason ? `
                      <p class="archived-lead-card__reason">
                        <i data-lucide="message-circle"></i>
                        ${lead.lostReason}
                      </p>
                    ` : ''}
                    <div class="archived-lead-card__footer">
                      <span class="archived-lead-card__date">
                        <i data-lucide="calendar"></i>
                        ${lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString('es-AR') : 'Sin fecha'}
                      </span>
                      <button class="btn btn--ghost btn--sm" data-restore-lead="${lead.id}">
                        <i data-lucide="undo-2"></i>
                        Restaurar
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  },

  // Contacts Page
  contactos() {
    const contacts = DataStore.getContacts();
    const types = ['propietario', 'inquilino', 'comprador_potencial', 'inversor', 'constructora', 'colega'];

    return `
      <div class="page page--contactos">
        <!-- Filters -->
        <div class="filters-bar">
          <div class="filters-bar__left">
            ${Components.tabs([
              { id: 'all', label: 'Todos', count: contacts.length },
              { id: 'propietario', label: 'Propietarios', count: contacts.filter(c => c.type === 'propietario').length },
              { id: 'comprador_potencial', label: 'Compradores', count: contacts.filter(c => c.type === 'comprador_potencial').length },
              { id: 'constructora', label: 'Constructoras', count: contacts.filter(c => c.type === 'constructora').length }
            ], 'all')}
          </div>
        </div>

        <!-- Contacts Table -->
        <div class="card">
          <table class="table">
            <thead>
              <tr>
                <th>Contacto</th>
                <th>Tipo</th>
                <th>Teléfono</th>
                <th>Tags</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="contacts-tbody">
              ${contacts.map(c => Components.contactRow(c)).join('')}
            </tbody>
          </table>
        </div>

        ${Components.pagination(1, Math.ceil(contacts.length / 15))}
      </div>
    `;
  },

  // Calendar Page
  calendario() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const events = DataStore.getEvents();

    // Generate calendar days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startOffset = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    let calendarDays = '';

    // Previous month days
    const prevMonth = new Date(currentYear, currentMonth, 0);
    for (let i = startOffset - 1; i >= 0; i--) {
      const day = new Date(currentYear, currentMonth - 1, prevMonth.getDate() - i);
      calendarDays += Components.calendarDay(day, events, false, false);
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(currentYear, currentMonth, i);
      const isToday = i === today.getDate() && currentMonth === today.getMonth();
      calendarDays += Components.calendarDay(day, events, isToday, true);
    }

    // Next month days
    const remaining = 42 - (startOffset + daysInMonth);
    for (let i = 1; i <= remaining; i++) {
      const day = new Date(currentYear, currentMonth + 1, i);
      calendarDays += Components.calendarDay(day, events, false, false);
    }

    return `
      <div class="page page--calendario">
        <div class="calendar-layout">
          <!-- Calendar -->
          <div class="card calendar-card">
            <div class="calendar-header">
              <button class="btn btn--ghost btn--icon" id="prev-month">
                <i data-lucide="chevron-left"></i>
              </button>
              <h2 class="calendar-month">${monthNames[currentMonth]} ${currentYear}</h2>
              <button class="btn btn--ghost btn--icon" id="next-month">
                <i data-lucide="chevron-right"></i>
              </button>
            </div>
            <div class="calendar-weekdays">
              <span>Dom</span><span>Lun</span><span>Mar</span><span>Mié</span>
              <span>Jue</span><span>Vie</span><span>Sáb</span>
            </div>
            <div class="calendar-grid">
              ${calendarDays}
            </div>
          </div>

          <!-- Today's Events -->
          <div class="card calendar-sidebar">
            <div class="card__header">
              <h3 class="card__title">Eventos de Hoy</h3>
            </div>
            <div class="card__body">
              ${(() => {
                const todayStr = today.toISOString().split('T')[0];
                const todayEvents = DataStore.getEventsForDate(todayStr);
                if (todayEvents.length === 0) {
                  return Components.emptyState('calendar', 'Sin eventos', 'No hay eventos para hoy');
                }
                return `<div class="events-list">${todayEvents.map(e => Components.eventItem(e)).join('')}</div>`;
              })()}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // Administraciones Page - Gestión de Contratos de Alquiler
  administraciones() {
    const rentals = DataStore.getRentals();
    const activeRentals = DataStore.getActiveRentals();
    const expiringRentals = DataStore.getExpiringRentals(90);
    const stats = DataStore.getRentalStats();
    const bookingStats = DataStore.getTemporaryBookingStats();

    return `
      <div class="page page--administraciones">
        <!-- Main Tabs: Contratos vs Temporarios -->
        <div class="admin-tabs">
          ${Components.tabs([
            { id: 'contratos', label: 'Contratos', icon: 'file-text' },
            { id: 'temporarios', label: 'Temporarios', icon: 'calendar-range' }
          ], 'contratos')}
        </div>

        <!-- Contratos View -->
        <div class="admin-view" id="contratos-view">
          <!-- Stats Summary -->
          <div class="rentals-summary">
            ${Components.metricCard({
              title: 'Contratos Activos',
              value: stats.activeContracts,
              icon: 'file-text',
              color: 'cyan'
            })}
            ${Components.metricCard({
              title: 'Por Vencer (90 días)',
              value: stats.expiringContracts,
              icon: 'calendar-x',
              color: expiringRentals.length > 0 ? 'orange' : 'green'
            })}
            ${Components.metricCard({
              title: 'Ajustes Próximos',
              value: stats.upcomingAdjustments,
              subtitle: 'En los próximos 30 días',
              icon: 'trending-up',
              color: 'purple'
            })}
            ${Components.metricCard({
              title: 'Ingreso Mensual',
              value: stats.monthlyIncomeARS > 0 ? Utils.formatCurrency(stats.monthlyIncomeARS, 'ARS') : Utils.formatCurrency(stats.monthlyIncomeUSD, 'USD'),
              subtitle: stats.monthlyIncomeARS > 0 && stats.monthlyIncomeUSD > 0 ? `+ ${Utils.formatCurrency(stats.monthlyIncomeUSD, 'USD')}` : '',
              icon: 'wallet',
              color: 'green'
            })}
          </div>

          <!-- Filters -->
          <div class="filters-bar">
            <div class="filters-bar__left">
              ${Components.tabs([
                { id: 'activos', label: 'Contratos Activos', count: activeRentals.length },
                { id: 'por_vencer', label: 'Por Vencer', count: expiringRentals.length },
                { id: 'todos', label: 'Todos', count: rentals.length }
              ], 'activos')}
            </div>
            <div class="filters-bar__right">
              <div class="view-toggle">
                <button class="btn btn--ghost btn--icon view-toggle__btn active" data-view="grid">
                  <i data-lucide="grid-3x3"></i>
                </button>
                <button class="btn btn--ghost btn--icon view-toggle__btn" data-view="list">
                  <i data-lucide="list"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Rentals Grid -->
          <div class="rentals-grid" id="rentals-container">
            ${activeRentals.length > 0 ?
              activeRentals.map(rental => Components.rentalCard(rental)).join('') :
              Components.emptyState('file-text', 'Sin contratos activos', 'No hay contratos de alquiler registrados. Creá uno nuevo para comenzar.')
            }
          </div>

          ${activeRentals.length > 0 ? Components.pagination(1, Math.ceil(activeRentals.length / 9)) : ''}
        </div>

        <!-- Temporarios View -->
        <div class="admin-view hidden" id="temporarios-view">
          ${this.temporariosCalendarView()}
        </div>
      </div>
    `;
  },

  // Vista del calendario de temporarios
  temporariosCalendarView() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const bookings = DataStore.getTemporaryBookingsForMonth(currentYear, currentMonth);
    const upcomingBookings = DataStore.getUpcomingTemporaryBookings(30);
    const stats = DataStore.getTemporaryBookingStats();
    const properties = DataStore.getProperties({ operation: 'alquiler_temporario' });

    // Generate calendar days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startOffset = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    let calendarDays = '';

    // Previous month days
    const prevMonth = new Date(currentYear, currentMonth, 0);
    for (let i = startOffset - 1; i >= 0; i--) {
      const day = new Date(currentYear, currentMonth - 1, prevMonth.getDate() - i);
      calendarDays += Components.calendarBookingDay(day, bookings, false, false);
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(currentYear, currentMonth, i);
      const isToday = i === today.getDate() && currentMonth === today.getMonth();
      calendarDays += Components.calendarBookingDay(day, bookings, isToday, true);
    }

    // Next month days
    const remaining = 42 - (startOffset + daysInMonth);
    for (let i = 1; i <= remaining; i++) {
      const day = new Date(currentYear, currentMonth + 1, i);
      calendarDays += Components.calendarBookingDay(day, bookings, false, false);
    }

    return `
      <!-- Temporarios Stats -->
      <div class="booking-stats">
        ${Components.metricCard({
          title: 'Reservas Activas',
          value: stats.activeBookings,
          icon: 'calendar-check',
          color: 'cyan'
        })}
        ${Components.metricCard({
          title: 'Check-ins Hoy',
          value: stats.checkInsToday,
          icon: 'log-in',
          color: 'green'
        })}
        ${Components.metricCard({
          title: 'Ocupacion del Mes',
          value: stats.occupancyRate + '%',
          icon: 'percent',
          color: 'purple'
        })}
        ${Components.metricCard({
          title: 'Ingresos del Mes',
          value: Utils.formatCurrency(stats.monthlyIncome, 'USD'),
          icon: 'wallet',
          color: 'orange'
        })}
      </div>

      <!-- Property Filter -->
      <div class="filters-bar">
        <div class="filters-bar__left">
          <select class="form-select" id="filter-temp-property">
            <option value="">Todas las propiedades</option>
            ${properties.map(p => `<option value="${p.id}">${p.title}</option>`).join('')}
          </select>
        </div>
        <div class="filters-bar__right">
          <button class="btn btn--primary" id="new-booking-btn">
            <i data-lucide="plus"></i>
            Nueva Reserva
          </button>
        </div>
      </div>

      <!-- Calendar Layout -->
      <div class="calendar-layout calendar-layout--bookings">
        <!-- Calendar -->
        <div class="card calendar-card">
          <div class="calendar-header">
            <button class="btn btn--ghost btn--icon" id="prev-booking-month">
              <i data-lucide="chevron-left"></i>
            </button>
            <h2 class="calendar-month" id="booking-calendar-title">${monthNames[currentMonth]} ${currentYear}</h2>
            <button class="btn btn--ghost btn--icon" id="next-booking-month">
              <i data-lucide="chevron-right"></i>
            </button>
          </div>
          <div class="calendar-weekdays">
            <span>Dom</span><span>Lun</span><span>Mar</span><span>Mie</span>
            <span>Jue</span><span>Vie</span><span>Sab</span>
          </div>
          <div class="calendar-grid calendar-grid--bookings" id="booking-calendar-grid">
            ${calendarDays}
          </div>

          <!-- Legend -->
          <div class="calendar-legend">
            <div class="legend-item"><span class="legend-dot" style="background: #10B981"></span> Confirmada</div>
            <div class="legend-item"><span class="legend-dot" style="background: #F59E0B"></span> Pendiente</div>
            <div class="legend-item"><span class="legend-dot" style="background: #6B7280"></span> Completada</div>
          </div>
        </div>

        <!-- Sidebar: Upcoming Bookings -->
        <div class="card calendar-sidebar">
          <div class="card__header">
            <h3 class="card__title">Proximas Reservas</h3>
          </div>
          <div class="card__body">
            ${upcomingBookings.length > 0 ? `
              <div class="bookings-list">
                ${upcomingBookings.slice(0, 5).map(b => Components.bookingItem(b)).join('')}
              </div>
            ` : Components.emptyState('calendar', 'Sin reservas proximas', 'No hay reservas programadas')}
          </div>
        </div>
      </div>
    `;
  },

  // Documentos IA Page
  documentos() {
    const templates = DataStore.getDocumentTemplates();
    const generatedDocs = DataStore.getGeneratedDocuments();
    const categories = DataStore.getDocumentCategories();

    // Count documents by category
    const countByCategory = {
      todos: generatedDocs.length,
      contratos: generatedDocs.filter(d => d.category === 'contratos').length,
      boletos: generatedDocs.filter(d => d.category === 'boletos').length,
      informes: generatedDocs.filter(d => d.category === 'informes').length
    };

    return `
      <div class="page page--documentos">
        <div class="filters-bar">
          <div class="filters-bar__left">
            ${Components.tabs([
              { id: 'todos', label: 'Todos', count: countByCategory.todos },
              { id: 'contratos', label: 'Contratos', count: countByCategory.contratos },
              { id: 'boletos', label: 'Boletos', count: countByCategory.boletos },
              { id: 'informes', label: 'Informes', count: countByCategory.informes }
            ], 'todos')}
          </div>
          <div class="filters-bar__right">
            <button class="btn btn--outline" id="upload-doc-btn">
              <i data-lucide="upload"></i>
              Subir Documento
            </button>
            <button class="btn btn--primary" id="generate-doc-btn">
              <i data-lucide="sparkles"></i>
              Generar Documento
            </button>
          </div>
        </div>

        <!-- Document Type Cards for Generation -->
        <div class="doc-types-section">
          <h3 class="section-title">Generar Nuevo Documento</h3>
          <div class="doc-types-grid">
            ${templates.map(t => `
              <div class="doc-type-card" data-template="${t.id}">
                <div class="doc-type-card__icon">
                  <i data-lucide="${t.icon}"></i>
                </div>
                <div class="doc-type-card__info">
                  <h4 class="doc-type-card__title">${t.name}</h4>
                  <p class="doc-type-card__desc">${t.description}</p>
                </div>
                <button class="btn btn--ghost btn--sm doc-type-card__btn">
                  <i data-lucide="plus"></i>
                  Crear
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Generated Documents Grid -->
        <div class="generated-docs-section">
          <h3 class="section-title">Documentos Generados</h3>
          <div class="docs-grid" id="docs-container">
            ${generatedDocs.length > 0 ? generatedDocs.map(doc => `
              <div class="doc-card" data-doc-id="${doc.id}">
                <div class="doc-card__icon ${doc.status === 'borrador' ? 'doc-card__icon--draft' : ''}">
                  <i data-lucide="file-text"></i>
                </div>
                <div class="doc-card__info">
                  <h3 class="doc-card__title">${doc.templateName}</h3>
                  <span class="doc-card__date">${Utils.formatDate(doc.createdAt)}</span>
                  <span class="badge badge--sm ${doc.status === 'borrador' ? 'badge--warning' : 'badge--success'}">${doc.status}</span>
                </div>
                <div class="doc-card__actions">
                  <button class="btn btn--ghost btn--icon btn--sm doc-edit-btn" title="Editar" data-doc-id="${doc.id}">
                    <i data-lucide="edit-3"></i>
                  </button>
                  <button class="btn btn--ghost btn--icon btn--sm doc-download-btn" title="Descargar" data-doc-id="${doc.id}">
                    <i data-lucide="download"></i>
                  </button>
                  <button class="btn btn--ghost btn--icon btn--sm doc-delete-btn" title="Eliminar" data-doc-id="${doc.id}">
                    <i data-lucide="trash-2"></i>
                  </button>
                </div>
              </div>
            `).join('') : `
              <div class="docs-empty">
                <i data-lucide="file-plus"></i>
                <h4>Sin documentos generados</h4>
                <p>Seleccioná un tipo de documento arriba para crear tu primer documento</p>
              </div>
            `}
          </div>
        </div>

        <!-- Quick Actions Panel -->
        <div class="card ai-panel">
          <div class="card__header">
            <h3 class="card__title">
              <i data-lucide="sparkles"></i>
              Acciones Rápidas
            </h3>
          </div>
          <div class="card__body">
            <div class="ai-suggestions">
              <p>Generá documentos con un click:</p>
              <div class="ai-suggestion-chips">
                <button class="chip chip--action" data-template="contrato_alquiler">
                  <i data-lucide="home"></i>
                  Contrato de Alquiler
                </button>
                <button class="chip chip--action" data-template="boleto_compraventa">
                  <i data-lucide="file-signature"></i>
                  Boleto de Compraventa
                </button>
                <button class="chip chip--action" data-template="carta_documento">
                  <i data-lucide="mail"></i>
                  Carta Documento
                </button>
                <button class="chip chip--action" data-template="contrato_reserva">
                  <i data-lucide="bookmark"></i>
                  Reserva
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // Caja Page
  caja() {
    const transactions = DataStore.getTransactions();
    const stats = DataStore.getDashboardStats();

    return `
      <div class="page page--caja">
        <!-- Summary Cards -->
        <div class="caja-summary">
          ${Components.metricCard({
            title: 'Ingresos del Mes',
            value: Utils.formatCurrency(stats.monthIncome),
            icon: 'trending-up',
            color: 'green'
          })}
          ${Components.metricCard({
            title: 'Egresos del Mes',
            value: Utils.formatCurrency(stats.monthExpenses),
            icon: 'trending-down',
            color: 'red'
          })}
          ${Components.metricCard({
            title: 'Balance',
            value: Utils.formatCurrency(stats.monthIncome - stats.monthExpenses),
            icon: 'wallet',
            color: 'cyan'
          })}
          ${Components.metricCard({
            title: 'Pendientes',
            value: stats.pendingTransactions,
            icon: 'clock',
            color: 'orange'
          })}
        </div>

        <!-- Filters -->
        <div class="filters-bar">
          <div class="filters-bar__left">
            ${Components.tabs([
              { id: 'all', label: 'Todos' },
              { id: 'ingreso', label: 'Ingresos' },
              { id: 'egreso', label: 'Egresos' }
            ], 'all')}
          </div>
          <div class="filters-bar__right">
            <input type="date" class="form-input" id="date-from">
            <span>a</span>
            <input type="date" class="form-input" id="date-to">
          </div>
        </div>

        <!-- Transactions Table -->
        <div class="card">
          <table class="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Monto</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="transactions-tbody">
              ${transactions.map(t => Components.transactionRow(t)).join('')}
            </tbody>
          </table>
        </div>

        ${Components.pagination(1, Math.ceil(transactions.length / 15))}
      </div>
    `;
  },

  // Configuración Page - Branding & Theme
  configuracion() {
    const config = Branding.getConfig();
    const presetColors = [
      { id: 'cyan', color: '#00D4FF', name: 'Cyan' },
      { id: 'green', color: '#00FF88', name: 'Verde' },
      { id: 'orange', color: '#FF6B35', name: 'Naranja' },
      { id: 'purple', color: '#A855F7', name: 'Púrpura' },
      { id: 'red', color: '#FF4757', name: 'Rojo' },
      { id: 'blue', color: '#3B82F6', name: 'Azul' }
    ];

    return `
      <div class="page page--configuracion">
        <div class="config-grid">
          <!-- Branding Section -->
          <div class="card config-card">
            <div class="card__header">
              <h2 class="card__title">
                <i data-lucide="palette"></i>
                Personalización
              </h2>
            </div>
            <div class="card__body">
              <!-- Company Name -->
              <div class="config-section">
                <label class="form-label">Nombre de la empresa</label>
                <input type="text"
                       class="form-input"
                       id="config-company-name"
                       value="${config.companyName || 'DOMUM'}"
                       placeholder="Nombre de tu empresa">
              </div>

              <!-- Logo Upload -->
              <div class="config-section">
                <label class="form-label">Logo de la empresa</label>
                <div class="logo-upload-container">
                  <div class="logo-preview" id="logo-preview">
                    ${config.logo
                      ? `<img src="${config.logo}" alt="Logo" class="logo-preview__img">`
                      : `<i data-lucide="building-2"></i>`}
                  </div>
                  <div class="logo-upload-actions">
                    <label class="btn btn--outline" for="logo-input">
                      <i data-lucide="upload"></i>
                      Subir logo
                    </label>
                    <input type="file" id="logo-input" accept="image/*" class="hidden">
                    ${config.logo ? `
                      <button class="btn btn--ghost btn--sm" id="remove-logo-btn">
                        <i data-lucide="trash-2"></i>
                        Eliminar
                      </button>
                    ` : ''}
                  </div>
                  <p class="config-hint">Recomendado: PNG o SVG, 200x200px mínimo</p>
                </div>
              </div>

              <!-- Primary Color Selection -->
              <div class="config-section">
                <label class="form-label">
                  <i data-lucide="paintbrush" class="label-icon"></i>
                  Color principal (botones, acentos)
                </label>
                <p class="config-hint">Afecta botones, links, badges e indicadores activos</p>
                <div class="color-picker">
                  <div class="color-presets" data-target="primary">
                    ${presetColors.map(c => `
                      <button class="color-preset ${config.primaryColor === c.color ? 'active' : ''}"
                              data-color="${c.color}"
                              data-target="primary"
                              style="--preset-color: ${c.color}"
                              title="${c.name}">
                        ${config.primaryColor === c.color ? '<i data-lucide="check"></i>' : ''}
                      </button>
                    `).join('')}
                  </div>
                  <div class="color-custom">
                    <div class="color-input-wrapper">
                      <input type="color"
                             id="primary-color-input"
                             value="${config.primaryColor || '#00D4FF'}"
                             class="color-input"
                             title="Click para abrir selector (incluye cuentagotas en Chrome/Edge)">
                      <input type="text"
                             id="primary-color-hex"
                             value="${config.primaryColor || '#00D4FF'}"
                             class="form-input form-input--sm"
                             placeholder="#00D4FF">
                      <span class="color-eyedropper-hint">
                        <i data-lucide="pipette"></i>
                        Cuentagotas
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Background Color Selection -->
              <div class="config-section">
                <label class="form-label">
                  <i data-lucide="square" class="label-icon"></i>
                  Color de fondo
                </label>
                <p class="config-hint">Afecta el fondo de la aplicación, sidebar y cards</p>
                <div class="color-picker">
                  <div class="color-presets" data-target="background">
                    ${[
                      { color: '#0A0E14', name: 'Oscuro (default)' },
                      { color: '#1A1A2E', name: 'Azul oscuro' },
                      { color: '#0F0E17', name: 'Púrpura oscuro' },
                      { color: '#1B1B1B', name: 'Gris oscuro' },
                      { color: '#0D1B2A', name: 'Navy' },
                      { color: '#2D2D2D', name: 'Carbón' }
                    ].map(c => `
                      <button class="color-preset ${config.backgroundColor === c.color ? 'active' : ''}"
                              data-color="${c.color}"
                              data-target="background"
                              style="--preset-color: ${c.color}"
                              title="${c.name}">
                        ${config.backgroundColor === c.color ? '<i data-lucide="check"></i>' : ''}
                      </button>
                    `).join('')}
                  </div>
                  <div class="color-custom">
                    <div class="color-input-wrapper">
                      <input type="color"
                             id="bg-color-input"
                             value="${config.backgroundColor || '#0A0E14'}"
                             class="color-input"
                             title="Click para abrir selector (incluye cuentagotas en Chrome/Edge)">
                      <input type="text"
                             id="bg-color-hex"
                             value="${config.backgroundColor || '#0A0E14'}"
                             class="form-input form-input--sm"
                             placeholder="#0A0E14">
                      <span class="color-eyedropper-hint">
                        <i data-lucide="pipette"></i>
                        Cuentagotas
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Preview Section -->
          <div class="card config-card">
            <div class="card__header">
              <h2 class="card__title">
                <i data-lucide="eye"></i>
                Vista previa
              </h2>
            </div>
            <div class="card__body">
              <div class="preview-container" id="preview-container">
                <div class="preview-sidebar">
                  <div class="preview-logo">
                    <div class="preview-logo-icon" id="preview-logo-icon">
                      ${config.logo
                        ? `<img src="${config.logo}" alt="Logo">`
                        : `<i data-lucide="building-2"></i>`}
                    </div>
                    <span class="preview-logo-text" id="preview-company-name">${config.companyName || 'DOMUM'}</span>
                  </div>
                  <div class="preview-nav">
                    <div class="preview-nav-item active">Dashboard</div>
                    <div class="preview-nav-item">Propiedades</div>
                    <div class="preview-nav-item">CRM</div>
                  </div>
                </div>
                <div class="preview-content">
                  <div class="preview-header">
                    <span>Dashboard</span>
                    <button class="preview-btn">+ Nuevo</button>
                  </div>
                  <div class="preview-cards">
                    <div class="preview-metric">
                      <span class="preview-metric-value">24</span>
                      <span class="preview-metric-label">Propiedades</span>
                    </div>
                    <div class="preview-metric">
                      <span class="preview-metric-value">8</span>
                      <span class="preview-metric-label">Leads</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Save Actions -->
          <div class="config-actions">
            <button class="btn btn--outline" id="reset-config-btn">
              <i data-lucide="rotate-ccw"></i>
              Restaurar valores
            </button>
            <button class="btn btn--primary" id="save-config-btn">
              <i data-lucide="save"></i>
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // Usuarios Page - User Management
  usuarios() {
    const currentUser = DataStore.currentUser;
    const currentUserRole = currentUser?.role || 'administrador';

    // Check permissions - Only admins can access
    if (currentUserRole === 'agente') {
      return `
        <div class="page page--usuarios">
          <div class="access-denied">
            <i data-lucide="shield-x"></i>
            <h2>Acceso Denegado</h2>
            <p>No tienes permisos para acceder a esta sección.</p>
            <a href="#dashboard" class="btn btn--primary">Volver al Dashboard</a>
          </div>
        </div>
      `;
    }

    const users = DataStore.getUsers();
    const roles = DataStore.getUserRoles();

    // Stats
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'activo').length;
    const adminCount = users.filter(u => u.role === 'administrador' || u.role === 'superadmin').length;
    const agentCount = users.filter(u => u.role === 'agente').length;

    return `
      <div class="page page--usuarios">
        <!-- Stats Summary -->
        <div class="users-summary">
          ${Components.metricCard({
            title: 'Total Usuarios',
            value: totalUsers,
            icon: 'users',
            color: 'cyan'
          })}
          ${Components.metricCard({
            title: 'Usuarios Activos',
            value: activeUsers,
            icon: 'user-check',
            color: 'green'
          })}
          ${Components.metricCard({
            title: 'Administradores',
            value: adminCount,
            icon: 'shield',
            color: 'purple'
          })}
          ${Components.metricCard({
            title: 'Vendedores',
            value: agentCount,
            icon: 'briefcase',
            color: 'orange'
          })}
        </div>

        <!-- Filters -->
        <div class="filters-bar">
          <div class="filters-bar__left">
            ${Components.tabs([
              { id: 'todos', label: 'Todos', count: totalUsers },
              { id: 'activos', label: 'Activos', count: activeUsers },
              { id: 'inactivos', label: 'Inactivos', count: totalUsers - activeUsers }
            ], 'todos')}
          </div>
          <div class="filters-bar__right">
            <select class="form-select" id="filter-role">
              <option value="">Todos los roles</option>
              ${roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Users Table -->
        <div class="card">
          <table class="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Leads</th>
                <th>Propiedades</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="users-tbody">
              ${users.map(u => Components.userRow(u, currentUserRole)).join('')}
            </tbody>
          </table>
        </div>

        ${Components.pagination(1, Math.ceil(users.length / 15))}
      </div>
    `;
  },

  // Informes Page
  informes() {
    return `
      <div class="page page--informes">
        <div class="filters-bar">
          <div class="filters-bar__left">
            <select class="form-select" id="report-period">
              <option value="month">Este Mes</option>
              <option value="quarter">Este Trimestre</option>
              <option value="year">Este Año</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
          <div class="filters-bar__right">
            <button class="btn btn--outline">
              <i data-lucide="download"></i>
              Exportar PDF
            </button>
            <button class="btn btn--outline">
              <i data-lucide="table"></i>
              Exportar Excel
            </button>
          </div>
        </div>

        <div class="reports-grid">
          <!-- Sales Report -->
          <div class="card report-card">
            <div class="card__header">
              <h3 class="card__title">Ventas y Alquileres</h3>
            </div>
            <div class="card__body">
              <div class="report-chart">
                <div class="chart-placeholder">
                  <i data-lucide="bar-chart-3"></i>
                  <span>Gráfico de Operaciones</span>
                </div>
              </div>
              <div class="report-stats">
                <div class="report-stat">
                  <span class="report-stat__label">Ventas Cerradas</span>
                  <span class="report-stat__value">${DataStore.properties.filter(p => p.status === 'vendida').length}</span>
                </div>
                <div class="report-stat">
                  <span class="report-stat__label">Alquileres</span>
                  <span class="report-stat__value">${DataStore.properties.filter(p => p.status === 'alquilada').length}</span>
                </div>
                <div class="report-stat">
                  <span class="report-stat__label">Valor Total</span>
                  <span class="report-stat__value">USD ${Math.round(DataStore.properties.filter(p => ['vendida', 'alquilada'].includes(p.status)).reduce((sum, p) => sum + (p.price || 0), 0) / 1000)}k</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Agent Performance -->
          <div class="card report-card">
            <div class="card__header">
              <h3 class="card__title">Rendimiento por Agente</h3>
            </div>
            <div class="card__body">
              <div class="agent-rankings">
                ${DataStore.users.filter(u => u.role === 'agente').length > 0 ? DataStore.users.filter(u => u.role === 'agente').map((agent, i) => `
                  <div class="agent-rank">
                    <span class="agent-rank__position">${i + 1}</span>
                    <div class="agent-rank__avatar">${agent.avatar || 'AG'}</div>
                    <div class="agent-rank__info">
                      <span class="agent-rank__name">${agent.name}</span>
                      <span class="agent-rank__stats">${agent.stats?.ventasMes || 0} ventas · ${agent.stats?.leadsActivos || 0} leads</span>
                    </div>
                    <div class="agent-rank__bar">
                      <div class="agent-rank__progress" style="width: ${((agent.stats?.ventasMes || 0) / 3) * 100}%"></div>
                    </div>
                  </div>
                `).join('') : '<div class="empty-state"><p>No hay agentes registrados</p></div>'}
              </div>
            </div>
          </div>

          <!-- Lead Sources -->
          <div class="card report-card">
            <div class="card__header">
              <h3 class="card__title">Fuentes de Leads</h3>
            </div>
            <div class="card__body">
              <div class="source-chart">
                ${(() => {
                  const sources = { 'referido': 'Referidos', 'instagram': 'Instagram', 'facebook': 'Facebook', 'google': 'Google', 'linkedin': 'LinkedIn', 'directo': 'Directo' };
                  const counts = {};
                  Object.keys(sources).forEach(s => counts[s] = DataStore.leads.filter(l => l.source === s).length);
                  const maxCount = Math.max(...Object.values(counts), 1);
                  return Object.entries(sources).map(([key, label]) => `
                    <div class="source-bar">
                      <span class="source-bar__label">${label}</span>
                      <div class="source-bar__track">
                        <div class="source-bar__fill" style="width: ${(counts[key] / maxCount) * 100}%"></div>
                      </div>
                      <span class="source-bar__value">${counts[key]}</span>
                    </div>
                  `).join('');
                })()}
              </div>
            </div>
          </div>

          <!-- Conversion Funnel -->
          <div class="card report-card">
            <div class="card__header">
              <h3 class="card__title">Embudo de Conversión</h3>
            </div>
            <div class="card__body">
              <div class="funnel">
                ${(() => {
                  const total = DataStore.leads.length;
                  const calificados = DataStore.leads.filter(l => ['calificado', 'contactado', 'visita', 'negociacion', 'propuesta', 'cerrado_ganado'].includes(l.stage)).length;
                  const visitas = DataStore.leads.filter(l => ['visita', 'negociacion', 'propuesta', 'cerrado_ganado'].includes(l.stage)).length;
                  const negociacion = DataStore.leads.filter(l => ['negociacion', 'propuesta', 'cerrado_ganado'].includes(l.stage)).length;
                  const cerrados = DataStore.leads.filter(l => l.stage === 'cerrado_ganado').length;
                  const maxVal = Math.max(total, 1);
                  return [
                    { label: 'Leads Totales', value: total, width: 100 },
                    { label: 'Calificados', value: calificados, width: total > 0 ? (calificados / total) * 100 : 0 },
                    { label: 'Visitas', value: visitas, width: total > 0 ? (visitas / total) * 100 : 0 },
                    { label: 'Negociación', value: negociacion, width: total > 0 ? (negociacion / total) * 100 : 0 },
                    { label: 'Cerrados', value: cerrados, width: total > 0 ? (cerrados / total) * 100 : 0 }
                  ].map(stage => `
                    <div class="funnel-stage">
                      <div class="funnel-bar" style="width: ${Math.max(stage.width, 5)}%">
                        <span>${stage.value}</span>
                      </div>
                      <span class="funnel-label">${stage.label}</span>
                    </div>
                  `).join('');
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
