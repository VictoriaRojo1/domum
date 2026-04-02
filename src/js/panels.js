/**
 * DOMUM - Detail Panels
 * Slide-in panels for viewing details
 */

const Panels = {
  overlay: null,
  panel: null,
  isOpen: false,

  init() {
    this.overlay = document.getElementById('panel-overlay');
    this.panel = document.getElementById('detail-panel');

    // Close on overlay click
    this.overlay.addEventListener('click', () => this.close());

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  },

  open(content) {
    this.panel.innerHTML = content;
    this.overlay.classList.add('active');
    this.panel.classList.add('active');
    this.isOpen = true;

    // Re-render icons
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  close() {
    this.overlay.classList.remove('active');
    this.panel.classList.remove('active');
    this.isOpen = false;
  },

  // Property Detail Panel
  property(propertyId) {
    const property = DataStore.getPropertyById(propertyId);
    if (!property) return;

    const owner = DataStore.getContactById(property.owner?.id);
    const agent = DataStore.getUserById(property.agent?.id);
    const images = Components.getPropertyImages(property);
    const isRental = property.operation === 'alquiler' || property.operation === 'alquiler_temporario';
    const priceLabel = isRental ? `${Utils.formatCurrency(property.price, property.currency)}/mes` : Utils.formatCurrency(property.price, property.currency);

    const content = `
      <div class="panel__header">
        <h2 class="panel__title">Detalle de Propiedad</h2>
        <div class="panel__actions">
          <button class="btn btn--ghost btn--icon" title="Editar" id="panel-edit">
            <i data-lucide="pencil"></i>
          </button>
          <button class="btn btn--ghost btn--icon" title="Cerrar" id="panel-close">
            <i data-lucide="x"></i>
          </button>
        </div>
      </div>
      <div class="panel__body">
        <!-- Image Gallery -->
        <div class="property-gallery" data-property-id="${propertyId}">
          <div class="property-gallery__main">
            <img src="${images[0]}" alt="${property.title}" class="property-gallery__image" id="gallery-main-image">
            <div class="property-gallery__nav">
              <button class="property-gallery__btn property-gallery__btn--prev" id="gallery-prev" ${images.length <= 1 ? 'disabled' : ''}>
                <i data-lucide="chevron-left"></i>
              </button>
              <button class="property-gallery__btn property-gallery__btn--next" id="gallery-next" ${images.length <= 1 ? 'disabled' : ''}>
                <i data-lucide="chevron-right"></i>
              </button>
            </div>
            <div class="property-gallery__counter">
              <span id="gallery-current">1</span> / ${images.length}
            </div>
            <div class="property-gallery__overlay">
              <span class="property-gallery__price">${priceLabel}</span>
              <span class="property-gallery__address">${property.address}, ${property.neighborhood}</span>
            </div>
          </div>
          ${images.length > 1 ? `
            <div class="property-gallery__thumbs">
              ${images.map((img, i) => `
                <button class="property-gallery__thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
                  <img src="${img.replace('w=800&h=600', 'w=120&h=90')}" alt="Foto ${i + 1}">
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Status Badge -->
        <div style="margin-bottom: 1rem;">
          <span class="badge ${Utils.getStatusClass(property.status)}">${Utils.getStatusLabel(property.status)}</span>
          <span class="badge badge--outline">${Utils.getPropertyTypeLabel(property.type)}</span>
          <span class="badge badge--outline">${Utils.getOperationLabel(property.operation)}</span>
        </div>

        <!-- Features -->
        <div class="property-features">
          ${property.bedrooms > 0 ? `
            <div class="property-feature">
              <i data-lucide="bed" class="property-feature__icon"></i>
              <span class="property-feature__value">${property.bedrooms}</span>
              <span class="property-feature__label">Dorm.</span>
            </div>
          ` : ''}
          ${property.bathrooms > 0 ? `
            <div class="property-feature">
              <i data-lucide="bath" class="property-feature__icon"></i>
              <span class="property-feature__value">${property.bathrooms}</span>
              <span class="property-feature__label">Baños</span>
            </div>
          ` : ''}
          <div class="property-feature">
            <i data-lucide="square" class="property-feature__icon"></i>
            <span class="property-feature__value">${property.area}</span>
            <span class="property-feature__label">m²</span>
          </div>
        </div>

        <!-- Description -->
        <div class="panel__section">
          <h3 class="panel__section-title">Descripción</h3>
          <p style="color: var(--text-secondary); font-size: var(--font-size-sm); line-height: 1.6;">
            ${property.description}
          </p>
        </div>

        <!-- Amenities -->
        ${property.amenities && property.amenities.length > 0 ? `
          <div class="panel__section">
            <h3 class="panel__section-title">Amenities</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
              ${property.amenities.map(a => `
                <span class="badge badge--outline">${a}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Owner Info -->
        ${owner ? `
          <div class="panel__section">
            <h3 class="panel__section-title">Propietario</h3>
            <div class="info-row">
              <span class="info-row__label">Nombre</span>
              <span class="info-row__value">${owner.name}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">Teléfono</span>
              <span class="info-row__value">${owner.phone || owner.mobile || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">Email</span>
              <span class="info-row__value">${owner.email}</span>
            </div>
          </div>
        ` : ''}

        <!-- Agent Info -->
        ${agent ? `
          <div class="panel__section">
            <h3 class="panel__section-title">Agente Asignado</h3>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div class="user-avatar">${agent.avatar}</div>
              <div>
                <span style="display: block; font-weight: 500; color: var(--text-primary);">${agent.name}</span>
                <span style="font-size: var(--font-size-sm); color: var(--text-secondary);">${agent.email}</span>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Actions -->
        <div class="panel__section">
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn--primary" style="flex: 1;" id="panel-schedule-visit">
              <i data-lucide="calendar"></i>
              Agendar Visita
            </button>
            <button class="btn btn--outline" style="flex: 1;" id="panel-share">
              <i data-lucide="file-down"></i>
              Descargar Ficha
            </button>
          </div>
        </div>
      </div>
    `;

    this.open(content);
    this.setupPropertyPanelEvents(propertyId, images);
  },

  // Setup events for property panel
  setupPropertyPanelEvents(propertyId, images) {
    const property = DataStore.getPropertyById(propertyId);
    let currentIndex = 0;

    // Close button
    document.getElementById('panel-close').addEventListener('click', () => this.close());

    // Edit button - opens edit modal
    document.getElementById('panel-edit')?.addEventListener('click', () => {
      this.close();
      Modals.editProperty(propertyId);
    });

    // Schedule visit button - opens new event modal with property pre-selected
    document.getElementById('panel-schedule-visit')?.addEventListener('click', () => {
      this.close();
      Modals.newEventForProperty(propertyId);
    });

    // Share button - generates PDF brochure
    document.getElementById('panel-share')?.addEventListener('click', () => {
      PropertyPDFGenerator.generate(property);
    });

    // Gallery navigation
    const mainImage = document.getElementById('gallery-main-image');
    const currentSpan = document.getElementById('gallery-current');
    const thumbs = this.panel.querySelectorAll('.property-gallery__thumb');

    const updateGallery = (index) => {
      currentIndex = index;
      mainImage.src = images[index];
      currentSpan.textContent = index + 1;
      thumbs.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
      });
    };

    document.getElementById('gallery-prev')?.addEventListener('click', () => {
      const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
      updateGallery(newIndex);
    });

    document.getElementById('gallery-next')?.addEventListener('click', () => {
      const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
      updateGallery(newIndex);
    });

    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        updateGallery(parseInt(thumb.dataset.index));
      });
    });

    // Keyboard navigation for gallery
    const keyHandler = (e) => {
      if (!this.isOpen) {
        document.removeEventListener('keydown', keyHandler);
        return;
      }
      if (e.key === 'ArrowLeft') {
        const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
        updateGallery(newIndex);
      } else if (e.key === 'ArrowRight') {
        const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
        updateGallery(newIndex);
      }
    };
    document.addEventListener('keydown', keyHandler);
  },

  // Lead Detail Panel
  async lead(leadId) {
    // Show loading state first
    this.open(`
      <div class="panel__header">
        <h2 class="panel__title">Detalle del Lead</h2>
        <div class="panel__actions">
          <button class="btn btn--ghost btn--icon" title="Cerrar" id="panel-close">
            <i data-lucide="x"></i>
          </button>
        </div>
      </div>
      <div class="panel__body" style="display: flex; align-items: center; justify-content: center; min-height: 200px;">
        <i data-lucide="loader-2" class="spin" style="width: 32px; height: 32px; color: var(--text-tertiary);"></i>
      </div>
    `);
    lucide.createIcons();
    document.getElementById('panel-close')?.addEventListener('click', () => this.close());

    // Fetch full lead data with activities
    let lead;
    try {
      lead = await DataStore.getLeadByIdViaAPI(leadId);
    } catch (error) {
      // Fallback to cached version
      lead = DataStore.getLeadById(leadId);
    }
    if (!lead) {
      this.close();
      return;
    }

    const agent = DataStore.getUserById(lead.assignedTo);
    const stage = DataStore.leadStages.find(s => s.id === lead.stage);
    const property = lead.property ? DataStore.getPropertyById(lead.property.id) : null;
    const propertyImage = property ? Components.getPropertyImage(property) : null;

    const content = `
      <div class="panel__header">
        <h2 class="panel__title">Detalle del Lead</h2>
        <div class="panel__actions">
          <button class="btn btn--ghost btn--icon" title="Cerrar" id="panel-close">
            <i data-lucide="x"></i>
          </button>
        </div>
      </div>
      <div class="panel__body" data-lead-id="${lead.id}">
        <!-- Lead Header -->
        <div class="lead-header">
          <div class="lead-avatar">${Utils.getInitials(lead.name)}</div>
          <div class="lead-info">
            <span class="lead-info__name info-row--editable" data-field="name" data-type="text">${lead.name}</span>
            <div class="lead-info__status">
              <div class="stage-selector" data-field="stage">
                ${DataStore.leadStages.filter(s => s.id !== 'perdido').map(s => `
                  <button class="stage-selector__btn ${lead.stage === s.id ? 'active' : ''}"
                          data-stage="${s.id}"
                          style="background: ${lead.stage === s.id ? s.color + '20' : ''}; color: ${s.color};">
                    ${s.name}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Info -->
        <div class="panel__section">
          <h3 class="panel__section-title">Información de Contacto</h3>
          <div class="info-row info-row--editable" data-field="phone" data-type="tel">
            <span class="info-row__label">Teléfono</span>
            <span class="info-row__value">${lead.phone || 'Agregar teléfono'}</span>
          </div>
          <div class="info-row info-row--editable" data-field="email" data-type="email">
            <span class="info-row__label">Email</span>
            <span class="info-row__value">${lead.email || 'Agregar email'}</span>
          </div>
          <div class="info-row info-row--editable" data-field="notes" data-type="textarea">
            <span class="info-row__label">Notas</span>
            <span class="info-row__value">${lead.notes || 'Agregar notas...'}</span>
          </div>
        </div>

        <!-- Property Interest -->
        ${lead.property ? `
          <div class="panel__section">
            <h3 class="panel__section-title">Propiedad de Interés</h3>
            <div class="property-card property-card--mini" style="cursor: pointer;" data-property="${lead.property.id}" id="lead-property-card">
              <div class="property-card__image" style="height: 80px;">
                ${propertyImage ? `
                  <img src="${propertyImage}" alt="${lead.property.title}" style="width: 100%; height: 100%; object-fit: cover;">
                ` : `
                  <div class="property-card__placeholder">
                    <i data-lucide="image"></i>
                  </div>
                `}
              </div>
              <div class="property-card__content" style="padding: 0.75rem;">
                <h4 style="font-size: var(--font-size-sm); margin-bottom: 0.25rem;">${lead.property.title}</h4>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Budget -->
        <div class="panel__section">
          <h3 class="panel__section-title">Presupuesto</h3>
          <div class="info-row">
            <span class="info-row__label">Rango</span>
            <span class="info-row__value">
              ${lead.budget?.min || lead.budget?.max
                ? `${Utils.formatCurrency(lead.budget.min || 0, lead.budget?.currency || 'USD')} - ${Utils.formatCurrency(lead.budget.max || 0, lead.budget?.currency || 'USD')}`
                : lead.budgetMin || lead.budgetMax
                  ? `${Utils.formatCurrency(lead.budgetMin || 0, lead.budgetCurrency || 'USD')} - ${Utils.formatCurrency(lead.budgetMax || 0, lead.budgetCurrency || 'USD')}`
                  : 'No especificado'}
            </span>
          </div>
          <div class="info-row">
            <span class="info-row__label">Intereses</span>
            <span class="info-row__value">${lead.interests?.join(', ') || '-'}</span>
          </div>
        </div>

        <!-- Tasks Section -->
        <div class="panel__section">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h3 class="panel__section-title" style="margin-bottom: 0;">
              <i data-lucide="check-square" style="width: 16px; height: 16px; margin-right: 0.5rem;"></i>
              Tareas
            </h3>
            <button class="btn btn--ghost btn--sm" id="add-lead-task">
              <i data-lucide="plus"></i>
              Nueva
            </button>
          </div>
          <div id="lead-tasks-list">
            <div class="task-loading" style="text-align: center; padding: 1rem; color: var(--text-tertiary);">
              <i data-lucide="loader-2" class="spin"></i>
              Cargando tareas...
            </div>
          </div>
        </div>

        <!-- Next Action -->
        ${lead.nextAction ? `
          <div class="panel__section">
            <h3 class="panel__section-title">Próxima Acción</h3>
            <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                <i data-lucide="clock" style="width: 16px; height: 16px; color: var(--accent-cyan);"></i>
                <span style="font-weight: 500; color: var(--text-primary);">${lead.nextAction.type}</span>
              </div>
              <p style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: 0.25rem;">
                ${lead.nextAction.notes}
              </p>
              <span style="font-size: var(--font-size-xs); color: var(--text-tertiary);">
                ${Utils.formatDate(lead.nextAction.date, 'relative')}
              </span>
            </div>
          </div>
        ` : ''}

        <!-- Quick Activity Buttons -->
        <div class="panel__section">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h3 class="panel__section-title" style="margin-bottom: 0;">Registrar Actividad</h3>
            <button class="btn btn--ghost btn--sm" id="open-full-activity-modal">
              <i data-lucide="plus"></i>
              Más opciones
            </button>
          </div>
          <div class="quick-activity-buttons">
            <button class="quick-activity-btn" data-activity="llamada_saliente">
              <i data-lucide="phone-outgoing"></i>
              Llamada
            </button>
            <button class="quick-activity-btn" data-activity="whatsapp">
              <i data-lucide="message-circle"></i>
              WhatsApp
            </button>
            <button class="quick-activity-btn" data-activity="email">
              <i data-lucide="mail"></i>
              Email
            </button>
            <button class="quick-activity-btn" data-activity="visita">
              <i data-lucide="home"></i>
              Visita
            </button>
            <button class="quick-activity-btn" data-activity="nota">
              <i data-lucide="file-text"></i>
              Nota
            </button>
          </div>
        </div>

        <!-- Activity Timeline -->
        <div class="panel__section">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h3 class="panel__section-title" style="margin-bottom: 0;">Historial de Actividades</h3>
            <span style="font-size: var(--font-size-xs); color: var(--text-tertiary);">
              ${lead.activities?.length || 0} ${(lead.activities?.length || 0) === 1 ? 'actividad' : 'actividades'}
            </span>
          </div>
          ${lead.activities && lead.activities.length > 0 ? `
            <div class="timeline--enhanced">
              ${lead.activities.slice(0, 10).map(a => Components.activityItem(a)).join('')}
            </div>
            ${lead.activities.length > 10 ? `
              <button class="btn btn--ghost btn--sm" style="width: 100%; margin-top: var(--spacing-sm);" id="load-more-activities">
                Ver todas las actividades (${lead.activities.length})
              </button>
            ` : ''}
          ` : `
            <p style="color: var(--text-tertiary); font-size: var(--font-size-sm); font-style: italic; text-align: center; padding: var(--spacing-md);">
              Sin actividades registradas
            </p>
          `}
        </div>

        <!-- Notes Section -->
        <div class="panel__section">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h3 class="panel__section-title" style="margin-bottom: 0;">Notas</h3>
            <button class="btn btn--ghost btn--sm" id="toggle-note-form">
              <i data-lucide="plus"></i>
              Agregar
            </button>
          </div>
          <!-- Add Note Form (hidden by default) -->
          <div class="add-note-form" id="add-note-form" style="display: none;">
            <textarea class="form-textarea" id="new-note-text" rows="3" placeholder="Escribe una nota..."></textarea>
            <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
              <button class="btn btn--ghost btn--sm" id="cancel-note">Cancelar</button>
              <button class="btn btn--primary btn--sm" id="save-note">Guardar</button>
            </div>
          </div>
          ${lead.notes ? `
            <p style="color: var(--text-secondary); font-size: var(--font-size-sm); line-height: 1.6;">
              ${lead.notes}
            </p>
          ` : `
            <p style="color: var(--text-tertiary); font-size: var(--font-size-sm); font-style: italic;">
              Sin notas registradas
            </p>
          `}
        </div>

        <!-- Agent -->
        ${agent ? `
          <div class="panel__section">
            <h3 class="panel__section-title">Asignado a</h3>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div class="user-avatar">${agent.avatar}</div>
              <div>
                <span style="display: block; font-weight: 500; color: var(--text-primary);">${agent.name}</span>
                <span style="font-size: var(--font-size-sm); color: var(--text-secondary);">${agent.email}</span>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this.open(content);
    this.setupLeadPanelEvents(leadId);
  },

  // Setup events for lead panel
  setupLeadPanelEvents(leadId) {
    const lead = DataStore.getLeadById(leadId);
    const panelBody = document.querySelector('.panel__body[data-lead-id]');

    // Close button
    document.getElementById('panel-close').addEventListener('click', () => this.close());

    // ===== INLINE EDITING =====

    // Stage selector buttons
    document.querySelectorAll('.stage-selector__btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const newStage = btn.dataset.stage;
        if (newStage && newStage !== lead.stage) {
          // Update UI immediately
          document.querySelectorAll('.stage-selector__btn').forEach(b => {
            b.classList.remove('active');
            b.style.background = '';
          });
          btn.classList.add('active');
          const stageInfo = DataStore.leadStages.find(s => s.id === newStage);
          btn.style.background = stageInfo.color + '20';

          // Save to API
          try {
            await DataStore.updateLeadViaAPI(leadId, { stage: newStage });
            Toast.show('success', `Movido a "${stageInfo.name}"`);
            // Refresh CRM if open
            if (typeof App !== 'undefined' && App.currentPage === 'crm') {
              App.renderCRMPipeline();
            }
          } catch (error) {
            Toast.show('error', 'Error', error.message);
          }
        }
      });
    });

    // Editable fields (click to edit)
    document.querySelectorAll('.info-row--editable').forEach(row => {
      row.addEventListener('click', (e) => {
        if (row.classList.contains('info-row--editing')) return;

        const field = row.dataset.field;
        const type = row.dataset.type || 'text';
        const valueSpan = row.querySelector('.info-row__value');
        const currentValue = lead[field] || '';

        // Mark as editing
        row.classList.add('info-row--editing');

        // Create input
        let input;
        if (type === 'textarea') {
          input = document.createElement('textarea');
          input.className = 'inline-edit-input';
          input.rows = 3;
        } else {
          input = document.createElement('input');
          input.type = type;
          input.className = 'inline-edit-input';
        }
        input.value = currentValue;
        input.placeholder = valueSpan.textContent;

        // Replace value with input
        const originalHTML = valueSpan.innerHTML;
        valueSpan.innerHTML = '';
        valueSpan.appendChild(input);
        input.focus();
        input.select();

        // Save on blur or Enter
        const saveEdit = async () => {
          const newValue = input.value.trim();
          row.classList.remove('info-row--editing');

          if (newValue !== currentValue) {
            valueSpan.innerHTML = newValue || `Agregar ${field}...`;
            try {
              await DataStore.updateLeadViaAPI(leadId, { [field]: newValue || null });
              Toast.show('success', 'Guardado');
              // Update local cache
              lead[field] = newValue || null;
            } catch (error) {
              valueSpan.innerHTML = originalHTML;
              Toast.show('error', 'Error', error.message);
            }
          } else {
            valueSpan.innerHTML = originalHTML;
          }
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && type !== 'textarea') {
            e.preventDefault();
            input.blur();
          }
          if (e.key === 'Escape') {
            row.classList.remove('info-row--editing');
            valueSpan.innerHTML = originalHTML;
          }
        });
      });
    });

    // Editable name (in header)
    const nameSpan = document.querySelector('.lead-info__name.info-row--editable');
    if (nameSpan) {
      nameSpan.addEventListener('click', () => {
        if (nameSpan.classList.contains('info-row--editing')) return;

        const currentValue = lead.name || '';
        nameSpan.classList.add('info-row--editing');

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'inline-edit-input';
        input.value = currentValue;
        input.style.fontSize = 'inherit';
        input.style.fontWeight = 'inherit';

        const originalHTML = nameSpan.innerHTML;
        nameSpan.innerHTML = '';
        nameSpan.appendChild(input);
        input.focus();
        input.select();

        const saveEdit = async () => {
          const newValue = input.value.trim();
          nameSpan.classList.remove('info-row--editing');

          if (newValue && newValue !== currentValue) {
            nameSpan.textContent = newValue;
            try {
              await DataStore.updateLeadViaAPI(leadId, { name: newValue });
              Toast.show('success', 'Nombre actualizado');
              lead.name = newValue;
              // Update avatar
              const avatar = document.querySelector('.lead-avatar');
              if (avatar) avatar.textContent = Utils.getInitials(newValue);
            } catch (error) {
              nameSpan.innerHTML = originalHTML;
              Toast.show('error', 'Error', error.message);
            }
          } else {
            nameSpan.innerHTML = originalHTML;
          }
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            input.blur();
          }
          if (e.key === 'Escape') {
            nameSpan.classList.remove('info-row--editing');
            nameSpan.innerHTML = originalHTML;
          }
        });
      });
    }

    // Property card click
    document.getElementById('lead-property-card')?.addEventListener('click', (e) => {
      const propertyId = e.currentTarget.dataset.property;
      if (propertyId) {
        this.close();
        setTimeout(() => this.property(propertyId), 300);
      }
    });

    // Toggle note form
    const noteForm = document.getElementById('add-note-form');
    const toggleBtn = document.getElementById('toggle-note-form');
    const cancelBtn = document.getElementById('cancel-note');
    const saveBtn = document.getElementById('save-note');
    const noteTextarea = document.getElementById('new-note-text');

    toggleBtn?.addEventListener('click', () => {
      noteForm.style.display = noteForm.style.display === 'none' ? 'block' : 'none';
      if (noteForm.style.display === 'block') {
        noteTextarea.focus();
      }
    });

    cancelBtn?.addEventListener('click', () => {
      noteForm.style.display = 'none';
      noteTextarea.value = '';
    });

    saveBtn?.addEventListener('click', async () => {
      const newNote = noteTextarea.value.trim();
      if (newNote) {
        // Append to existing notes or create new
        const timestamp = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const updatedNotes = lead.notes
          ? `${lead.notes}\n\n[${timestamp}] ${newNote}`
          : `[${timestamp}] ${newNote}`;

        try {
          await DataStore.updateLeadViaAPI(leadId, { notes: updatedNotes });
          Toast.show('success', 'Nota agregada');

          // Refresh panel
          this.close();
          setTimeout(() => this.lead(leadId), 100);
        } catch (error) {
          Toast.show('error', 'Error', error.message);
        }
      }
    });

    // Add Task button
    document.getElementById('add-lead-task')?.addEventListener('click', () => {
      Modals.quickTask(leadId);
    });

    // Quick Activity buttons
    document.querySelectorAll('.quick-activity-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const activityType = btn.dataset.activity;
        if (activityType) {
          Modals.quickActivity(leadId, activityType);
        }
      });
    });

    // Full activity modal button
    document.getElementById('open-full-activity-modal')?.addEventListener('click', () => {
      Modals.newActivity(leadId);
    });

    // Load more activities button
    document.getElementById('load-more-activities')?.addEventListener('click', async () => {
      try {
        const activities = await DataStore.getLeadActivitiesViaAPI(leadId, { limit: 100 });
        // Re-render timeline with all activities
        const timeline = document.querySelector('.timeline--enhanced');
        if (timeline && activities) {
          timeline.innerHTML = activities.map(a => Components.activityItem(a)).join('');
          lucide.createIcons();
        }
        // Remove the button
        document.getElementById('load-more-activities')?.remove();
      } catch (error) {
        Toast.show('error', 'Error', 'No se pudieron cargar las actividades');
      }
    });

    // Load tasks for this lead
    this.loadLeadTasks(leadId);
  },

  // Load and render tasks for a lead
  async loadLeadTasks(leadId) {
    const tasksContainer = document.getElementById('lead-tasks-list');
    if (!tasksContainer) return;

    try {
      const response = await API.getTasks({ leadId });

      if (response.success && response.tasks) {
        const tasks = response.tasks;

        if (tasks.length === 0) {
          tasksContainer.innerHTML = `
            <div style="text-align: center; padding: 1rem; color: var(--text-tertiary);">
              <i data-lucide="check-circle" style="width: 24px; height: 24px; margin-bottom: 0.5rem; opacity: 0.5;"></i>
              <p style="font-size: var(--font-size-sm);">Sin tareas pendientes</p>
            </div>
          `;
        } else {
          tasksContainer.innerHTML = tasks.map(task => this.renderTaskItem(task)).join('');

          // Add event listeners for task actions
          tasksContainer.querySelectorAll('.task-complete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              e.stopPropagation();
              const taskId = btn.dataset.taskId;
              try {
                await DataStore.completeTaskViaAPI(taskId);
                Toast.show('success', 'Tarea completada');
                this.loadLeadTasks(leadId);
              } catch (error) {
                Toast.show('error', 'Error', error.message);
              }
            });
          });

          tasksContainer.querySelectorAll('.task-item').forEach(item => {
            item.addEventListener('click', () => {
              const taskId = item.dataset.taskId;
              Modals.editTask(taskId);
            });
          });
        }

        lucide.createIcons();
      } else {
        tasksContainer.innerHTML = `
          <div style="text-align: center; padding: 1rem; color: var(--text-tertiary);">
            <p style="font-size: var(--font-size-sm);">Error al cargar tareas</p>
          </div>
        `;
      }
    } catch (error) {
      tasksContainer.innerHTML = `
        <div style="text-align: center; padding: 1rem; color: var(--text-tertiary);">
          <p style="font-size: var(--font-size-sm);">Error al cargar tareas</p>
        </div>
      `;
    }
  },

  // Render a single task item
  renderTaskItem(task) {
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completada';
    const priorityColors = {
      'alta': '#EF4444',
      'media': '#F59E0B',
      'baja': '#10B981'
    };
    const priorityColor = priorityColors[task.priority] || '#F59E0B';

    return `
      <div class="task-item ${isOverdue ? 'task-item--overdue' : ''} ${task.status === 'completada' ? 'task-item--completed' : ''}"
           data-task-id="${task.id}"
           style="
             display: flex;
             align-items: flex-start;
             gap: 0.75rem;
             padding: 0.75rem;
             background: var(--bg-secondary);
             border-radius: var(--radius-md);
             margin-bottom: 0.5rem;
             cursor: pointer;
             transition: background 0.2s;
             border-left: 3px solid ${priorityColor};
           ">
        <button class="task-complete-btn"
                data-task-id="${task.id}"
                style="
                  flex-shrink: 0;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  border: 2px solid ${task.status === 'completada' ? 'var(--accent-green)' : 'var(--border-color)'};
                  background: ${task.status === 'completada' ? 'var(--accent-green)' : 'transparent'};
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 0;
                ">
          ${task.status === 'completada' ? '<i data-lucide="check" style="width: 12px; height: 12px; color: white;"></i>' : ''}
        </button>
        <div style="flex: 1; min-width: 0;">
          <div style="
            font-size: var(--font-size-sm);
            font-weight: 500;
            color: ${task.status === 'completada' ? 'var(--text-tertiary)' : 'var(--text-primary)'};
            text-decoration: ${task.status === 'completada' ? 'line-through' : 'none'};
            margin-bottom: 0.25rem;
          ">
            ${task.title}
          </div>
          <div style="
            font-size: var(--font-size-xs);
            color: ${isOverdue ? 'var(--accent-red)' : 'var(--text-tertiary)'};
            display: flex;
            align-items: center;
            gap: 0.5rem;
          ">
            <i data-lucide="calendar" style="width: 12px; height: 12px;"></i>
            ${Utils.formatDate(task.dueDate, 'short')}
            ${isOverdue ? '<span style="color: var(--accent-red);">(Vencida)</span>' : ''}
          </div>
        </div>
      </div>
    `;
  },

  // Transaction Detail Panel
  transaction(transactionId) {
    const txn = DataStore.getTransactionById(transactionId);
    if (!txn) return;

    const isIncome = txn.type === 'ingreso';

    const content = `
      <div class="panel__header">
        <h2 class="panel__title">Detalle de Transacción</h2>
        <div class="panel__actions">
          <button class="btn btn--ghost btn--icon" title="Editar">
            <i data-lucide="pencil"></i>
          </button>
          <button class="btn btn--ghost btn--icon" title="Cerrar" id="panel-close">
            <i data-lucide="x"></i>
          </button>
        </div>
      </div>
      <div class="panel__body">
        <!-- Transaction Header -->
        <div class="transaction-header">
          <span class="transaction-amount transaction-amount--${isIncome ? 'income' : 'expense'}">
            ${isIncome ? '+' : '-'}${Utils.formatCurrency(txn.amount, txn.currency)}
          </span>
          <span class="transaction-date">${Utils.formatDate(txn.date, 'long')}</span>
        </div>

        <!-- Status -->
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <span class="badge ${Utils.getStatusClass(txn.status)}">${Utils.getStatusLabel(txn.status)}</span>
        </div>

        <!-- Transaction Info -->
        <div class="panel__section">
          <h3 class="panel__section-title">Información</h3>
          <div class="info-row">
            <span class="info-row__label">Tipo</span>
            <span class="info-row__value">${isIncome ? 'Ingreso' : 'Egreso'}</span>
          </div>
          <div class="info-row">
            <span class="info-row__label">Categoría</span>
            <span class="info-row__value">${txn.category}</span>
          </div>
          <div class="info-row">
            <span class="info-row__label">Descripción</span>
            <span class="info-row__value">${txn.description}</span>
          </div>
          <div class="info-row">
            <span class="info-row__label">Método de Pago</span>
            <span class="info-row__value">${txn.paymentMethod || '-'}</span>
          </div>
          ${txn.invoice ? `
            <div class="info-row">
              <span class="info-row__label">Comprobante</span>
              <span class="info-row__value">${txn.invoice}</span>
            </div>
          ` : ''}
        </div>

        <!-- Related Property -->
        ${txn.property ? `
          <div class="panel__section">
            <h3 class="panel__section-title">Propiedad Relacionada</h3>
            <div class="property-card property-card--mini" style="cursor: pointer;">
              <div class="property-card__image" style="height: 80px;">
                <div class="property-card__placeholder">
                  <i data-lucide="image"></i>
                </div>
              </div>
              <div class="property-card__content" style="padding: 0.75rem;">
                <h4 style="font-size: var(--font-size-sm); margin-bottom: 0.25rem;">${txn.property.title}</h4>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Related Contact -->
        ${txn.contact ? `
          <div class="panel__section">
            <h3 class="panel__section-title">Contacto Relacionado</h3>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div class="user-avatar">${Utils.getInitials(txn.contact.name)}</div>
              <span style="font-weight: 500; color: var(--text-primary);">${txn.contact.name}</span>
            </div>
          </div>
        ` : ''}

        <!-- Agent -->
        ${txn.agent ? `
          <div class="panel__section">
            <h3 class="panel__section-title">Agente</h3>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div class="user-avatar">${Utils.getInitials(txn.agent.name)}</div>
              <span style="font-weight: 500; color: var(--text-primary);">${txn.agent.name}</span>
            </div>
          </div>
        ` : ''}

        <!-- Notes -->
        ${txn.notes ? `
          <div class="panel__section">
            <h3 class="panel__section-title">Notas</h3>
            <p style="color: var(--text-secondary); font-size: var(--font-size-sm); line-height: 1.6;">
              ${txn.notes}
            </p>
          </div>
        ` : ''}

        <!-- Actions -->
        <div class="panel__section">
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn--outline" style="flex: 1;">
              <i data-lucide="download"></i>
              Descargar
            </button>
            <button class="btn btn--outline" style="flex: 1;">
              <i data-lucide="printer"></i>
              Imprimir
            </button>
          </div>
        </div>
      </div>
    `;

    this.open(content);
    document.getElementById('panel-close').addEventListener('click', () => this.close());
  },

  // Rental/Contract Detail Panel
  rental(rentalId) {
    const rental = DataStore.getRentalById(rentalId);
    if (!rental) {
      Toast.show('error', 'Contrato no encontrado');
      return;
    }

    const daysUntilExpiration = Math.ceil((new Date(rental.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    const daysUntilAdjustment = Math.ceil((new Date(rental.nextAdjustmentDate) - new Date()) / (1000 * 60 * 60 * 24));
    const isExpiring = daysUntilExpiration <= 90 && daysUntilExpiration > 0;
    const isExpired = daysUntilExpiration <= 0;

    const content = `
      <div class="panel__header">
        <h2 class="panel__title">Detalle del Contrato</h2>
        <div class="panel__actions">
          <button class="btn btn--ghost btn--icon" id="panel-edit" title="Editar">
            <i data-lucide="pencil"></i>
          </button>
          <button class="btn btn--ghost btn--icon" title="Cerrar" id="panel-close">
            <i data-lucide="x"></i>
          </button>
        </div>
      </div>
      <div class="panel__body">
        <!-- Status Banner -->
        <div class="rental-status-banner rental-status-banner--${rental.status}">
          <span class="badge badge--lg ${
            rental.status === 'activo' ? 'badge--success' :
            rental.status === 'vencido' ? 'badge--error' :
            rental.status === 'rescindido' ? 'badge--warning' : 'badge--info'
          }">${Utils.capitalize(rental.status)}</span>
          ${isExpiring ? `<span class="badge badge--warning">Vence en ${daysUntilExpiration} días</span>` : ''}
          ${isExpired ? `<span class="badge badge--error">Vencido</span>` : ''}
        </div>

        <!-- Monthly Rent -->
        <div class="rental-amount-display">
          <span class="rental-amount">${Utils.formatCurrency(rental.monthlyRent, rental.currency)}</span>
          <span class="rental-period">/mes</span>
        </div>

        <!-- Property Info -->
        <div class="panel__section">
          <h3 class="panel__section-title">
            <i data-lucide="home"></i>
            Propiedad
          </h3>
          ${rental.property ? `
            <div class="rental-property-card">
              <div class="rental-property-card__icon">
                <i data-lucide="building"></i>
              </div>
              <div class="rental-property-card__info">
                <span class="rental-property-card__title">${rental.property.title || rental.property.address}</span>
                <span class="rental-property-card__address">${rental.property.address}</span>
              </div>
            </div>
          ` : '<p style="color: var(--text-muted);">Sin propiedad asignada</p>'}
        </div>

        <!-- Contract Dates -->
        <div class="panel__section">
          <h3 class="panel__section-title">
            <i data-lucide="calendar"></i>
            Vigencia
          </h3>
          <div class="info-row">
            <span class="info-row__label">Inicio</span>
            <span class="info-row__value">${Utils.formatDate(rental.startDate, 'long')}</span>
          </div>
          <div class="info-row">
            <span class="info-row__label">Vencimiento</span>
            <span class="info-row__value ${isExpiring ? 'text-warning' : ''} ${isExpired ? 'text-error' : ''}">${Utils.formatDate(rental.endDate, 'long')}</span>
          </div>
          <div class="info-row">
            <span class="info-row__label">Día de pago</span>
            <span class="info-row__value">${rental.paymentDay} de cada mes</span>
          </div>
        </div>

        <!-- Adjustments -->
        <div class="panel__section">
          <h3 class="panel__section-title">
            <i data-lucide="trending-up"></i>
            Ajustes
          </h3>
          <div class="info-row">
            <span class="info-row__label">Frecuencia</span>
            <span class="info-row__value">${Utils.capitalize(rental.adjustmentFrequency || 'trimestral')}</span>
          </div>
          <div class="info-row">
            <span class="info-row__label">Porcentaje</span>
            <span class="info-row__value">${rental.adjustmentPercentage}%</span>
          </div>
          <div class="info-row">
            <span class="info-row__label">Próximo ajuste</span>
            <span class="info-row__value ${daysUntilAdjustment <= 30 ? 'text-warning' : ''}">${Utils.formatDate(rental.nextAdjustmentDate, 'long')}</span>
          </div>
        </div>

        <!-- Parties -->
        <div class="panel__section">
          <h3 class="panel__section-title">
            <i data-lucide="users"></i>
            Partes
          </h3>
          ${rental.propietario ? `
            <div class="rental-party">
              <div class="rental-party__label">Propietario</div>
              <div class="rental-party__info">
                <span class="rental-party__name">${rental.propietario.name}</span>
                ${rental.propietario.phone ? `<a href="tel:${rental.propietario.phone}" class="rental-party__contact"><i data-lucide="phone" style="width:14px;height:14px;"></i> ${rental.propietario.phone}</a>` : ''}
                ${rental.propietario.email ? `<a href="mailto:${rental.propietario.email}" class="rental-party__contact"><i data-lucide="mail" style="width:14px;height:14px;"></i> ${rental.propietario.email}</a>` : ''}
              </div>
            </div>
          ` : ''}
          ${rental.inquilino ? `
            <div class="rental-party">
              <div class="rental-party__label">Inquilino</div>
              <div class="rental-party__info">
                <span class="rental-party__name">${rental.inquilino.name}</span>
                ${rental.inquilino.phone ? `<a href="tel:${rental.inquilino.phone}" class="rental-party__contact"><i data-lucide="phone" style="width:14px;height:14px;"></i> ${rental.inquilino.phone}</a>` : ''}
                ${rental.inquilino.email ? `<a href="mailto:${rental.inquilino.email}" class="rental-party__contact"><i data-lucide="mail" style="width:14px;height:14px;"></i> ${rental.inquilino.email}</a>` : ''}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Guarantor -->
        ${rental.guarantor || rental.guarantorName ? `
          <div class="panel__section">
            <h3 class="panel__section-title">
              <i data-lucide="shield-check"></i>
              Garante
            </h3>
            <div class="info-row">
              <span class="info-row__label">Nombre</span>
              <span class="info-row__value">${rental.guarantor?.name || rental.guarantorName || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">Teléfono</span>
              <span class="info-row__value">${rental.guarantor?.phone || rental.guarantorPhone || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">Relación</span>
              <span class="info-row__value">${rental.guarantor?.relationship || rental.guarantorRelationship || '-'}</span>
            </div>
          </div>
        ` : ''}

        <!-- Deposit -->
        <div class="panel__section">
          <h3 class="panel__section-title">
            <i data-lucide="wallet"></i>
            Depósito
          </h3>
          <div class="rental-deposit">
            ${Utils.formatCurrency(rental.depositAmount, rental.currency)}
          </div>
        </div>

        <!-- Notes -->
        ${rental.notes ? `
          <div class="panel__section">
            <h3 class="panel__section-title">
              <i data-lucide="file-text"></i>
              Notas
            </h3>
            <p style="color: var(--text-secondary); font-size: var(--font-size-sm); line-height: 1.6; white-space: pre-wrap;">
              ${rental.notes}
            </p>
          </div>
        ` : ''}

        <!-- Actions -->
        <div class="panel__section">
          <div style="display: flex; gap: 0.5rem; flex-direction: column;">
            <button class="btn btn--primary" id="rental-generate-receipt">
              <i data-lucide="receipt"></i>
              Generar Recibo
            </button>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn--outline" style="flex: 1;" id="rental-apply-adjustment">
                <i data-lucide="calculator"></i>
                Aplicar Ajuste
              </button>
              <button class="btn btn--outline" style="flex: 1;" id="rental-renew">
                <i data-lucide="refresh-cw"></i>
                Renovar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.open(content);

    document.getElementById('panel-close').addEventListener('click', () => this.close());
    document.getElementById('panel-edit')?.addEventListener('click', () => {
      this.close();
      Modals.editRental(rentalId);
    });

    document.getElementById('rental-generate-receipt')?.addEventListener('click', () => {
      Toast.show('info', 'Generar Recibo', 'Funcionalidad en desarrollo');
    });

    document.getElementById('rental-apply-adjustment')?.addEventListener('click', () => {
      Toast.show('info', 'Aplicar Ajuste', 'Funcionalidad en desarrollo');
    });

    document.getElementById('rental-renew')?.addEventListener('click', () => {
      Toast.show('info', 'Renovar Contrato', 'Funcionalidad en desarrollo');
    });
  },

  // User Detail Panel
  user(userId) {
    const user = DataStore.getUserById(userId);
    if (!user) {
      Toast.show('error', 'Usuario no encontrado');
      return;
    }

    // Get user statistics
    const userLeads = DataStore.leads?.filter(l => l.assignedTo === userId) || [];
    const activeLeads = userLeads.filter(l => !['cerrado', 'perdido'].includes(l.stage));
    const wonLeads = userLeads.filter(l => l.stage === 'cerrado');
    const userProperties = DataStore.properties?.filter(p => p.agent?.id === userId) || [];

    const content = `
      <div class="panel__header">
        <h2 class="panel__title">Detalle del Usuario</h2>
        <div class="panel__actions">
          <button class="btn btn--ghost btn--icon" title="Editar" id="panel-edit">
            <i data-lucide="pencil"></i>
          </button>
          <button class="btn btn--ghost btn--icon" title="Cerrar" id="panel-close">
            <i data-lucide="x"></i>
          </button>
        </div>
      </div>
      <div class="panel__body">
        <!-- User Header -->
        <div class="user-panel-header">
          <div class="user-panel-avatar">${user.avatar || Utils.getInitials(user.name)}</div>
          <div class="user-panel-info">
            <span class="user-panel-name">${user.name}</span>
            <div class="user-panel-badges">
              <span class="badge ${Utils.getRoleClass(user.role)}">${Utils.getRoleLabel(user.role)}</span>
              <span class="badge badge--sm ${user.status === 'activo' ? 'badge--success' : 'badge--secondary'}">
                ${user.status === 'activo' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        <!-- Contact Info -->
        <div class="panel__section">
          <h3 class="panel__section-title">
            <i data-lucide="contact"></i>
            Información de Contacto
          </h3>
          <div class="info-row">
            <span class="info-row__label">Email</span>
            <span class="info-row__value">
              <a href="mailto:${user.email}" style="color: var(--text-primary);">${user.email}</a>
            </span>
          </div>
          <div class="info-row">
            <span class="info-row__label">Teléfono</span>
            <span class="info-row__value">
              ${user.phone ? `<a href="tel:${user.phone}" style="color: var(--text-primary);">${user.phone}</a>` : '-'}
            </span>
          </div>
          ${user.createdAt && !isNaN(new Date(user.createdAt).getTime()) ? `
            <div class="info-row">
              <span class="info-row__label">Fecha de Alta</span>
              <span class="info-row__value">${Utils.formatDate(user.createdAt, 'long')}</span>
            </div>
          ` : ''}
        </div>

        <!-- Statistics -->
        <div class="panel__section">
          <h3 class="panel__section-title">
            <i data-lucide="bar-chart-3"></i>
            Estadísticas
          </h3>
          <div class="user-stats-grid">
            <div class="user-stat-card">
              <span class="user-stat-value">${activeLeads.length}</span>
              <span class="user-stat-label">Leads Activos</span>
            </div>
            <div class="user-stat-card">
              <span class="user-stat-value">${wonLeads.length}</span>
              <span class="user-stat-label">Leads Ganados</span>
            </div>
            <div class="user-stat-card">
              <span class="user-stat-value">${userProperties.length}</span>
              <span class="user-stat-label">Propiedades</span>
            </div>
            <div class="user-stat-card">
              <span class="user-stat-value">${user.stats?.ventasMes || 0}</span>
              <span class="user-stat-label">Ventas/Mes</span>
            </div>
          </div>
        </div>

        <!-- Recent Leads -->
        ${activeLeads.length > 0 ? `
          <div class="panel__section">
            <h3 class="panel__section-title">
              <i data-lucide="users"></i>
              Leads Asignados Recientes
            </h3>
            <div class="user-leads-list">
              ${activeLeads.slice(0, 5).map(lead => {
                const stage = DataStore.leadStages.find(s => s.id === lead.stage);
                return `
                  <div class="user-lead-item" data-lead-id="${lead.id}">
                    <div class="user-lead-avatar">${Utils.getInitials(lead.name)}</div>
                    <div class="user-lead-info">
                      <span class="user-lead-name">${lead.name}</span>
                      <span class="user-lead-property">${lead.property?.title || 'Sin propiedad'}</span>
                    </div>
                    <span class="badge badge--sm" style="background: ${stage?.color}20; color: ${stage?.color};">
                      ${Utils.getStatusLabel(lead.stage)}
                    </span>
                  </div>
                `;
              }).join('')}
            </div>
            ${activeLeads.length > 5 ? `
              <p style="text-align: center; margin-top: 0.75rem;">
                <a href="#crm" style="color: var(--accent-cyan); font-size: var(--font-size-sm);">
                  Ver todos los leads (${activeLeads.length})
                </a>
              </p>
            ` : ''}
          </div>
        ` : ''}

        <!-- Actions -->
        <div class="panel__section">
          <h3 class="panel__section-title">
            <i data-lucide="settings"></i>
            Acciones
          </h3>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <button class="btn btn--primary" id="user-panel-edit">
              <i data-lucide="pencil"></i>
              Editar Usuario
            </button>
            <button class="btn btn--outline" id="user-panel-reset-password">
              <i data-lucide="key"></i>
              Resetear Contraseña
            </button>
            ${user.status === 'activo' ? `
              <button class="btn btn--ghost" style="color: var(--accent-orange);" id="user-panel-deactivate">
                <i data-lucide="user-x"></i>
                Desactivar Usuario
              </button>
            ` : `
              <button class="btn btn--ghost" style="color: var(--accent-green);" id="user-panel-activate">
                <i data-lucide="user-check"></i>
                Activar Usuario
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    this.open(content);

    // Event listeners
    document.getElementById('panel-close').addEventListener('click', () => this.close());

    document.getElementById('panel-edit')?.addEventListener('click', () => {
      this.close();
      Modals.editUser(userId);
    });

    document.getElementById('user-panel-edit')?.addEventListener('click', () => {
      this.close();
      Modals.editUser(userId);
    });

    document.getElementById('user-panel-reset-password')?.addEventListener('click', () => {
      this.close();
      Modals.editUser(userId);
      // Focus on password field after modal opens
      setTimeout(() => {
        const passwordField = document.getElementById('edit-user-password');
        if (passwordField) passwordField.focus();
      }, 300);
    });

    document.getElementById('user-panel-deactivate')?.addEventListener('click', async () => {
      if (confirm('¿Estás seguro de que querés desactivar este usuario?')) {
        try {
          await DataStore.updateUserViaAPI(userId, { status: 'inactivo' });
          Toast.show('success', 'Usuario desactivado');
          this.user(userId); // Refresh panel
          if (typeof App !== 'undefined' && App.currentPage === 'usuarios') {
            App.renderUsersTable();
          }
        } catch (error) {
          Toast.show('error', 'Error', error.message);
        }
      }
    });

    document.getElementById('user-panel-activate')?.addEventListener('click', async () => {
      try {
        await DataStore.updateUserViaAPI(userId, { status: 'activo' });
        Toast.show('success', 'Usuario activado');
        this.user(userId); // Refresh panel
        if (typeof App !== 'undefined' && App.currentPage === 'usuarios') {
          App.renderUsersTable();
        }
      } catch (error) {
        Toast.show('error', 'Error', error.message);
      }
    });

    // Lead item clicks
    document.querySelectorAll('.user-lead-item').forEach(item => {
      item.addEventListener('click', () => {
        const leadId = item.dataset.leadId;
        this.lead(leadId);
      });
    });
  },

  // Contact Detail Panel
  contact(contactId) {
    const contact = DataStore.getContactById(contactId);
    if (!contact) {
      Toast.show('error', 'Contacto no encontrado');
      return;
    }

    const typeLabel = Utils.getContactTypeLabel(contact.type);
    const initials = Utils.getInitials(contact.name);

    const content = `
      <div class="panel__header">
        <h2 class="panel__title">Detalle del Contacto</h2>
        <div class="panel__actions">
          <button class="btn btn--ghost btn--icon" title="Editar" id="panel-edit">
            <i data-lucide="pencil"></i>
          </button>
          <button class="btn btn--ghost btn--icon" title="Cerrar" id="panel-close">
            <i data-lucide="x"></i>
          </button>
        </div>
      </div>
      <div class="panel__body">
        <!-- Contact Header -->
        <div class="contact-panel-header" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
          <div class="contact-avatar" style="width: 64px; height: 64px; font-size: 1.5rem;">${initials}</div>
          <div>
            <h3 style="font-size: var(--font-size-lg); font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">${contact.name}</h3>
            <span class="badge badge--secondary">${typeLabel}</span>
          </div>
        </div>

        <!-- Contact Info -->
        <div class="panel__section">
          <h3 class="panel__section-title">
            <i data-lucide="contact"></i>
            Información de Contacto
          </h3>
          <div class="info-row">
            <span class="info-row__label">Email</span>
            <span class="info-row__value">
              ${contact.email ? `<a href="mailto:${contact.email}" style="color: var(--accent-cyan);">${contact.email}</a>` : '-'}
            </span>
          </div>
          <div class="info-row">
            <span class="info-row__label">Teléfono</span>
            <span class="info-row__value">
              ${contact.phone ? `<a href="tel:${contact.phone}" style="color: var(--text-primary);">${contact.phone}</a>` : '-'}
            </span>
          </div>
          <div class="info-row">
            <span class="info-row__label">Móvil</span>
            <span class="info-row__value">
              ${contact.mobile ? `<a href="tel:${contact.mobile}" style="color: var(--text-primary);">${contact.mobile}</a>` : '-'}
            </span>
          </div>
        </div>

        <!-- Address -->
        ${contact.address ? `
          <div class="panel__section">
            <h3 class="panel__section-title">
              <i data-lucide="map-pin"></i>
              Dirección
            </h3>
            <p style="color: var(--text-secondary); font-size: var(--font-size-sm);">
              ${contact.address}
            </p>
          </div>
        ` : ''}

        <!-- Referred By -->
        ${contact.referredBy ? `
          <div class="panel__section">
            <h3 class="panel__section-title">
              <i data-lucide="user-check"></i>
              Referido por
            </h3>
            <p style="color: var(--text-secondary); font-size: var(--font-size-sm);">
              ${contact.referredBy}
            </p>
          </div>
        ` : ''}

        <!-- Notes -->
        ${contact.notes ? `
          <div class="panel__section">
            <h3 class="panel__section-title">
              <i data-lucide="file-text"></i>
              Notas
            </h3>
            <p style="color: var(--text-secondary); font-size: var(--font-size-sm); line-height: 1.6; white-space: pre-wrap;">
              ${contact.notes}
            </p>
          </div>
        ` : ''}

        <!-- Quick Actions -->
        <div class="panel__section">
          <h3 class="panel__section-title">
            <i data-lucide="zap"></i>
            Acciones Rápidas
          </h3>
          <div style="display: flex; gap: 0.5rem;">
            ${contact.phone ? `
              <a href="tel:${contact.phone}" class="btn btn--outline" style="flex: 1;">
                <i data-lucide="phone"></i>
                Llamar
              </a>
            ` : ''}
            ${contact.email ? `
              <a href="mailto:${contact.email}" class="btn btn--outline" style="flex: 1;">
                <i data-lucide="mail"></i>
                Email
              </a>
            ` : ''}
            ${contact.phone ? `
              <a href="https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}" target="_blank" class="btn btn--outline" style="flex: 1;">
                <i data-lucide="message-circle"></i>
                WhatsApp
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    this.open(content);
    this.setupContactPanelEvents(contactId);
  },

  // Setup events for contact panel
  setupContactPanelEvents(contactId) {
    // Close button
    document.getElementById('panel-close').addEventListener('click', () => this.close());

    // Edit button
    document.getElementById('panel-edit')?.addEventListener('click', () => {
      this.close();
      Modals.editContact(contactId);
    });
  }
};
