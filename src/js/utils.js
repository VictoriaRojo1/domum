/**
 * DOMUM - Utility Functions
 */

const Utils = {
  // Format currency
  formatCurrency(amount, currency = 'USD') {
    if (currency === 'USD') {
      return `USD ${amount.toLocaleString('es-AR')}`;
    }
    return `$ ${amount.toLocaleString('es-AR')}`;
  },

  // Format date - returns dd-mm-yyyy format
  formatDate(dateString, format = 'short') {
    const date = new Date(dateString + 'T12:00:00');

    if (format === 'relative') {
      return this.getRelativeDate(dateString);
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    if (format === 'short') {
      return `${day}-${month}-${year}`;
    }

    if (format === 'medium') {
      const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      return `${day}-${monthNames[date.getMonth()]}-${year}`;
    }

    if (format === 'long') {
      const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      return `${day} de ${monthNames[date.getMonth()]} de ${year}`;
    }

    return `${day}-${month}-${year}`;
  },

  // Get relative date string
  getRelativeDate(dateString) {
    const date = new Date(dateString + 'T12:00:00');
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays === -1) return 'Ayer';
    if (diffDays > 0 && diffDays <= 7) return `En ${diffDays} días`;
    if (diffDays < 0 && diffDays >= -7) return `Hace ${Math.abs(diffDays)} días`;

    return this.formatDate(dateString, 'medium');
  },

  // Format time
  formatTime(timeString) {
    return timeString;
  },

  // Get initials from name
  getInitials(name) {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  },

  // Truncate text
  truncate(text, length = 50) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  },

  // Generate random ID
  generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Get status badge class
  getStatusClass(status) {
    const statusMap = {
      disponible: 'badge--success',
      reservada: 'badge--warning',
      en_negociacion: 'badge--warning',
      vendida: 'badge--secondary',
      alquilada: 'badge--secondary',
      completado: 'badge--success',
      pendiente: 'badge--warning',
      cancelado: 'badge--danger',
      confirmado: 'badge--success',
      nuevo: 'badge--secondary',
      en_proceso: 'badge--info',
      negociacion: 'badge--orange',
      cerrado: 'badge--success',
      perdido: 'badge--danger'
    };
    return statusMap[status] || 'badge--secondary';
  },

  // Get status label
  getStatusLabel(status) {
    const labels = {
      disponible: 'Disponible',
      reservada: 'Reservada',
      en_negociacion: 'En Negociación',
      vendida: 'Vendida',
      alquilada: 'Alquilada',
      completado: 'Completado',
      pendiente: 'Pendiente',
      cancelado: 'Cancelado',
      confirmado: 'Confirmado',
      nuevo: 'Nuevo',
      en_proceso: 'En Proceso',
      negociacion: 'Negociación',
      cerrado: 'Cerrado',
      perdido: 'Perdido'
    };
    return labels[status] || status;
  },

  // Get property type label
  getPropertyTypeLabel(type) {
    const labels = {
      departamento: 'Departamento',
      casa: 'Casa',
      ph: 'PH',
      local: 'Local',
      oficina: 'Oficina',
      terreno: 'Terreno',
      cochera: 'Cochera',
      quinta: 'Quinta',
      duplex: 'Duplex'
    };
    return labels[type] || type;
  },

  // Get operation label
  getOperationLabel(operation) {
    const labels = {
      venta: 'Venta',
      alquiler: 'Alquiler',
      alquiler_temporario: 'Alquiler Temporario'
    };
    return labels[operation] || operation;
  },

  // Get event type color
  getEventTypeColor(type) {
    const colors = {
      visita: '#00D4FF',
      reunion: '#A855F7',
      llamada: '#10B981',
      firma: '#FF6B35',
      tasacion: '#F59E0B',
      capacitacion: '#64748B',
      ajuste_alquiler: '#F97316',
      vencimiento_contrato: '#EF4444'
    };
    return colors[type] || '#64748B';
  },

  // Get rental status class
  getRentalStatusClass(status) {
    const statusMap = {
      activo: 'badge--success',
      por_vencer: 'badge--warning',
      vencido: 'badge--danger',
      cancelado: 'badge--secondary',
      renovado: 'badge--info'
    };
    return statusMap[status] || 'badge--secondary';
  },

  // Get rental status label
  getRentalStatusLabel(status) {
    const labels = {
      activo: 'Activo',
      por_vencer: 'Por Vencer',
      vencido: 'Vencido',
      cancelado: 'Cancelado',
      renovado: 'Renovado'
    };
    return labels[status] || status;
  },

  // Get adjustment frequency label
  getAdjustmentFrequencyLabel(frequency) {
    const labels = {
      mensual: 'Mensual',
      bimestral: 'Bimestral',
      trimestral: 'Trimestral',
      cuatrimestral: 'Cuatrimestral',
      semestral: 'Semestral',
      anual: 'Anual'
    };
    return labels[frequency] || frequency;
  },

  // Get booking status class
  getBookingStatusClass(status) {
    const statusMap = {
      pendiente: 'badge--warning',
      confirmada: 'badge--success',
      cancelada: 'badge--danger',
      completada: 'badge--secondary',
      no_show: 'badge--purple'
    };
    return statusMap[status] || 'badge--secondary';
  },

  // Get booking status label
  getBookingStatusLabel(status) {
    const labels = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      cancelada: 'Cancelada',
      completada: 'Completada',
      no_show: 'No Show'
    };
    return labels[status] || status;
  },

  // Get booking status color
  getBookingStatusColor(status) {
    const colors = {
      pendiente: '#F59E0B',
      confirmada: '#10B981',
      cancelada: '#EF4444',
      completada: '#6B7280',
      no_show: '#8B5CF6'
    };
    return colors[status] || '#6B7280';
  },

  // Get booking source label
  getBookingSourceLabel(source) {
    const labels = {
      airbnb: 'Airbnb',
      booking: 'Booking.com',
      vrbo: 'VRBO',
      directo: 'Directo',
      otro: 'Otro'
    };
    return labels[source] || source;
  },

  // Calculate days until date
  daysUntil(dateString) {
    const date = new Date(dateString + 'T12:00:00');
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const diffTime = date - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // Get user role label
  getRoleLabel(role) {
    const labels = {
      superadmin: 'Super Admin',
      administrador: 'Administrador',
      agente: 'Vendedor',
      administrativo: 'Administrativo'
    };
    return labels[role] || role;
  },

  // Get user role badge class
  getRoleClass(role) {
    const roleMap = {
      superadmin: 'badge--danger',
      administrador: 'badge--purple',
      agente: 'badge--info',
      administrativo: 'badge--secondary'
    };
    return roleMap[role] || 'badge--secondary';
  },

  // Get contact type label
  getContactTypeLabel(type) {
    const labels = {
      propietario: 'Propietario',
      inquilino: 'Inquilino',
      comprador_potencial: 'Comprador Potencial',
      inversor: 'Inversor',
      constructora: 'Constructora',
      colega: 'Colega',
      tasador: 'Tasador',
      escribano: 'Escribano',
      abogado: 'Abogado'
    };
    return labels[type] || type;
  },

  // Simple template engine
  template(html, data) {
    return html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  },

  // Create element from HTML string
  createElement(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
  },

  // Add event listeners with delegation
  delegate(parent, event, selector, handler) {
    parent.addEventListener(event, (e) => {
      const target = e.target.closest(selector);
      if (target && parent.contains(target)) {
        handler.call(target, e, target);
      }
    });
  }
};
