/**
 * DOMUM - UI Components
 * Reusable component templates
 */

const Components = {
  // Metric Card
  metricCard(data) {
    const { title, value, subtitle, icon, trend, trendValue, color = 'cyan' } = data;
    const trendClass = trend === 'up' ? 'trend--up' : trend === 'down' ? 'trend--down' : '';
    const trendIcon = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : '';

    return `
      <div class="metric-card">
        <div class="metric-card__icon metric-card__icon--${color}">
          <i data-lucide="${icon}"></i>
        </div>
        <div class="metric-card__content">
          <span class="metric-card__title">${title}</span>
          <span class="metric-card__value">${value}</span>
          ${subtitle ? `<span class="metric-card__subtitle">${subtitle}</span>` : ''}
          ${trend ? `
            <span class="metric-card__trend ${trendClass}">
              <i data-lucide="${trendIcon}"></i>
              ${trendValue}
            </span>
          ` : ''}
        </div>
      </div>
    `;
  },

  // Imágenes de Unsplash según tipo de propiedad
  imagesByType: {
    departamento: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop'
    ],
    casa: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop'
    ],
    ph: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop'
    ],
    oficina: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800&h=600&fit=crop'
    ],
    local: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop'
    ],
    terreno: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=800&h=600&fit=crop'
    ],
    cochera: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
    ],
    quinta: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop'
    ],
    duplex: [
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop'
    ]
  },

  // Property Card - Una imagen para la card
  getPropertyImage(property) {
    // Use actual property images if available
    if (property.images && property.images.length > 0) {
      const imgUrl = property.images[0];
      // If it's a relative URL (from our server), get full URL via API
      return imgUrl.startsWith('/') ? API.getImageUrl(imgUrl) : imgUrl;
    }

    // Fallback to stock images
    const images = this.imagesByType[property.type] || this.imagesByType.departamento;
    const index = parseInt(property.id.replace(/\D/g, '') || '0') % images.length;
    return images[index].replace('w=800&h=600', 'w=400&h=300');
  },

  // Property Gallery - Todas las imágenes para el detalle
  getPropertyImages(property) {
    // Use actual property images if available
    if (property.images && property.images.length > 0) {
      return property.images.map(imgUrl =>
        imgUrl.startsWith('/') ? API.getImageUrl(imgUrl) : imgUrl
      );
    }

    // Fallback to stock images
    const images = this.imagesByType[property.type] || this.imagesByType.departamento;
    // Rotar las imágenes basado en el ID para variedad
    const startIndex = parseInt(property.id.replace(/\D/g, '') || '0') % images.length;
    const rotated = [...images.slice(startIndex), ...images.slice(0, startIndex)];
    return rotated;
  },

  propertyCard(property) {
    const statusClass = Utils.getStatusClass(property.status);
    const statusLabel = Utils.getStatusLabel(property.status);
    const price = Utils.formatCurrency(property.price, property.currency);
    const typeLabel = Utils.getPropertyTypeLabel(property.type);
    const imageUrl = this.getPropertyImage(property);
    const isRental = property.operation === 'alquiler' || property.operation === 'alquiler_temporario';
    const priceLabel = isRental ? `${price}/mes` : price;

    return `
      <div class="property-card" data-id="${property.id}">
        <div class="property-card__image" style="background-image: url('${imageUrl}')">
          <div class="property-card__overlay">
            <span class="property-card__price-overlay">${priceLabel}</span>
          </div>
          <span class="property-card__badge badge ${statusClass}">${statusLabel}</span>
          <span class="property-card__operation">${Utils.getOperationLabel(property.operation)}</span>
        </div>
        <div class="property-card__content">
          <h3 class="property-card__title">${property.title}</h3>
          <p class="property-card__address">
            <i data-lucide="map-pin"></i>
            ${property.address}, ${property.neighborhood}
          </p>
          <div class="property-card__features">
            ${property.bedrooms > 0 ? `
              <span class="property-card__feature">
                <i data-lucide="bed"></i> ${property.bedrooms}
              </span>
            ` : ''}
            ${property.bathrooms > 0 ? `
              <span class="property-card__feature">
                <i data-lucide="bath"></i> ${property.bathrooms}
              </span>
            ` : ''}
            <span class="property-card__feature">
              <i data-lucide="square"></i> ${property.area}m²
            </span>
          </div>
          <div class="property-card__footer">
            <span class="property-card__type">${typeLabel}</span>
          </div>
        </div>
      </div>
    `;
  },

  // Lead Card (for CRM pipeline)
  leadCard(lead) {
    const initials = Utils.getInitials(lead.name);
    const property = lead.property ? lead.property.title : 'Sin propiedad asignada';

    // Generate follow-up HTML if exists
    let followUpHtml = '';
    if (lead.followUp) {
      const followUpDate = new Date(lead.followUp.date);
      const day = String(followUpDate.getDate()).padStart(2, '0');
      const month = String(followUpDate.getMonth() + 1).padStart(2, '0');
      const year = followUpDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;

      let statusClass = 'upcoming';
      let statusIcon = 'calendar';
      let statusLabel = formattedDate;

      if (lead.followUp.isOverdue) {
        statusClass = 'overdue';
        statusIcon = 'alert-circle';
        statusLabel = `Vencido ${formattedDate}`;
      } else if (lead.followUp.isToday) {
        statusClass = 'today';
        statusIcon = 'bell';
        statusLabel = 'Hoy';
      }

      followUpHtml = `
        <div class="lead-card__followup lead-card__followup--${statusClass}"
             data-followup-lead="${lead.id}"
             title="Click para completar seguimiento">
          <i data-lucide="${statusIcon}"></i>
          Seguimiento: ${statusLabel}
        </div>
      `;
    }

    return `
      <div class="lead-card" data-id="${lead.id}" draggable="true">
        <div class="lead-card__header">
          <div class="lead-card__avatar" style="background: var(--accent-purple)">
            ${initials}
          </div>
          <div class="lead-card__info">
            <span class="lead-card__name">${lead.name}</span>
            <span class="lead-card__source">${lead.source}</span>
          </div>
          <div class="lead-card__score">${lead.score}</div>
        </div>
        <p class="lead-card__property">
          <i data-lucide="home"></i>
          ${Utils.truncate(property, 35)}
        </p>
        ${lead.nextAction ? `
          <div class="lead-card__action">
            <i data-lucide="clock"></i>
            ${lead.nextAction.type} - ${Utils.formatDate(lead.nextAction.date, 'relative')}
          </div>
        ` : ''}
        ${followUpHtml}
      </div>
    `;
  },

  // Contact Row
  contactRow(contact) {
    const initials = Utils.getInitials(contact.name);
    const typeLabel = Utils.getContactTypeLabel(contact.type);

    return `
      <tr class="contact-row" data-id="${contact.id}">
        <td>
          <div class="contact-cell">
            <div class="contact-avatar">${initials}</div>
            <div class="contact-info">
              <span class="contact-name">${contact.name}</span>
              <span class="contact-email">${contact.email}</span>
            </div>
          </div>
        </td>
        <td><span class="badge badge--secondary">${typeLabel}</span></td>
        <td>${contact.phone || contact.mobile || '-'}</td>
        <td>
          ${contact.tags ? contact.tags.map(tag => `
            <span class="badge badge--outline">${tag}</span>
          `).join(' ') : '-'}
        </td>
        <td>
          <div class="table-actions">
            <button class="btn btn--ghost btn--icon btn--sm" title="Llamar">
              <i data-lucide="phone"></i>
            </button>
            <button class="btn btn--ghost btn--icon btn--sm" title="Email">
              <i data-lucide="mail"></i>
            </button>
            <button class="btn btn--ghost btn--icon btn--sm" title="Ver detalle">
              <i data-lucide="eye"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  },

  // Transaction Row
  transactionRow(transaction) {
    const isIncome = transaction.type === 'ingreso';
    const amountClass = isIncome ? 'text-success' : 'text-error';
    const amountPrefix = isIncome ? '+' : '-';
    const amount = Utils.formatCurrency(transaction.amount, transaction.currency);
    const statusClass = Utils.getStatusClass(transaction.status);

    return `
      <tr class="transaction-row" data-id="${transaction.id}">
        <td>${Utils.formatDate(transaction.date)}</td>
        <td>
          <div class="transaction-desc">
            <span class="transaction-title">${transaction.description}</span>
            ${transaction.property ? `
              <span class="transaction-property">${transaction.property.title}</span>
            ` : ''}
          </div>
        </td>
        <td><span class="badge badge--outline">${transaction.category}</span></td>
        <td class="${amountClass}">${amountPrefix}${amount}</td>
        <td><span class="badge ${statusClass}">${Utils.getStatusLabel(transaction.status)}</span></td>
        <td>
          <button class="btn btn--ghost btn--icon btn--sm" title="Ver detalle">
            <i data-lucide="eye"></i>
          </button>
        </td>
      </tr>
    `;
  },

  // Event Item (for calendar)
  eventItem(event) {
    const typeColor = Utils.getEventTypeColor(event.type);

    return `
      <div class="event-item" data-id="${event.id}" style="--event-color: ${typeColor}">
        <div class="event-item__time">
          <span>${event.startTime}</span>
          <span>${event.endTime}</span>
        </div>
        <div class="event-item__content">
          <h4 class="event-item__title">${event.title}</h4>
          ${event.location ? `
            <p class="event-item__location">
              <i data-lucide="map-pin"></i>
              ${event.location}
            </p>
          ` : ''}
          ${event.lead ? `
            <p class="event-item__lead">
              <i data-lucide="user"></i>
              ${event.lead.name}
            </p>
          ` : ''}
        </div>
        <span class="badge badge--outline">${event.type}</span>
      </div>
    `;
  },

  // Calendar Day Cell
  calendarDay(date, events = [], isToday = false, isCurrentMonth = true) {
    const dayNumber = date.getDate();
    const dateStr = date.toISOString().split('T')[0];
    const dayEvents = events.filter(e => e.date === dateStr);

    return `
      <div class="calendar-day ${isToday ? 'calendar-day--today' : ''} ${!isCurrentMonth ? 'calendar-day--other' : ''}"
           data-date="${dateStr}">
        <span class="calendar-day__number">${dayNumber}</span>
        <div class="calendar-day__events">
          ${dayEvents.slice(0, 3).map(e => `
            <div class="calendar-day__event" style="background: ${Utils.getEventTypeColor(e.type)}">
              ${Utils.truncate(e.title, 15)}
            </div>
          `).join('')}
          ${dayEvents.length > 3 ? `
            <span class="calendar-day__more">+${dayEvents.length - 3} más</span>
          ` : ''}
        </div>
      </div>
    `;
  },

  // Activity Item (for timeline) - Enhanced version
  activityItem(activity) {
    const typeInfo = DataStore.getActivityTypeInfo ?
      DataStore.getActivityTypeInfo(activity.type) :
      { icon: 'activity', name: activity.type };

    const outcomeInfo = DataStore.getActivityOutcomeInfo && activity.outcome ?
      DataStore.getActivityOutcomeInfo(activity.outcome) :
      null;

    const showOutcome = outcomeInfo && activity.outcome !== 'no_aplica';
    const showDuration = activity.duration && activity.duration > 0;
    const showNotes = activity.notes && activity.notes.trim();

    return `
      <div class="timeline-item--enhanced">
        <div class="timeline-item__icon timeline-item__icon--${activity.type}">
          <i data-lucide="${typeInfo.icon}"></i>
        </div>
        <div class="timeline-item__content">
          <div class="timeline-item__header">
            <span class="timeline-item__type">${typeInfo.name}</span>
            <span class="timeline-item__date">${Utils.formatDate(activity.date, 'relative')}</span>
          </div>
          ${activity.subject ? `
            <div style="font-size: var(--font-size-sm); color: var(--text-primary); margin-top: 2px;">
              ${activity.subject}
            </div>
          ` : ''}
          ${showOutcome ? `
            <span class="timeline-item__outcome timeline-item__outcome--${activity.outcome}">
              ${outcomeInfo.name}
            </span>
          ` : ''}
          ${showNotes ? `
            <p class="timeline-item__notes">${activity.notes}</p>
          ` : ''}
          ${showDuration ? `
            <div class="timeline-item__duration">
              <i data-lucide="clock"></i>
              ${activity.duration} min
            </div>
          ` : ''}
          ${activity.createdBy ? `
            <div class="timeline-item__agent">
              <i data-lucide="user"></i>
              ${activity.createdBy.name}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  // Legacy activity item (simpler version)
  activityItemSimple(activity) {
    const icons = {
      visita: 'map-pin',
      llamada: 'phone',
      llamada_entrante: 'phone-incoming',
      llamada_saliente: 'phone-outgoing',
      email: 'mail',
      mensaje: 'message-circle',
      whatsapp: 'message-circle',
      reunion: 'users',
      oferta: 'file-text',
      nota: 'file-text',
      seña: 'hand-coins',
      formulario: 'clipboard',
      seguimiento: 'refresh-cw'
    };

    return `
      <div class="activity-item">
        <div class="activity-item__icon">
          <i data-lucide="${icons[activity.type] || 'circle'}"></i>
        </div>
        <div class="activity-item__content">
          <span class="activity-item__title">${activity.notes || activity.subject || DataStore.getActivityTypeInfo(activity.type)?.name || activity.type}</span>
          <span class="activity-item__time">${Utils.formatDate(activity.date, 'relative')}</span>
        </div>
      </div>
    `;
  },

  // Empty State
  emptyState(icon, title, description, actionLabel = null, actionHandler = null) {
    return `
      <div class="empty-state">
        <div class="empty-state__icon">
          <i data-lucide="${icon}"></i>
        </div>
        <h3 class="empty-state__title">${title}</h3>
        <p class="empty-state__description">${description}</p>
        ${actionLabel ? `
          <button class="btn btn--primary empty-state__action">${actionLabel}</button>
        ` : ''}
      </div>
    `;
  },

  // Loading State
  loadingState() {
    return `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <span>Cargando...</span>
      </div>
    `;
  },

  // Tabs
  tabs(items, activeId) {
    return `
      <div class="tabs">
        ${items.map(item => `
          <button class="tab ${item.id === activeId ? 'tab--active' : ''}" data-tab="${item.id}">
            ${item.icon ? `<i data-lucide="${item.icon}"></i>` : ''}
            <span>${item.label}</span>
            ${item.count !== undefined ? `<span class="tab__count">${item.count}</span>` : ''}
          </button>
        `).join('')}
      </div>
    `;
  },

  // Rental Card (for Administraciones)
  rentalCard(rental) {
    const statusClass = Utils.getRentalStatusClass(rental.status);
    const statusLabel = Utils.getRentalStatusLabel(rental.status);
    const monthlyRent = Utils.formatCurrency(rental.monthlyRent, rental.currency);
    const frequencyLabel = Utils.getAdjustmentFrequencyLabel(rental.adjustmentFrequency);
    const daysUntilAdjustment = Utils.daysUntil(rental.nextAdjustmentDate);
    const daysUntilEnd = Utils.daysUntil(rental.endDate);

    // Calculate next rent amount after adjustment
    const nextRent = Math.round(rental.monthlyRent * (1 + rental.adjustmentPercentage / 100));
    const nextRentFormatted = Utils.formatCurrency(nextRent, rental.currency);

    // Determine adjustment urgency
    let adjustmentBadge = '';
    if (daysUntilAdjustment <= 7 && daysUntilAdjustment >= 0) {
      adjustmentBadge = '<span class="badge badge--danger">Esta semana</span>';
    } else if (daysUntilAdjustment <= 30 && daysUntilAdjustment >= 0) {
      adjustmentBadge = '<span class="badge badge--warning">Este mes</span>';
    }

    // Determine contract expiration urgency
    let expirationBadge = '';
    if (daysUntilEnd <= 30 && daysUntilEnd >= 0) {
      expirationBadge = '<span class="badge badge--danger">Vence pronto</span>';
    } else if (daysUntilEnd <= 90 && daysUntilEnd >= 0) {
      expirationBadge = '<span class="badge badge--warning">Por vencer</span>';
    }

    return `
      <div class="rental-card" data-id="${rental.id}">
        <div class="rental-card__header">
          <div class="rental-card__icon">
            <i data-lucide="file-text"></i>
          </div>
          <div class="rental-card__info">
            <h3 class="rental-card__title">${rental.property.title}</h3>
            <span class="rental-card__address">
              <i data-lucide="map-pin"></i>
              ${rental.property.address}
            </span>
          </div>
          <span class="badge ${statusClass}">${statusLabel}</span>
        </div>

        <div class="rental-card__parties">
          <div class="rental-card__party">
            <span class="rental-card__party-label">Propietario</span>
            <span class="rental-card__party-name">${rental.propietario.name}</span>
          </div>
          <div class="rental-card__party-divider">
            <i data-lucide="arrow-right"></i>
          </div>
          <div class="rental-card__party">
            <span class="rental-card__party-label">Inquilino</span>
            <span class="rental-card__party-name">${rental.inquilino.name}</span>
          </div>
        </div>

        <div class="rental-card__stats">
          <div class="rental-card__stat">
            <span class="rental-card__stat-value">${monthlyRent}</span>
            <span class="rental-card__stat-label">Alquiler/mes</span>
          </div>
          <div class="rental-card__stat">
            <span class="rental-card__stat-value">${frequencyLabel}</span>
            <span class="rental-card__stat-label">Ajuste +${rental.adjustmentPercentage}%</span>
          </div>
        </div>

        <div class="rental-card__dates">
          <div class="rental-card__date">
            <i data-lucide="trending-up"></i>
            <div class="rental-card__date-info">
              <span class="rental-card__date-label">Próximo ajuste</span>
              <span class="rental-card__date-value">
                ${Utils.formatDate(rental.nextAdjustmentDate, 'medium')} → ${nextRentFormatted}
              </span>
            </div>
            ${adjustmentBadge}
          </div>
          <div class="rental-card__date">
            <i data-lucide="calendar-x"></i>
            <div class="rental-card__date-info">
              <span class="rental-card__date-label">Vencimiento</span>
              <span class="rental-card__date-value">${Utils.formatDate(rental.endDate, 'medium')}</span>
            </div>
            ${expirationBadge}
          </div>
        </div>

        <div class="rental-card__footer">
          <span class="rental-card__contract-period">
            <i data-lucide="clock"></i>
            ${Utils.formatDate(rental.startDate, 'short')} - ${Utils.formatDate(rental.endDate, 'short')}
          </span>
          <button class="btn btn--ghost btn--sm rental-card__btn" data-action="view-rental" data-id="${rental.id}">
            Ver detalle
          </button>
        </div>
      </div>
    `;
  },

  // Rental Row (for table view)
  rentalRow(rental) {
    const statusClass = Utils.getRentalStatusClass(rental.status);
    const statusLabel = Utils.getRentalStatusLabel(rental.status);
    const monthlyRent = Utils.formatCurrency(rental.monthlyRent, rental.currency);
    const daysUntilEnd = Utils.daysUntil(rental.endDate);

    let urgencyBadge = '';
    if (daysUntilEnd <= 30 && daysUntilEnd >= 0) {
      urgencyBadge = '<span class="badge badge--danger badge--sm">Vence pronto</span>';
    }

    return `
      <tr class="rental-row" data-id="${rental.id}">
        <td>
          <div class="rental-cell">
            <span class="rental-property">${rental.property.title}</span>
            <span class="rental-address">${rental.property.address}</span>
          </div>
        </td>
        <td>${rental.propietario.name}</td>
        <td>${rental.inquilino.name}</td>
        <td>${monthlyRent}</td>
        <td>
          ${Utils.formatDate(rental.nextAdjustmentDate, 'short')}
          <span class="text-muted">(+${rental.adjustmentPercentage}%)</span>
        </td>
        <td>
          ${Utils.formatDate(rental.endDate, 'short')}
          ${urgencyBadge}
        </td>
        <td><span class="badge ${statusClass}">${statusLabel}</span></td>
        <td>
          <button class="btn btn--ghost btn--icon btn--sm" title="Ver detalle" data-action="view-rental" data-id="${rental.id}">
            <i data-lucide="eye"></i>
          </button>
        </td>
      </tr>
    `;
  },

  // Booking Card (for temporary rentals)
  bookingCard(booking) {
    const statusClass = Utils.getBookingStatusClass(booking.status);
    const statusLabel = Utils.getBookingStatusLabel(booking.status);
    const pricePerNight = Utils.formatCurrency(booking.pricePerNight, booking.currency);
    const totalPrice = Utils.formatCurrency(booking.totalPrice, booking.currency);
    const sourceLabel = Utils.getBookingSourceLabel(booking.source);
    const daysUntilCheckIn = Utils.daysUntil(booking.checkInDate);

    let urgencyBadge = '';
    if (booking.status === 'pendiente' && daysUntilCheckIn <= 3 && daysUntilCheckIn >= 0) {
      urgencyBadge = '<span class="badge badge--danger badge--sm">Confirmar urgente</span>';
    } else if (booking.status === 'confirmada' && daysUntilCheckIn <= 2 && daysUntilCheckIn >= 0) {
      urgencyBadge = '<span class="badge badge--info badge--sm">Check-in pronto</span>';
    }

    return `
      <div class="booking-card" data-id="${booking.id}">
        <div class="booking-card__header">
          <div class="booking-card__icon">
            <i data-lucide="calendar-check"></i>
          </div>
          <div class="booking-card__info">
            <h3 class="booking-card__title">${booking.property.title}</h3>
            <span class="booking-card__code">${booking.confirmationCode}</span>
          </div>
          <span class="badge ${statusClass}">${statusLabel}</span>
        </div>

        <div class="booking-card__dates">
          <div class="booking-card__date">
            <i data-lucide="log-in"></i>
            <span>Check-in: ${Utils.formatDate(booking.checkInDate, 'medium')}</span>
          </div>
          <div class="booking-card__date">
            <i data-lucide="log-out"></i>
            <span>Check-out: ${Utils.formatDate(booking.checkOutDate, 'medium')}</span>
          </div>
        </div>

        <div class="booking-card__guest">
          <div class="booking-card__guest-avatar">${Utils.getInitials(booking.guestName)}</div>
          <div class="booking-card__guest-info">
            <span class="booking-card__guest-name">${booking.guestName}</span>
            <span class="booking-card__guest-detail">${booking.numberOfGuests} huesped(es) · ${booking.numberOfNights} noches</span>
          </div>
        </div>

        <div class="booking-card__footer">
          <div class="booking-card__price">
            <span class="booking-card__price-label">${pricePerNight}/noche</span>
            <span class="booking-card__price-total">${totalPrice} total</span>
          </div>
          <div class="booking-card__meta">
            ${urgencyBadge}
            <span class="badge badge--outline badge--sm">${sourceLabel}</span>
          </div>
        </div>
      </div>
    `;
  },

  // Calendar Day for Bookings (shows occupation blocks)
  calendarBookingDay(date, bookings = [], isToday = false, isCurrentMonth = true) {
    const dayNumber = date.getDate();
    const dateStr = date.toISOString().split('T')[0];

    // Find bookings that overlap with this day
    const dayBookings = bookings.filter(b => {
      const checkIn = new Date(b.checkInDate);
      const checkOut = new Date(b.checkOutDate);
      const currentDate = new Date(dateStr);
      return currentDate >= checkIn && currentDate < checkOut;
    });

    const occupationClass = dayBookings.length > 0 ? 'calendar-day--occupied' : '';

    return `
      <div class="calendar-day calendar-day--booking ${occupationClass} ${isToday ? 'calendar-day--today' : ''} ${!isCurrentMonth ? 'calendar-day--other' : ''}"
           data-date="${dateStr}">
        <span class="calendar-day__number">${dayNumber}</span>
        <div class="calendar-day__bookings">
          ${dayBookings.slice(0, 2).map(b => {
            const isCheckIn = b.checkInDate === dateStr;
            const statusColor = Utils.getBookingStatusColor(b.status);
            return `
              <div class="calendar-booking-block ${isCheckIn ? 'block--start' : ''}"
                   style="background-color: ${statusColor}20; border-color: ${statusColor}"
                   data-booking-id="${b.id}"
                   title="${b.guestName} - ${b.property.title}">
                ${isCheckIn ? Utils.truncate(b.guestName, 8) : ''}
              </div>
            `;
          }).join('')}
          ${dayBookings.length > 2 ? `<span class="calendar-day__more">+${dayBookings.length - 2}</span>` : ''}
        </div>
      </div>
    `;
  },

  // Booking Item (for sidebar list)
  bookingItem(booking) {
    const statusClass = Utils.getBookingStatusClass(booking.status);
    const statusLabel = Utils.getBookingStatusLabel(booking.status);

    return `
      <div class="booking-item" data-id="${booking.id}">
        <div class="booking-item__dates">
          <span class="booking-item__checkin">${Utils.formatDate(booking.checkInDate, 'short')}</span>
          <i data-lucide="arrow-right"></i>
          <span class="booking-item__checkout">${Utils.formatDate(booking.checkOutDate, 'short')}</span>
        </div>
        <div class="booking-item__info">
          <span class="booking-item__guest">${booking.guestName}</span>
          <span class="booking-item__property">${booking.property.title}</span>
        </div>
        <span class="badge badge--sm ${statusClass}">${statusLabel}</span>
      </div>
    `;
  },

  // User Row (for users table)
  userRow(user, currentUserRole) {
    const roleClass = Utils.getRoleClass(user.role);
    const roleLabel = Utils.getRoleLabel(user.role);
    const statusClass = user.status === 'activo' ? 'badge--success' : 'badge--secondary';
    const statusLabel = user.status === 'activo' ? 'Activo' : 'Inactivo';
    const leadsCount = user.leads?.length || 0;
    const propertiesCount = user.properties?.length || 0;

    // Determine if actions are available based on current user role
    const canEdit = currentUserRole === 'superadmin' ||
                   (currentUserRole === 'administrador' && user.role !== 'superadmin');
    const canDelete = currentUserRole === 'superadmin' && user.role !== 'superadmin';

    return `
      <tr class="user-row" data-id="${user.id}">
        <td>
          <div class="user-cell">
            <div class="user-avatar user-avatar--table">${user.avatar}</div>
            <div class="user-info">
              <span class="user-name">${user.name}</span>
              <span class="user-phone">${user.phone || '-'}</span>
            </div>
          </div>
        </td>
        <td>${user.email}</td>
        <td><span class="badge ${roleClass}">${roleLabel}</span></td>
        <td><span class="badge badge--sm ${statusClass}">${statusLabel}</span></td>
        <td>${leadsCount}</td>
        <td>${propertiesCount}</td>
        <td>
          <div class="table-actions">
            ${canEdit ? `
              <button class="btn btn--ghost btn--icon btn--sm edit-user-btn" title="Editar" data-id="${user.id}">
                <i data-lucide="edit-2"></i>
              </button>
            ` : ''}
            ${canDelete ? `
              <button class="btn btn--ghost btn--icon btn--sm delete-user-btn" title="Eliminar" data-id="${user.id}">
                <i data-lucide="trash-2"></i>
              </button>
            ` : ''}
            ${!canEdit && !canDelete ? `
              <span class="text-muted">-</span>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  },

  // User Card (for grid view)
  userCard(user, currentUserRole) {
    const roleClass = Utils.getRoleClass(user.role);
    const roleLabel = Utils.getRoleLabel(user.role);
    const statusClass = user.status === 'activo' ? 'badge--success' : 'badge--secondary';
    const statusLabel = user.status === 'activo' ? 'Activo' : 'Inactivo';
    const leadsCount = user.leads?.length || 0;
    const propertiesCount = user.properties?.length || 0;

    const canEdit = currentUserRole === 'superadmin' ||
                   (currentUserRole === 'administrador' && user.role !== 'superadmin');
    const canDelete = currentUserRole === 'superadmin' && user.role !== 'superadmin';

    return `
      <div class="user-card" data-id="${user.id}">
        <div class="user-card__header">
          <div class="user-card__avatar">${user.avatar}</div>
          <div class="user-card__badges">
            <span class="badge ${roleClass}">${roleLabel}</span>
            <span class="badge badge--sm ${statusClass}">${statusLabel}</span>
          </div>
        </div>
        <div class="user-card__body">
          <h3 class="user-card__name">${user.name}</h3>
          <p class="user-card__email">${user.email}</p>
          <p class="user-card__phone">
            <i data-lucide="phone"></i>
            ${user.phone || '-'}
          </p>
        </div>
        <div class="user-card__stats">
          <div class="user-card__stat">
            <span class="user-card__stat-value">${leadsCount}</span>
            <span class="user-card__stat-label">Leads</span>
          </div>
          <div class="user-card__stat">
            <span class="user-card__stat-value">${propertiesCount}</span>
            <span class="user-card__stat-label">Propiedades</span>
          </div>
          <div class="user-card__stat">
            <span class="user-card__stat-value">${user.stats?.ventasMes || 0}</span>
            <span class="user-card__stat-label">Ventas/Mes</span>
          </div>
        </div>
        <div class="user-card__footer">
          ${canEdit ? `
            <button class="btn btn--ghost btn--sm edit-user-btn" data-id="${user.id}">
              <i data-lucide="edit-2"></i>
              Editar
            </button>
          ` : ''}
          ${canDelete ? `
            <button class="btn btn--ghost btn--sm text-error delete-user-btn" data-id="${user.id}">
              <i data-lucide="trash-2"></i>
              Eliminar
            </button>
          ` : ''}
        </div>
      </div>
    `;
  },

  // Pagination
  pagination(currentPage, totalPages) {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return `
      <div class="pagination">
        <button class="pagination__btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
          <i data-lucide="chevron-left"></i>
        </button>
        ${pages.map(p => p === '...' ?
          `<span class="pagination__ellipsis">...</span>` :
          `<button class="pagination__btn ${p === currentPage ? 'pagination__btn--active' : ''}" data-page="${p}">${p}</button>`
        ).join('')}
        <button class="pagination__btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
          <i data-lucide="chevron-right"></i>
        </button>
      </div>
    `;
  },

  // =============================================
  // TASK COMPONENTS
  // =============================================

  // Task card for dashboard
  taskCard(task) {
    const isOverdue = new Date(task.dueDate) < new Date() && !['completada', 'cancelada'].includes(task.status);
    const priorityColors = {
      'alta': '#EF4444',
      'media': '#F59E0B',
      'baja': '#10B981'
    };
    const priorityColor = priorityColors[task.priority] || '#F59E0B';
    const priorityLabels = {
      'alta': 'Alta',
      'media': 'Media',
      'baja': 'Baja'
    };

    return `
      <div class="task-card ${isOverdue ? 'task-card--overdue' : ''} ${task.status === 'completada' ? 'task-card--completed' : ''}"
           data-task-id="${task.id}"
           style="
             display: flex;
             align-items: flex-start;
             gap: 0.75rem;
             padding: 1rem;
             background: var(--bg-secondary);
             border-radius: var(--radius-md);
             cursor: pointer;
             transition: all 0.2s;
             border-left: 3px solid ${priorityColor};
           ">
        <button class="task-complete-btn"
                data-task-id="${task.id}"
                style="
                  flex-shrink: 0;
                  width: 22px;
                  height: 22px;
                  border-radius: 50%;
                  border: 2px solid ${task.status === 'completada' ? 'var(--accent-green)' : 'var(--border-color)'};
                  background: ${task.status === 'completada' ? 'var(--accent-green)' : 'transparent'};
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 0;
                  margin-top: 2px;
                ">
          ${task.status === 'completada' ? '<i data-lucide="check" style="width: 14px; height: 14px; color: white;"></i>' : ''}
        </button>
        <div style="flex: 1; min-width: 0;">
          <div style="
            font-size: var(--font-size-sm);
            font-weight: 500;
            color: ${task.status === 'completada' ? 'var(--text-tertiary)' : 'var(--text-primary)'};
            text-decoration: ${task.status === 'completada' ? 'line-through' : 'none'};
            margin-bottom: 0.5rem;
          ">
            ${task.title}
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <span style="
              font-size: var(--font-size-xs);
              color: ${isOverdue ? 'var(--accent-red)' : 'var(--text-tertiary)'};
              display: flex;
              align-items: center;
              gap: 0.25rem;
            ">
              <i data-lucide="calendar" style="width: 12px; height: 12px;"></i>
              ${Utils.formatDate(task.dueDate, 'short')}
              ${isOverdue ? ' (Vencida)' : ''}
            </span>
            <span style="
              font-size: var(--font-size-xs);
              padding: 0.125rem 0.5rem;
              border-radius: var(--radius-sm);
              background: ${priorityColor}20;
              color: ${priorityColor};
            ">
              ${priorityLabels[task.priority]}
            </span>
            ${task.lead ? `
              <span style="
                font-size: var(--font-size-xs);
                color: var(--text-tertiary);
                display: flex;
                align-items: center;
                gap: 0.25rem;
              ">
                <i data-lucide="user" style="width: 12px; height: 12px;"></i>
                ${task.lead.name}
              </span>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  // Tasks summary for dashboard
  tasksSummary(summary) {
    return `
      <div class="tasks-summary" style="display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
        <div class="tasks-summary__item" style="
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: ${summary.overdue > 0 ? 'var(--accent-red)10' : 'var(--bg-tertiary)'};
          border-radius: var(--radius-md);
          border: 1px solid ${summary.overdue > 0 ? 'var(--accent-red)30' : 'transparent'};
        ">
          <i data-lucide="alert-circle" style="width: 16px; height: 16px; color: ${summary.overdue > 0 ? 'var(--accent-red)' : 'var(--text-tertiary)'};"></i>
          <span style="font-size: var(--font-size-sm); color: ${summary.overdue > 0 ? 'var(--accent-red)' : 'var(--text-secondary)'};">
            <strong>${summary.overdue}</strong> vencidas
          </span>
        </div>
        <div class="tasks-summary__item" style="
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: ${summary.today > 0 ? 'var(--accent-orange)10' : 'var(--bg-tertiary)'};
          border-radius: var(--radius-md);
        ">
          <i data-lucide="calendar" style="width: 16px; height: 16px; color: ${summary.today > 0 ? 'var(--accent-orange)' : 'var(--text-tertiary)'};"></i>
          <span style="font-size: var(--font-size-sm); color: var(--text-secondary);">
            <strong>${summary.today}</strong> para hoy
          </span>
        </div>
        <div class="tasks-summary__item" style="
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        ">
          <i data-lucide="clock" style="width: 16px; height: 16px; color: var(--text-tertiary);"></i>
          <span style="font-size: var(--font-size-sm); color: var(--text-secondary);">
            <strong>${summary.upcoming}</strong> próximas
          </span>
        </div>
      </div>
    `;
  },

  // Empty tasks state
  emptyTasks() {
    return `
      <div style="text-align: center; padding: 2rem; color: var(--text-tertiary);">
        <i data-lucide="check-circle" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.3;"></i>
        <p style="font-size: var(--font-size-sm); margin-bottom: 0.5rem;">¡Sin tareas pendientes!</p>
        <p style="font-size: var(--font-size-xs);">Creá una nueva tarea para comenzar</p>
      </div>
    `;
  }
};
