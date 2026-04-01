/**
 * DOMUM - Data Management
 * Handles loading and managing mock data
 */

const DataStore = {
  properties: [],
  contacts: [],
  leads: [],
  leadStages: [],
  transactions: [],
  transactionCategories: {},
  events: [],
  eventTypes: [],
  users: [],
  currentUser: null,
  rentals: [],
  adjustmentFrequencies: [],
  documentTemplates: [],
  documentCategories: [],
  generatedDocuments: [],
  temporaryBookings: [],
  bookingSources: [],
  tasks: [],
  taskPriorities: [
    { id: 'alta', name: 'Alta', color: '#EF4444' },
    { id: 'media', name: 'Media', color: '#F59E0B' },
    { id: 'baja', name: 'Baja', color: '#10B981' }
  ],
  taskStatuses: [
    { id: 'pendiente', name: 'Pendiente' },
    { id: 'en_progreso', name: 'En Progreso' },
    { id: 'completada', name: 'Completada' },
    { id: 'cancelada', name: 'Cancelada' }
  ],
  activityTypes: [
    { id: 'llamada_entrante', name: 'Llamada Entrante', icon: 'phone-incoming' },
    { id: 'llamada_saliente', name: 'Llamada Saliente', icon: 'phone-outgoing' },
    { id: 'whatsapp', name: 'WhatsApp', icon: 'message-circle' },
    { id: 'email', name: 'Email', icon: 'mail' },
    { id: 'visita', name: 'Visita', icon: 'home' },
    { id: 'reunion', name: 'Reunión', icon: 'users' },
    { id: 'nota', name: 'Nota', icon: 'file-text' },
    { id: 'oferta', name: 'Oferta', icon: 'tag' },
    { id: 'seguimiento', name: 'Seguimiento', icon: 'refresh-cw' }
  ],
  activityOutcomes: [
    { id: 'exitoso', name: 'Exitoso', color: '#10B981' },
    { id: 'sin_respuesta', name: 'Sin Respuesta', color: '#F59E0B' },
    { id: 'ocupado', name: 'Ocupado', color: '#6B7280' },
    { id: 'rechazado', name: 'Rechazado', color: '#EF4444' },
    { id: 'pendiente', name: 'Pendiente', color: '#3B82F6' },
    { id: 'no_aplica', name: 'No Aplica', color: '#9CA3AF' }
  ],

  async init() {
    try {
      // Load all data in parallel
      const [properties, contacts, leads, transactions, events, users, rentals, docTemplates, temporaryBookings] = await Promise.all([
        this.loadJSON('data/properties.json'),
        this.loadJSON('data/contacts.json'),
        this.loadJSON('data/leads.json'),
        this.loadJSON('data/transactions.json'),
        this.loadJSON('data/events.json'),
        this.loadJSON('data/users.json'),
        this.loadJSON('data/rentals.json'),
        this.loadJSON('data/document-templates.json'),
        this.loadJSON('data/temporary-bookings.json')
      ]);

      this.properties = properties.properties || [];
      this.contacts = contacts.contacts || [];
      this.leads = leads.leads || [];
      this.leadStages = leads.stages || [];
      this.transactions = transactions.transactions || [];
      this.transactionCategories = transactions.categories || {};
      this.events = events.events || [];
      this.eventTypes = events.types || [];
      this.users = users.users || [];
      this.rentals = rentals.rentals || [];
      this.adjustmentFrequencies = rentals.adjustmentFrequencies || [];
      this.documentTemplates = docTemplates.documentTypes || [];
      this.documentCategories = docTemplates.categories || [];
      this.temporaryBookings = temporaryBookings.temporaryBookings || [];
      this.bookingSources = temporaryBookings.bookingSources || [];

      // Generate rental adjustment events and add to calendar
      const adjustmentEvents = this.generateAdjustmentEvents();
      this.events = [...this.events, ...adjustmentEvents];

      console.log('Data loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading data:', error);
      return false;
    }
  },

  async loadJSON(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}`);
    }
    return response.json();
  },

  // Properties
  getProperties(filters = {}) {
    let result = [...this.properties];

    if (filters.type) {
      result = result.filter(p => p.type === filters.type);
    }
    if (filters.operation) {
      result = result.filter(p => p.operation === filters.operation);
    }
    if (filters.status) {
      result = result.filter(p => p.status === filters.status);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(search) ||
        p.address.toLowerCase().includes(search) ||
        p.neighborhood.toLowerCase().includes(search)
      );
    }

    return result;
  },

  getPropertyById(id) {
    return this.properties.find(p => p.id === id);
  },

  updateProperty(updatedProperty) {
    const index = this.properties.findIndex(p => p.id === updatedProperty.id);
    if (index !== -1) {
      this.properties[index] = { ...this.properties[index], ...updatedProperty };
      return this.properties[index];
    }
    return null;
  },

  // Contacts
  getContacts(filters = {}) {
    let result = [...this.contacts];

    if (filters.type) {
      result = result.filter(c => c.type === filters.type);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search)
      );
    }

    return result;
  },

  getContactById(id) {
    return this.contacts.find(c => c.id === id);
  },

  // Leads
  getLeads(filters = {}) {
    let result = [...this.leads];

    if (filters.stage) {
      result = result.filter(l => l.stage === filters.stage);
    }
    if (filters.assignedTo) {
      result = result.filter(l => l.assignedTo === filters.assignedTo);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(l =>
        l.name.toLowerCase().includes(search) ||
        l.email.toLowerCase().includes(search)
      );
    }

    return result;
  },

  getLeadById(id) {
    return this.leads.find(l => l.id === id);
  },

  async getLeadByIdViaAPI(id) {
    const response = await API.getLead(id);
    if (response.success && response.lead) {
      // Update local cache with full lead data
      const index = this.leads.findIndex(l => l.id === id);
      if (index !== -1) {
        this.leads[index] = { ...this.leads[index], ...response.lead };
      }
      return response.lead;
    }
    throw new Error(response.error || 'Error al obtener lead');
  },

  updateLead(updatedLead) {
    const index = this.leads.findIndex(l => l.id === updatedLead.id);
    if (index !== -1) {
      this.leads[index] = { ...this.leads[index], ...updatedLead };
      return this.leads[index];
    }
    return null;
  },

  getLeadsByStage(stage) {
    return this.leads.filter(l => l.stage === stage);
  },

  // Transactions
  getTransactions(filters = {}) {
    let result = [...this.transactions];

    if (filters.type) {
      result = result.filter(t => t.type === filters.type);
    }
    if (filters.category) {
      result = result.filter(t => t.category === filters.category);
    }
    if (filters.status) {
      result = result.filter(t => t.status === filters.status);
    }
    if (filters.dateFrom) {
      result = result.filter(t => t.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      result = result.filter(t => t.date <= filters.dateTo);
    }

    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getTransactionById(id) {
    return this.transactions.find(t => t.id === id);
  },

  // Events
  getEvents(filters = {}) {
    let result = [...this.events];

    if (filters.type) {
      result = result.filter(e => e.type === filters.type);
    }
    if (filters.date) {
      result = result.filter(e => e.date === filters.date);
    }
    if (filters.agent) {
      result = result.filter(e => e.agent?.id === filters.agent);
    }

    return result.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  },

  getEventById(id) {
    return this.events.find(e => e.id === id);
  },

  getEventsForDate(date) {
    return this.events.filter(e => e.date === date);
  },

  getUpcomingEvents(limit = 5) {
    const today = new Date().toISOString().split('T')[0];
    return this.events
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
      .slice(0, limit);
  },

  // Users
  getUserById(id) {
    return this.users.find(u => u.id === id);
  },

  getUsers(filters = {}) {
    let result = [...this.users];

    if (filters.role) {
      result = result.filter(u => u.role === filters.role);
    }
    if (filters.status) {
      result = result.filter(u => u.status === filters.status);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      );
    }

    return result;
  },

  getUserRoles() {
    return [
      { id: 'superadmin', name: 'Super Admin' },
      { id: 'administrador', name: 'Administrador' },
      { id: 'agente', name: 'Vendedor' },
      { id: 'administrativo', name: 'Administrativo' }
    ];
  },

  createUser(userData) {
    const newUser = {
      id: Utils.generateId('user'),
      ...userData,
      status: 'activo',
      properties: [],
      leads: [],
      stats: { ventasMes: 0, leadsActivos: 0, visitasMes: 0 },
      createdAt: new Date().toISOString()
    };
    this.users.push(newUser);
    return newUser;
  },

  updateUser(userId, userData) {
    const index = this.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...userData };
      return this.users[index];
    }
    return null;
  },

  deleteUser(userId) {
    const index = this.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      // Soft delete - just mark as inactive
      this.users[index].status = 'inactivo';
      this.users[index].deletedAt = new Date().toISOString();
      return true;
    }
    return false;
  },

  setCurrentUser(user) {
    this.currentUser = user;
  },

  // Rentals
  getRentals(filters = {}) {
    let result = [...this.rentals];

    if (filters.status) {
      result = result.filter(r => r.status === filters.status);
    }
    if (filters.propertyId) {
      result = result.filter(r => r.property.id === filters.propertyId);
    }
    if (filters.propietarioId) {
      result = result.filter(r => r.propietario.id === filters.propietarioId);
    }
    if (filters.inquilinoId) {
      result = result.filter(r => r.inquilino.id === filters.inquilinoId);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(r =>
        r.property.title.toLowerCase().includes(search) ||
        r.property.address.toLowerCase().includes(search) ||
        r.propietario.name.toLowerCase().includes(search) ||
        r.inquilino.name.toLowerCase().includes(search)
      );
    }

    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getRentalById(id) {
    return this.rentals.find(r => r.id === id);
  },

  getActiveRentals() {
    return this.rentals.filter(r => r.status === 'activo');
  },

  getRentalsByProperty(propertyId) {
    return this.rentals.filter(r => r.property.id === propertyId);
  },

  getExpiringRentals(days = 90) {
    const today = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + days);

    return this.rentals.filter(r => {
      if (r.status !== 'activo') return false;
      const endDate = new Date(r.endDate);
      return endDate >= today && endDate <= limit;
    }).sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
  },

  getUpcomingAdjustments(days = 30) {
    const today = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + days);

    return this.rentals.filter(r => {
      if (r.status !== 'activo') return false;
      const adjustmentDate = new Date(r.nextAdjustmentDate);
      return adjustmentDate >= today && adjustmentDate <= limit;
    }).sort((a, b) => new Date(a.nextAdjustmentDate) - new Date(b.nextAdjustmentDate));
  },

  generateAdjustmentEvents() {
    const events = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.rentals.forEach(rental => {
      if (rental.status !== 'activo') return;

      const frequency = this.adjustmentFrequencies.find(f => f.id === rental.adjustmentFrequency);
      if (!frequency) return;

      let adjustmentDate = new Date(rental.nextAdjustmentDate);
      const endDate = new Date(rental.endDate);
      let currentRent = rental.monthlyRent;

      // Generate adjustment events for each period until contract ends
      while (adjustmentDate <= endDate) {
        if (adjustmentDate >= today) {
          const newRent = Math.round(currentRent * (1 + rental.adjustmentPercentage / 100));

          events.push({
            id: `adj-${rental.id}-${adjustmentDate.toISOString().split('T')[0]}`,
            type: 'ajuste_alquiler',
            title: `Ajuste: ${rental.property.title}`,
            description: `${rental.currency} ${currentRent.toLocaleString('es-AR')} → ${newRent.toLocaleString('es-AR')} (+${rental.adjustmentPercentage}%)`,
            date: adjustmentDate.toISOString().split('T')[0],
            startTime: '09:00',
            endTime: '10:00',
            property: rental.property,
            rental: {
              id: rental.id,
              inquilino: rental.inquilino.name,
              propietario: rental.propietario.name,
              oldRent: currentRent,
              newRent: newRent,
              currency: rental.currency,
              adjustmentPercentage: rental.adjustmentPercentage
            },
            status: 'pendiente'
          });

          currentRent = newRent;
        } else {
          // Update rent for past adjustments
          currentRent = Math.round(currentRent * (1 + rental.adjustmentPercentage / 100));
        }

        // Move to next adjustment date
        adjustmentDate.setMonth(adjustmentDate.getMonth() + frequency.months);
      }

      // Add contract expiration event
      if (endDate >= today) {
        events.push({
          id: `venc-${rental.id}`,
          type: 'vencimiento_contrato',
          title: `Vence: ${rental.property.title}`,
          description: `Contrato de ${rental.inquilino.name} vence. Evaluar renovación.`,
          date: rental.endDate,
          startTime: '09:00',
          endTime: '10:00',
          property: rental.property,
          rental: {
            id: rental.id,
            inquilino: rental.inquilino.name,
            propietario: rental.propietario.name
          },
          status: 'pendiente'
        });
      }
    });

    return events;
  },

  getRentalStats() {
    const active = this.getActiveRentals();
    const expiring = this.getExpiringRentals(90);
    const upcomingAdjustments = this.getUpcomingAdjustments(30);

    // Calculate total monthly income
    let monthlyIncomeARS = 0;
    let monthlyIncomeUSD = 0;

    active.forEach(r => {
      if (r.currency === 'ARS') {
        monthlyIncomeARS += r.monthlyRent;
      } else {
        monthlyIncomeUSD += r.monthlyRent;
      }
    });

    return {
      totalContracts: this.rentals.length,
      activeContracts: active.length,
      expiringContracts: expiring.length,
      upcomingAdjustments: upcomingAdjustments.length,
      monthlyIncomeARS,
      monthlyIncomeUSD
    };
  },

  // Temporary Bookings
  getTemporaryBookings(filters = {}) {
    let result = [...this.temporaryBookings];

    if (filters.status) {
      result = result.filter(b => b.status === filters.status);
    }
    if (filters.propertyId) {
      result = result.filter(b => b.property.id === filters.propertyId);
    }
    if (filters.propietarioId) {
      result = result.filter(b => b.propietario.id === filters.propietarioId);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(b =>
        b.guestName.toLowerCase().includes(search) ||
        b.property.title.toLowerCase().includes(search) ||
        b.confirmationCode.toLowerCase().includes(search)
      );
    }

    return result.sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate));
  },

  getTemporaryBookingById(id) {
    return this.temporaryBookings.find(b => b.id === id);
  },

  getTemporaryBookingsForMonth(year, month, propertyId = null) {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    return this.temporaryBookings.filter(b => {
      const checkIn = new Date(b.checkInDate);
      const checkOut = new Date(b.checkOutDate);

      // Booking overlaps with the month
      const overlaps = checkIn <= endOfMonth && checkOut >= startOfMonth;

      if (propertyId) {
        return overlaps && b.property.id === propertyId;
      }
      return overlaps;
    });
  },

  getUpcomingTemporaryBookings(days = 30) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date();
    limit.setDate(limit.getDate() + days);

    return this.temporaryBookings.filter(b => {
      if (b.status === 'cancelada' || b.status === 'completada') return false;
      const checkIn = new Date(b.checkInDate);
      return checkIn >= today && checkIn <= limit;
    }).sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate));
  },

  getTemporaryBookingStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const activeBookings = this.temporaryBookings.filter(b =>
      b.status === 'confirmada' || b.status === 'pendiente'
    );

    const checkInsToday = this.temporaryBookings.filter(b =>
      b.checkInDate === todayStr && b.status === 'confirmada'
    ).length;

    const checkOutsToday = this.temporaryBookings.filter(b =>
      b.checkOutDate === todayStr && b.status === 'confirmada'
    ).length;

    // Calculate monthly income from confirmed bookings
    const monthlyBookings = this.temporaryBookings.filter(b => {
      const checkIn = new Date(b.checkInDate);
      return checkIn >= thisMonth && checkIn < nextMonth &&
             (b.status === 'confirmada' || b.status === 'completada');
    });

    const monthlyIncome = monthlyBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    // Calculate occupancy rate (simplified: days booked / total days in month)
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const bookedDays = monthlyBookings.reduce((sum, b) => sum + b.numberOfNights, 0);
    const occupancyRate = Math.min(100, Math.round((bookedDays / daysInMonth) * 100));

    return {
      totalBookings: this.temporaryBookings.length,
      activeBookings: activeBookings.length,
      pendingBookings: this.temporaryBookings.filter(b => b.status === 'pendiente').length,
      confirmedBookings: this.temporaryBookings.filter(b => b.status === 'confirmada').length,
      checkInsToday,
      checkOutsToday,
      monthlyIncome,
      occupancyRate
    };
  },

  // Stats
  getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);

    const activeLeads = this.leads.filter(l =>
      !['cerrado_ganado', 'perdido'].includes(l.stage)
    ).length;

    const monthTransactions = this.transactions.filter(t =>
      t.date.startsWith(thisMonth)
    );

    const monthIncome = monthTransactions
      .filter(t => t.type === 'ingreso' && t.status === 'completado')
      .reduce((sum, t) => {
        if (t.currency === 'USD') return sum + t.amount;
        return sum + (t.amount / 1000); // Simple ARS to USD conversion
      }, 0);

    const monthExpenses = monthTransactions
      .filter(t => t.type === 'egreso' && t.status === 'completado')
      .reduce((sum, t) => {
        if (t.currency === 'USD') return sum + t.amount;
        return sum + (t.amount / 1000);
      }, 0);

    const scheduledVisits = this.events.filter(e =>
      e.type === 'visita' && e.date >= today
    ).length;

    return {
      totalProperties: this.properties.length,
      availableProperties: this.properties.filter(p => p.status === 'disponible').length,
      activeLeads,
      monthIncome,
      monthExpenses,
      scheduledVisits,
      pendingTransactions: this.transactions.filter(t => t.status === 'pendiente').length
    };
  },

  // Document Templates
  getDocumentTemplates() {
    return this.documentTemplates;
  },

  getDocumentTemplateById(id) {
    return this.documentTemplates.find(t => t.id === id);
  },

  getDocumentTemplatesByCategory(category) {
    return this.documentTemplates.filter(t => t.category === category);
  },

  getDocumentCategories() {
    return this.documentCategories;
  },

  // Generated Documents
  getGeneratedDocuments() {
    return this.generatedDocuments;
  },

  getGeneratedDocumentById(id) {
    return this.generatedDocuments.find(d => d.id === id);
  },

  saveGeneratedDocument(doc) {
    const existingIndex = this.generatedDocuments.findIndex(d => d.id === doc.id);
    if (existingIndex >= 0) {
      this.generatedDocuments[existingIndex] = doc;
    } else {
      this.generatedDocuments.push(doc);
    }
    return doc;
  },

  deleteGeneratedDocument(id) {
    this.generatedDocuments = this.generatedDocuments.filter(d => d.id !== id);
  },

  // Generate document from template
  generateDocument(templateId, formData) {
    const template = this.getDocumentTemplateById(templateId);
    if (!template) return null;

    let content = template.template;
    const today = new Date();

    // Replace common placeholders
    content = content.replace(/\{\{currentDate\}\}/g, today.toLocaleDateString('es-AR', {
      day: 'numeric', month: 'long', year: 'numeric'
    }));
    content = content.replace(/\{\{city\}\}/g, 'Ciudad Autónoma de Buenos Aires');

    // Replace property placeholders
    if (formData.property) {
      const prop = this.getPropertyById(formData.property);
      if (prop) {
        content = content.replace(/\{\{property\.address\}\}/g, prop.address || '');
        content = content.replace(/\{\{property\.neighborhood\}\}/g, prop.neighborhood || '');
        content = content.replace(/\{\{property\.city\}\}/g, prop.city || 'CABA');
        content = content.replace(/\{\{property\.title\}\}/g, prop.title || '');
        content = content.replace(/\{\{property\.description\}\}/g, prop.description || '');
        content = content.replace(/\{\{property\.area\}\}/g, prop.area || '');
        content = content.replace(/\{\{property\.matricula\}\}/g, prop.matricula || '[COMPLETAR]');
        content = content.replace(/\{\{property\.partida\}\}/g, prop.partida || '[COMPLETAR]');
      }
    }

    // Replace contact placeholders (propietario, inquilino, vendedor, comprador, etc.)
    const contactFields = ['propietario', 'inquilino', 'vendedor', 'comprador', 'cedente', 'cesionario', 'interesado', 'destinatario', 'remitente'];
    contactFields.forEach(field => {
      if (formData[field]) {
        const contact = this.getContactById(formData[field]);
        if (contact) {
          content = content.replace(new RegExp(`\\{\\{${field}\\.name\\}\\}`, 'g'), contact.name || '');
          content = content.replace(new RegExp(`\\{\\{${field}\\.dni\\}\\}`, 'g'), contact.dni || '[DNI]');
          content = content.replace(new RegExp(`\\{\\{${field}\\.address\\}\\}`, 'g'), contact.address || '[DOMICILIO]');
          content = content.replace(new RegExp(`\\{\\{${field}\\.role\\}\\}`, 'g'), contact.type || '');
        }
      }
    });

    // Replace date fields
    const dateFields = ['startDate', 'endDate', 'escrituraDate', 'posesionDate', 'fechaRescision', 'fechaEntrega', 'contratoOriginal', 'senaDate'];
    dateFields.forEach(field => {
      if (formData[field]) {
        const date = new Date(formData[field]);
        const formatted = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
        content = content.replace(new RegExp(`\\{\\{${field}\\}\\}`, 'g'), formatted);
      }
    });

    // Replace currency amounts
    const currencyFields = ['monthlyRent', 'deposit', 'precioTotal', 'senaAmount', 'saldoAmount', 'montoReserva', 'precioOperacion', 'montoCesion', 'montoAdeudado', 'penalidad', 'montoDevolucion'];
    currencyFields.forEach(field => {
      if (formData[field]) {
        const amount = parseFloat(formData[field]);
        const formatted = amount.toLocaleString('es-AR');
        content = content.replace(new RegExp(`\\{\\{${field}\\}\\}`, 'g'), formatted);
        // Also replace text version
        content = content.replace(new RegExp(`\\{\\{${field}Text\\}\\}`, 'g'), this.numberToWords(amount));
      }
    });

    // Replace simple text fields
    Object.keys(formData).forEach(key => {
      if (typeof formData[key] === 'string' || typeof formData[key] === 'number') {
        content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), formData[key]);
      }
    });

    // Calculate duration in months for rental contracts
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      content = content.replace(/\{\{duration\}\}/g, months.toString());

      // First adjustment month
      const firstAdj = new Date(start);
      const freqMonths = { 'Trimestral': 3, 'Cuatrimestral': 4, 'Semestral': 6, 'Anual': 12 };
      firstAdj.setMonth(firstAdj.getMonth() + (freqMonths[formData.adjustmentFrequency] || 3));
      content = content.replace(/\{\{firstAdjustmentMonth\}\}/g, firstAdj.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }));
    }

    // Calculate vigencia end date for reserva
    if (formData.vigencia) {
      const fechaVenc = new Date();
      fechaVenc.setDate(fechaVenc.getDate() + parseInt(formData.vigencia));
      content = content.replace(/\{\{fechaVencimiento\}\}/g, fechaVenc.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }));
    }

    // Handle services clause
    if (formData.includedServices && formData.includedServices.length > 0) {
      const services = formData.includedServices.join(', ');
      content = content.replace(/\{\{servicesClause\}\}/g, `Los siguientes servicios están incluidos en el precio del alquiler: ${services}. El resto de los servicios serán abonados por el LOCATARIO.`);
    } else {
      content = content.replace(/\{\{servicesClause\}\}/g, 'Todos los servicios y expensas estarán a cargo del LOCATARIO.');
    }

    // Handle guarantee clause
    if (formData.guarantorName) {
      content = content.replace(/\{\{guaranteeClause\}\}/g, `El LOCATARIO presenta como garante a ${formData.guarantorName}, DNI ${formData.guarantorDNI || '[DNI]'}, con domicilio en ${formData.guarantorAddress || '[DOMICILIO]'}, quien se constituye en fiador solidario, liso y llano, principal pagador.`);
      content = content.replace(/\{\{guarantorName\}\}/g, formData.guarantorName);
      content = content.replace(/\{\{guarantorDNI\}\}/g, formData.guarantorDNI || '[DNI]');
    } else {
      content = content.replace(/\{\{guaranteeClause\}\}/g, 'El LOCATARIO no presenta garante para el presente contrato.');
      content = content.replace(/\{\{guarantorName\}\}/g, '');
      content = content.replace(/\{\{guarantorDNI\}\}/g, '');
    }

    // Handle special clauses
    if (formData.specialClauses || formData.clausulasEspeciales || formData.condiciones || formData.clausulasAdicionales) {
      const clauses = formData.specialClauses || formData.clausulasEspeciales || formData.condiciones || formData.clausulasAdicionales;
      content = content.replace(/\{\{specialClauses\}\}/g, `CLÁUSULAS ESPECIALES:\n${clauses}`);
      content = content.replace(/\{\{clausulasEspeciales\}\}/g, `CLÁUSULAS ESPECIALES:\n${clauses}`);
      content = content.replace(/\{\{condiciones\}\}/g, `CONDICIONES:\n${clauses}`);
      content = content.replace(/\{\{clausulasAdicionales\}\}/g, `CLÁUSULAS ADICIONALES:\n${clauses}`);
    } else {
      content = content.replace(/\{\{specialClauses\}\}/g, '');
      content = content.replace(/\{\{clausulasEspeciales\}\}/g, '');
      content = content.replace(/\{\{condiciones\}\}/g, '');
      content = content.replace(/\{\{clausulasAdicionales\}\}/g, '');
    }

    // Handle muebles clause for boleto
    if (formData.incluyeMuebles && formData.detallesMuebles) {
      content = content.replace(/\{\{mueblesClauses\}\}/g, `BIENES INCLUIDOS: La venta incluye los siguientes muebles y accesorios: ${formData.detallesMuebles}`);
    } else {
      content = content.replace(/\{\{mueblesClauses\}\}/g, '');
    }

    // Handle autorización clause for cesión
    if (formData.autorizacionPropietario) {
      content = content.replace(/\{\{autorizacionClause\}\}/g, 'El propietario del inmueble ha dado su conformidad expresa para la presente cesión.');
    } else {
      content = content.replace(/\{\{autorizacionClause\}\}/g, 'La presente cesión se realiza sin perjuicio de obtener la conformidad del propietario.');
    }

    // Handle penalidad clause for rescisión
    if (formData.penalidad) {
      content = content.replace(/\{\{penalidadClause\}\}/g, `En virtud de la rescisión anticipada, se acuerda una penalidad de ${formData.currency || 'ARS'} ${parseFloat(formData.penalidad).toLocaleString('es-AR')}.`);
    } else {
      content = content.replace(/\{\{penalidadClause\}\}/g, 'Las partes acuerdan que no corresponde penalidad alguna.');
    }

    // Handle depósito clause for rescisión
    if (formData.devolucionDeposito === 'Total') {
      content = content.replace(/\{\{depositoClause\}\}/g, 'El LOCADOR procederá a la devolución total del depósito de garantía oportunamente entregado.');
    } else if (formData.devolucionDeposito === 'Parcial' && formData.montoDevolucion) {
      content = content.replace(/\{\{depositoClause\}\}/g, `El LOCADOR procederá a la devolución parcial del depósito, por la suma de ${formData.currency || 'ARS'} ${parseFloat(formData.montoDevolucion).toLocaleString('es-AR')}.`);
    } else {
      content = content.replace(/\{\{depositoClause\}\}/g, 'Las partes acuerdan que no corresponde devolución del depósito de garantía.');
    }

    // Handle deudas clause
    if (formData.deudasPendientes) {
      content = content.replace(/\{\{deudasClause\}\}/g, `Las siguientes deudas quedan pendientes de regularización: ${formData.deudasPendientes}`);
    } else {
      content = content.replace(/\{\{deudasClause\}\}/g, 'Las partes declaran que no existen deudas pendientes.');
    }

    // Handle obligaciones pendientes for cesión
    if (formData.obligacionesPendientes) {
      content = content.replace(/\{\{obligacionesPendientes\}\}/g, formData.obligacionesPendientes);
    } else {
      content = content.replace(/\{\{obligacionesPendientes\}\}/g, 'No existen obligaciones pendientes.');
    }

    // Handle carta documento specifics
    const motivoTextos = {
      'Intimación de Pago': 'intimarle fehacientemente al pago de las sumas adeudadas',
      'Rescisión de Contrato': 'notificarle la rescisión del contrato que nos vincula',
      'Reclamo': 'formular formal reclamo',
      'Notificación': 'notificarle formalmente',
      'Otro': 'comunicarle'
    };
    content = content.replace(/\{\{motivoTexto\}\}/g, motivoTextos[formData.motivo] || 'comunicarle');

    if (formData.property) {
      const prop = this.getPropertyById(formData.property);
      content = content.replace(/\{\{propertyReference\}\}/g, `El presente reclamo se refiere al inmueble ubicado en ${prop?.address || '[DIRECCIÓN]'}.`);
    } else {
      content = content.replace(/\{\{propertyReference\}\}/g, '');
    }

    if (formData.montoAdeudado) {
      content = content.replace(/\{\{montoReference\}\}/g, `El monto adeudado asciende a ${formData.currency || 'ARS'} ${parseFloat(formData.montoAdeudado).toLocaleString('es-AR')}.`);
    } else {
      content = content.replace(/\{\{montoReference\}\}/g, '');
    }

    content = content.replace(/\{\{accionRequerida\}\}/g, formData.accionRequerida || 'cumplir con lo requerido');

    if (formData.consecuencias) {
      content = content.replace(/\{\{consecuencias\}\}/g, `En caso de incumplimiento, ${formData.consecuencias}`);
    } else {
      content = content.replace(/\{\{consecuencias\}\}/g, 'En caso de incumplimiento, me veré obligado/a a iniciar las acciones legales correspondientes.');
    }

    // Clean up any remaining placeholders
    content = content.replace(/\{\{[^}]+\}\}/g, '[COMPLETAR]');

    // Create document object
    const doc = {
      id: `doc-${Date.now()}`,
      templateId: templateId,
      templateName: template.name,
      category: template.category,
      content: content,
      formData: formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'borrador'
    };

    return doc;
  },

  // Helper: Number to words (Spanish)
  numberToWords(num) {
    const units = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

    if (num === 0) return 'cero';
    if (num === 100) return 'cien';

    let words = '';

    if (num >= 1000000) {
      const millions = Math.floor(num / 1000000);
      words += (millions === 1 ? 'un millón' : this.numberToWords(millions) + ' millones') + ' ';
      num %= 1000000;
    }

    if (num >= 1000) {
      const thousands = Math.floor(num / 1000);
      words += (thousands === 1 ? 'mil' : this.numberToWords(thousands) + ' mil') + ' ';
      num %= 1000;
    }

    if (num >= 100) {
      words += hundreds[Math.floor(num / 100)] + ' ';
      num %= 100;
    }

    if (num >= 20) {
      const ten = Math.floor(num / 10);
      const unit = num % 10;
      if (unit === 0) {
        words += tens[ten];
      } else if (ten === 2) {
        words += 'veinti' + units[unit];
      } else {
        words += tens[ten] + ' y ' + units[unit];
      }
    } else if (num >= 10) {
      words += teens[num - 10];
    } else if (num > 0) {
      words += units[num];
    }

    return words.trim();
  },

  // =============================================
  // API INTEGRATION METHODS
  // =============================================

  // Flag to track if we're using API or mock data
  useAPI: false,

  async loadLeadsFromAPI() {
    const response = await API.getLeads();

    if (response.success) {
      this.useAPI = true;
      this.leads = response.leads;
      return this.leads;
    }

    console.warn('Failed to load leads from API, using mock data');
    return this.leads;
  },

  async createLeadViaAPI(leadData) {
    const response = await API.createLead(leadData);

    if (response.success) {
      // Add to local cache
      this.leads.unshift(response.lead);
      return response.lead;
    }

    throw new Error(response.error || 'Error al crear lead');
  },

  async updateLeadViaAPI(leadId, updates) {
    const response = await API.updateLead(leadId, updates);

    if (response.success) {
      // Update local cache
      const index = this.leads.findIndex(l => l.id === leadId);
      if (index !== -1) {
        this.leads[index] = { ...this.leads[index], ...response.lead };
      }
      return response.lead;
    }

    throw new Error(response.error || 'Error al actualizar lead');
  },

  async deleteLeadViaAPI(leadId) {
    const response = await API.deleteLead(leadId);

    if (response.success) {
      // Remove from local cache
      this.leads = this.leads.filter(l => l.id !== leadId);
      return true;
    }

    throw new Error(response.error || 'Error al eliminar lead');
  },

  async updateLeadStageViaAPI(leadId, newStage) {
    return this.updateLeadViaAPI(leadId, { stage: newStage });
  },

  // =============================================
  // PROPERTIES API INTEGRATION METHODS
  // =============================================

  async loadPropertiesFromAPI(filters = {}) {
    const response = await API.getProperties(filters);

    if (response.success) {
      this.useAPI = true;
      this.properties = response.properties;
      return this.properties;
    }

    console.warn('Failed to load properties from API, using mock data');
    return this.properties;
  },

  async getPropertyFromAPI(propertyId) {
    const response = await API.getProperty(propertyId);

    if (response.success && response.property) {
      // Update local cache
      const index = this.properties.findIndex(p => p.id === propertyId);
      if (index !== -1) {
        this.properties[index] = response.property;
      }
      return response.property;
    }

    throw new Error(response.error || 'Error al obtener propiedad');
  },

  async createPropertyViaAPI(propertyData) {
    const response = await API.createProperty(propertyData);

    if (response.success) {
      // Add to local cache
      this.properties.unshift(response.property);
      return response.property;
    }

    throw new Error(response.error || 'Error al crear propiedad');
  },

  async updatePropertyViaAPI(propertyId, updates) {
    const response = await API.updateProperty(propertyId, updates);

    if (response.success) {
      // Update local cache
      const index = this.properties.findIndex(p => p.id === propertyId);
      if (index !== -1) {
        this.properties[index] = { ...this.properties[index], ...response.property };
      }
      return response.property;
    }

    throw new Error(response.error || 'Error al actualizar propiedad');
  },

  async deletePropertyViaAPI(propertyId) {
    const response = await API.deleteProperty(propertyId);

    if (response.success) {
      // Remove from local cache
      this.properties = this.properties.filter(p => p.id !== propertyId);
      return true;
    }

    throw new Error(response.error || 'Error al eliminar propiedad');
  },

  // =============================================
  // USERS API INTEGRATION METHODS
  // =============================================

  async loadUsersFromAPI(filters = {}) {
    const response = await API.getUsers(filters);

    if (response.users) {
      this.useAPI = true;
      this.users = response.users;
      return this.users;
    }

    console.warn('Failed to load users from API, using mock data');
    return this.users;
  },

  async getUserFromAPI(userId) {
    const response = await API.getUser(userId);

    if (response.user) {
      // Update local cache
      const index = this.users.findIndex(u => u.id === userId);
      if (index !== -1) {
        this.users[index] = response.user;
      }
      return response.user;
    }

    throw new Error(response.error || 'Error al obtener usuario');
  },

  async createUserViaAPI(userData) {
    const response = await API.createUser(userData);

    if (response.user) {
      // Add to local cache
      this.users.unshift(response.user);
      return response.user;
    }

    // Handle specific errors
    if (response.error) {
      throw new Error(response.error);
    }
    if (response.errors) {
      throw new Error(response.errors.map(e => e.msg).join(', '));
    }

    throw new Error('Error al crear usuario');
  },

  async updateUserViaAPI(userId, updates) {
    const response = await API.updateUser(userId, updates);

    if (response.user) {
      // Update local cache
      const index = this.users.findIndex(u => u.id === userId);
      if (index !== -1) {
        this.users[index] = { ...this.users[index], ...response.user };
      }
      return response.user;
    }

    throw new Error(response.error || 'Error al actualizar usuario');
  },

  async deleteUserViaAPI(userId) {
    const response = await API.deleteUser(userId);

    if (response.message) {
      // Remove from local cache
      this.users = this.users.filter(u => u.id !== userId);
      return true;
    }

    throw new Error(response.error || 'Error al eliminar usuario');
  },

  async resetUserPasswordViaAPI(userId, newPassword) {
    const response = await API.resetUserPassword(userId, newPassword);

    if (response.message) {
      return true;
    }

    throw new Error(response.error || 'Error al restablecer contraseña');
  },

  // =============================================
  // CONTACTS API INTEGRATION METHODS
  // =============================================

  async loadContactsFromAPI(filters = {}) {
    const response = await API.getContacts(filters);

    if (response.success !== false && response.contacts) {
      this.useAPI = true;
      this.contacts = response.contacts;
      return this.contacts;
    }

    console.warn('Failed to load contacts from API, using mock data');
    return this.contacts;
  },

  async getContactFromAPI(contactId) {
    const response = await API.getContact(contactId);

    if (response.contact) {
      // Update local cache
      const index = this.contacts.findIndex(c => c.id === contactId);
      if (index !== -1) {
        this.contacts[index] = response.contact;
      }
      return response.contact;
    }

    throw new Error(response.error || 'Error al obtener contacto');
  },

  async createContactViaAPI(contactData) {
    const response = await API.createContact(contactData);

    if (response.contact) {
      // Add to local cache
      this.contacts.unshift(response.contact);
      return response.contact;
    }

    throw new Error(response.error || 'Error al crear contacto');
  },

  async updateContactViaAPI(contactId, updates) {
    const response = await API.updateContact(contactId, updates);

    if (response.contact) {
      // Update local cache
      const index = this.contacts.findIndex(c => c.id === contactId);
      if (index !== -1) {
        this.contacts[index] = { ...this.contacts[index], ...response.contact };
      }
      return response.contact;
    }

    throw new Error(response.error || 'Error al actualizar contacto');
  },

  async deleteContactViaAPI(contactId) {
    const response = await API.deleteContact(contactId);

    if (response.message) {
      // Remove from local cache
      this.contacts = this.contacts.filter(c => c.id !== contactId);
      return true;
    }

    throw new Error(response.error || 'Error al eliminar contacto');
  },

  // =============================================
  // TRANSACTIONS API INTEGRATION METHODS
  // =============================================

  async loadTransactionsFromAPI(filters = {}) {
    const response = await API.getTransactions(filters);

    if (response.success !== false && response.transactions) {
      this.useAPI = true;
      this.transactions = response.transactions;
      return this.transactions;
    }

    console.warn('Failed to load transactions from API, using mock data');
    return this.transactions;
  },

  async getTransactionsSummaryFromAPI(filters = {}) {
    const response = await API.getTransactionsSummary(filters);

    if (response.success !== false && response.summary) {
      return response.summary;
    }

    throw new Error(response.error || 'Error al obtener resumen de transacciones');
  },

  async getTransactionFromAPI(transactionId) {
    const response = await API.getTransaction(transactionId);

    if (response.transaction) {
      // Update local cache
      const index = this.transactions.findIndex(t => t.id === transactionId);
      if (index !== -1) {
        this.transactions[index] = response.transaction;
      }
      return response.transaction;
    }

    throw new Error(response.error || 'Error al obtener transacción');
  },

  async createTransactionViaAPI(transactionData) {
    const response = await API.createTransaction(transactionData);

    if (response.transaction) {
      // Add to local cache
      this.transactions.unshift(response.transaction);
      return response.transaction;
    }

    throw new Error(response.error || 'Error al crear transacción');
  },

  async updateTransactionViaAPI(transactionId, updates) {
    const response = await API.updateTransaction(transactionId, updates);

    if (response.transaction) {
      // Update local cache
      const index = this.transactions.findIndex(t => t.id === transactionId);
      if (index !== -1) {
        this.transactions[index] = { ...this.transactions[index], ...response.transaction };
      }
      return response.transaction;
    }

    throw new Error(response.error || 'Error al actualizar transacción');
  },

  async deleteTransactionViaAPI(transactionId) {
    const response = await API.deleteTransaction(transactionId);

    if (response.message) {
      // Remove from local cache
      this.transactions = this.transactions.filter(t => t.id !== transactionId);
      return true;
    }

    throw new Error(response.error || 'Error al eliminar transacción');
  },

  // =============================================
  // EVENTS API INTEGRATION METHODS
  // =============================================

  async loadEventsFromAPI(filters = {}) {
    const response = await API.getEvents(filters);

    if (response.success !== false && response.events) {
      this.useAPI = true;
      this.events = response.events;
      return this.events;
    }

    console.warn('Failed to load events from API, using mock data');
    return this.events;
  },

  async getUpcomingEventsFromAPI(limit = 10) {
    const response = await API.getUpcomingEvents(limit);

    if (response.success !== false && response.events) {
      return response.events;
    }

    // Fallback to local method
    return this.getUpcomingEvents(limit);
  },

  async getEventFromAPI(eventId) {
    const response = await API.getEvent(eventId);

    if (response.event) {
      // Update local cache
      const index = this.events.findIndex(e => e.id === eventId);
      if (index !== -1) {
        this.events[index] = response.event;
      }
      return response.event;
    }

    throw new Error(response.error || 'Error al obtener evento');
  },

  async createEventViaAPI(eventData) {
    const response = await API.createEvent(eventData);

    if (response.event) {
      // Add to local cache
      this.events.unshift(response.event);
      return response.event;
    }

    throw new Error(response.error || 'Error al crear evento');
  },

  async updateEventViaAPI(eventId, updates) {
    const response = await API.updateEvent(eventId, updates);

    if (response.event) {
      // Update local cache
      const index = this.events.findIndex(e => e.id === eventId);
      if (index !== -1) {
        this.events[index] = { ...this.events[index], ...response.event };
      }
      return response.event;
    }

    throw new Error(response.error || 'Error al actualizar evento');
  },

  async deleteEventViaAPI(eventId) {
    const response = await API.deleteEvent(eventId);

    if (response.message) {
      // Remove from local cache
      this.events = this.events.filter(e => e.id !== eventId);
      return true;
    }

    throw new Error(response.error || 'Error al eliminar evento');
  },

  // =============================================
  // RENTALS API INTEGRATION METHODS
  // =============================================

  async loadRentalsFromAPI(filters = {}) {
    const response = await API.getRentals(filters);

    if (response.success !== false && response.rentals) {
      this.useAPI = true;
      this.rentals = response.rentals;
      return this.rentals;
    }

    console.warn('Failed to load rentals from API, using mock data');
    return this.rentals;
  },

  async getExpiringRentalsFromAPI(days = 90) {
    const response = await API.getExpiringRentals(days);

    if (response.success !== false && response.rentals) {
      return response.rentals;
    }

    // Fallback to local method
    return this.getExpiringRentals(days);
  },

  async getUpcomingAdjustmentsFromAPI(days = 30) {
    const response = await API.getUpcomingAdjustments(days);

    if (response.success !== false && response.rentals) {
      return response.rentals;
    }

    // Fallback to local method
    return this.getUpcomingAdjustments(days);
  },

  async getRentalStatsFromAPI() {
    const response = await API.getRentalStats();

    if (response.success !== false && response.stats) {
      return response.stats;
    }

    // Fallback to local method
    return this.getRentalStats();
  },

  async getRentalFromAPI(rentalId) {
    const response = await API.getRental(rentalId);

    if (response.rental) {
      // Update local cache
      const index = this.rentals.findIndex(r => r.id === rentalId);
      if (index !== -1) {
        this.rentals[index] = response.rental;
      }
      return response.rental;
    }

    throw new Error(response.error || 'Error al obtener contrato');
  },

  async createRentalViaAPI(rentalData) {
    const response = await API.createRental(rentalData);

    if (response.rental) {
      // Add to local cache
      this.rentals.unshift(response.rental);
      return response.rental;
    }

    throw new Error(response.error || 'Error al crear contrato');
  },

  async updateRentalViaAPI(rentalId, updates) {
    const response = await API.updateRental(rentalId, updates);

    if (response.rental) {
      // Update local cache
      const index = this.rentals.findIndex(r => r.id === rentalId);
      if (index !== -1) {
        this.rentals[index] = { ...this.rentals[index], ...response.rental };
      }
      return response.rental;
    }

    throw new Error(response.error || 'Error al actualizar contrato');
  },

  async deleteRentalViaAPI(rentalId) {
    const response = await API.deleteRental(rentalId);

    if (response.message) {
      // Remove from local cache
      this.rentals = this.rentals.filter(r => r.id !== rentalId);
      return true;
    }

    throw new Error(response.error || 'Error al eliminar contrato');
  },

  // =============================================
  // GENERATED DOCUMENTS API METHODS
  // =============================================

  // Local cache for generated documents
  generatedDocuments: [],

  async loadDocumentsFromAPI(filters = {}) {
    const response = await API.getDocuments(filters);

    if (response.documents) {
      this.generatedDocuments = response.documents;
      return {
        documents: this.generatedDocuments,
        pagination: response.pagination
      };
    }

    // Fallback to empty array if API fails
    console.warn('Could not load documents from API, returning empty list');
    return { documents: [], pagination: { total: 0 } };
  },

  async getDocumentStats() {
    const response = await API.getDocumentStats();

    if (response.stats) {
      return response.stats;
    }

    // Fallback to default stats
    return {
      totalDocuments: 0,
      byCategory: {},
      byStatus: {},
      recentDocuments: []
    };
  },

  async getDocumentById(documentId) {
    // First check local cache
    let document = this.generatedDocuments.find(d => d.id === documentId);

    if (!document) {
      // Fetch from API
      const response = await API.getDocument(documentId);
      if (response.document) {
        document = response.document;
      }
    }

    return document;
  },

  async createDocumentViaAPI(documentData) {
    const response = await API.createDocument(documentData);

    if (response.document) {
      // Add to local cache
      this.generatedDocuments.unshift(response.document);
      return response.document;
    }

    throw new Error(response.error || 'Error al crear documento');
  },

  async updateDocumentViaAPI(documentId, updates) {
    const response = await API.updateDocument(documentId, updates);

    if (response.document) {
      // Update local cache
      const index = this.generatedDocuments.findIndex(d => d.id === documentId);
      if (index !== -1) {
        this.generatedDocuments[index] = response.document;
      }
      return response.document;
    }

    throw new Error(response.error || 'Error al actualizar documento');
  },

  async deleteDocumentViaAPI(documentId) {
    const response = await API.deleteDocument(documentId);

    if (response.message) {
      // Remove from local cache
      this.generatedDocuments = this.generatedDocuments.filter(d => d.id !== documentId);
      return true;
    }

    throw new Error(response.error || 'Error al eliminar documento');
  },

  // =============================================
  // DASHBOARD API METHODS
  // =============================================

  // Cache for dashboard stats from API
  dashboardStatsCache: null,
  dashboardUpcomingEvents: null,
  dashboardRecentLeads: null,

  async loadDashboardStatsFromAPI() {
    const response = await API.getDashboardStats();

    if (response.stats) {
      this.dashboardStatsCache = response.stats;
      this.dashboardUpcomingEvents = response.upcomingEvents || [];
      this.dashboardRecentLeads = response.recentLeads || [];
      return {
        stats: this.dashboardStatsCache,
        upcomingEvents: this.dashboardUpcomingEvents,
        recentLeads: this.dashboardRecentLeads
      };
    }

    // Fallback to local method
    console.warn('Could not load dashboard stats from API, using local data');
    return {
      stats: this.getDashboardStats(),
      upcomingEvents: this.getUpcomingEvents(5),
      recentLeads: this.getLeads().slice(0, 5)
    };
  },

  // Get cached dashboard stats or compute from local data
  getDashboardStatsWithCache() {
    if (this.dashboardStatsCache) {
      return this.dashboardStatsCache;
    }
    return this.getDashboardStats();
  },

  getUpcomingEventsWithCache(limit = 5) {
    if (this.dashboardUpcomingEvents) {
      return this.dashboardUpcomingEvents.slice(0, limit);
    }
    return this.getUpcomingEvents(limit);
  },

  getRecentLeadsWithCache(limit = 5) {
    if (this.dashboardRecentLeads) {
      return this.dashboardRecentLeads.slice(0, limit);
    }
    return this.getLeads().slice(0, limit);
  },

  // =============================================
  // TASKS API INTEGRATION METHODS
  // =============================================

  async loadTasksFromAPI(filters = {}) {
    const response = await API.getTasks(filters);

    if (response.success && response.tasks) {
      this.tasks = response.tasks;
      return this.tasks;
    }

    console.warn('Failed to load tasks from API');
    return this.tasks;
  },

  async loadMyTasksFromAPI(includeCompleted = false) {
    const response = await API.getMyTasks(includeCompleted);

    if (response.success) {
      this.tasks = response.tasks || [];
      return response;
    }

    console.warn('Failed to load my tasks from API');
    return { tasks: [], summary: {}, grouped: {} };
  },

  async getTaskStatsFromAPI() {
    const response = await API.getTaskStats();

    if (response.success) {
      return response;
    }

    return { total: 0, overdue: 0, byStatus: {}, byPriority: {} };
  },

  async getTaskFromAPI(taskId) {
    const response = await API.getTask(taskId);

    if (response.success && response.task) {
      // Update local cache
      const index = this.tasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        this.tasks[index] = response.task;
      }
      return response.task;
    }

    throw new Error(response.error || 'Error al obtener tarea');
  },

  async createTaskViaAPI(taskData) {
    const response = await API.createTask(taskData);

    if (response.success && response.task) {
      // Add to local cache
      this.tasks.unshift(response.task);
      return response.task;
    }

    throw new Error(response.error || 'Error al crear tarea');
  },

  async updateTaskViaAPI(taskId, updates) {
    const response = await API.updateTask(taskId, updates);

    if (response.success && response.task) {
      // Update local cache
      const index = this.tasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        this.tasks[index] = { ...this.tasks[index], ...response.task };
      }
      return response.task;
    }

    throw new Error(response.error || 'Error al actualizar tarea');
  },

  async completeTaskViaAPI(taskId) {
    const response = await API.completeTask(taskId);

    if (response.success && response.task) {
      // Update local cache
      const index = this.tasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        this.tasks[index] = response.task;
      }
      return response.task;
    }

    throw new Error(response.error || 'Error al completar tarea');
  },

  async deleteTaskViaAPI(taskId) {
    const response = await API.deleteTask(taskId);

    if (response.success) {
      // Remove from local cache
      this.tasks = this.tasks.filter(t => t.id !== taskId);
      return true;
    }

    throw new Error(response.error || 'Error al eliminar tarea');
  },

  // Local task methods (for cached data)
  getTasks(filters = {}) {
    let result = [...this.tasks];

    if (filters.status) {
      result = result.filter(t => t.status === filters.status);
    }
    if (filters.priority) {
      result = result.filter(t => t.priority === filters.priority);
    }
    if (filters.leadId) {
      result = result.filter(t => t.lead?.id === filters.leadId);
    }

    return result;
  },

  getTaskById(id) {
    return this.tasks.find(t => t.id === id);
  },

  getTasksByLead(leadId) {
    return this.tasks.filter(t => t.lead?.id === leadId);
  },

  getOverdueTasks() {
    const now = new Date();
    return this.tasks.filter(t => {
      if (['completada', 'cancelada'].includes(t.status)) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate < now;
    });
  },

  getTodayTasks() {
    const today = new Date().toISOString().split('T')[0];
    return this.tasks.filter(t => {
      if (['completada', 'cancelada'].includes(t.status)) return false;
      return t.dueDate === today;
    });
  },

  getPendingTasksCount() {
    return this.tasks.filter(t =>
      !['completada', 'cancelada'].includes(t.status)
    ).length;
  },

  // =============================================
  // LEAD ACTIVITIES (API Integration)
  // =============================================

  async getLeadActivitiesViaAPI(leadId, filters = {}) {
    const response = await API.getLeadActivities(leadId, filters);

    if (response.success && response.activities) {
      return response.activities;
    }

    throw new Error(response.error || 'Error al obtener actividades');
  },

  async addLeadActivityViaAPI(leadId, activityData) {
    const response = await API.addLeadActivity(leadId, activityData);

    if (response.success && response.activity) {
      // Update lead in local cache to increment activity count
      const leadIndex = this.leads.findIndex(l => l.id === leadId);
      if (leadIndex !== -1 && this.leads[leadIndex]._count) {
        this.leads[leadIndex]._count.activities = (this.leads[leadIndex]._count.activities || 0) + 1;
      }
      return response.activity;
    }

    throw new Error(response.error || 'Error al registrar actividad');
  },

  async updateLeadActivityViaAPI(leadId, activityId, activityData) {
    const response = await API.updateLeadActivity(leadId, activityId, activityData);

    if (response.success && response.activity) {
      return response.activity;
    }

    throw new Error(response.error || 'Error al actualizar actividad');
  },

  async deleteLeadActivityViaAPI(leadId, activityId) {
    const response = await API.deleteLeadActivity(leadId, activityId);

    if (response.success) {
      // Update lead in local cache to decrement activity count
      const leadIndex = this.leads.findIndex(l => l.id === leadId);
      if (leadIndex !== -1 && this.leads[leadIndex]._count) {
        this.leads[leadIndex]._count.activities = Math.max(0, (this.leads[leadIndex]._count.activities || 1) - 1);
      }
      return true;
    }

    throw new Error(response.error || 'Error al eliminar actividad');
  },

  // Get activity type info
  getActivityTypeInfo(typeId) {
    return this.activityTypes.find(t => t.id === typeId) || { id: typeId, name: typeId, icon: 'activity' };
  },

  // Get activity outcome info
  getActivityOutcomeInfo(outcomeId) {
    return this.activityOutcomes.find(o => o.id === outcomeId) || { id: outcomeId, name: outcomeId, color: '#9CA3AF' };
  }
};
