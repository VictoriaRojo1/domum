/**
 * DOMUM - API Module
 * Handles all HTTP requests to the backend
 */

const API = {
  // Auto-detect: use relative URL in production, localhost in development
  BASE_URL: window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : '/api',

  // Supabase configuration for direct uploads (bypasses Vercel 4.5MB limit)
  SUPABASE_URL: 'https://lnqgspfmoaqjgneorist.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxucWdzcGZtb2FxamduZW9yaXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MDg0ODMsImV4cCI6MjA4OTI4NDQ4M30.588UPQEHkA3kQXBWRt6Ia2F0Vouvvq_Q2Gm_S94JXYg',
  SUPABASE_BUCKET: 'properties',

  // =============================================
  // TOKEN MANAGEMENT
  // =============================================

  getAccessToken() {
    return localStorage.getItem('domum_accessToken');
  },

  getRefreshToken() {
    return localStorage.getItem('domum_refreshToken');
  },

  setTokens(accessToken, refreshToken) {
    localStorage.setItem('domum_accessToken', accessToken);
    localStorage.setItem('domum_refreshToken', refreshToken);
  },

  clearTokens() {
    localStorage.removeItem('domum_accessToken');
    localStorage.removeItem('domum_refreshToken');
  },

  // =============================================
  // STAGE MAPPING (Frontend <-> Backend)
  // =============================================

  stageToBackend(frontendStage) {
    // Convert lowercase frontend stage to uppercase backend enum
    return frontendStage ? frontendStage.toUpperCase() : 'NUEVO';
  },

  stageToFrontend(backendStage) {
    // Convert uppercase backend enum to lowercase frontend stage
    return backendStage ? backendStage.toLowerCase() : 'nuevo';
  },

  sourceToBackend(frontendSource) {
    // Map frontend source IDs to backend enum values
    const mapping = {
      'referido': 'REFERIDO',
      'instagram': 'INSTAGRAM',
      'facebook': 'FACEBOOK',
      'linkedin': 'LINKEDIN',
      'google': 'GOOGLE',
      'directo': 'DIRECTO',
      'otro': 'OTRO'
    };
    return mapping[frontendSource] || 'REFERIDO';
  },

  sourceToFrontend(backendSource) {
    return backendSource ? backendSource.toLowerCase() : 'referido';
  },

  // =============================================
  // PROPERTY TYPE/STATUS MAPPING (Frontend <-> Backend)
  // =============================================

  propertyTypeToBackend(frontendType) {
    const mapping = {
      'departamento': 'DEPARTAMENTO',
      'casa': 'CASA',
      'ph': 'PH',
      'local': 'LOCAL',
      'oficina': 'OFICINA',
      'terreno': 'TERRENO',
      'cochera': 'COCHERA',
      'quinta': 'QUINTA',
      'edificio': 'EDIFICIO'
    };
    return mapping[frontendType] || 'DEPARTAMENTO';
  },

  propertyTypeToFrontend(backendType) {
    return backendType ? backendType.toLowerCase() : 'departamento';
  },

  operationToBackend(frontendOp) {
    const mapping = {
      'venta': 'VENTA',
      'alquiler': 'ALQUILER',
      'alquiler_temporario': 'ALQUILER_TEMPORARIO'
    };
    return mapping[frontendOp] || 'VENTA';
  },

  operationToFrontend(backendOp) {
    return backendOp ? backendOp.toLowerCase() : 'venta';
  },

  propertyStatusToBackend(frontendStatus) {
    const mapping = {
      'disponible': 'DISPONIBLE',
      'reservada': 'RESERVADA',
      'en_negociacion': 'EN_NEGOCIACION',
      'alquilada': 'ALQUILADA',
      'vendida': 'VENDIDA',
      'suspendida': 'SUSPENDIDA',
      'pausada': 'SUSPENDIDA'
    };
    return mapping[frontendStatus] || 'DISPONIBLE';
  },

  propertyStatusToFrontend(backendStatus) {
    return backendStatus ? backendStatus.toLowerCase() : 'disponible';
  },

  currencyToBackend(frontendCurrency) {
    return frontendCurrency ? frontendCurrency.toUpperCase() : 'USD';
  },

  currencyToFrontend(backendCurrency) {
    return backendCurrency ? backendCurrency.toUpperCase() : 'USD';
  },

  // =============================================
  // HTTP REQUEST HELPER
  // =============================================

  async request(endpoint, options = {}) {
    const url = `${this.BASE_URL}${endpoint}`;
    const token = this.getAccessToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      // Handle 401 - try to refresh token
      if (response.status === 401 && this.getRefreshToken()) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry original request with new token
          config.headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
          const retryResponse = await fetch(url, config);
          return this.handleResponse(retryResponse);
        }
      }

      return this.handleResponse(response);
    } catch (error) {
      console.error('API Request Error:', error);
      return {
        success: false,
        error: 'Error de conexión. Verificá que el servidor esté corriendo.'
      };
    }
  },

  async handleResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      return { success: true, ...data };
    }

    return {
      success: false,
      status: response.status,
      error: data.error || data.message || 'Error desconocido',
      errors: data.errors || []
    };
  },

  // =============================================
  // AUTH ENDPOINTS
  // =============================================

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    if (response.success) {
      this.setTokens(response.accessToken, response.refreshToken);
      return {
        success: true,
        user: response.user
      };
    }

    return response;
  },

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.clearTokens();
    return { success: true };
  },

  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.accessToken, data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    this.clearTokens();
    return false;
  },

  async getMe() {
    return this.request('/auth/me');
  },

  // =============================================
  // LEADS ENDPOINTS
  // =============================================

  async getLeads(filters = {}) {
    const params = new URLSearchParams();

    if (filters.stage) params.append('stage', this.stageToBackend(filters.stage));
    if (filters.source) params.append('source', this.sourceToBackend(filters.source));
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const queryString = params.toString();
    const endpoint = `/leads${queryString ? `?${queryString}` : ''}`;

    const response = await this.request(endpoint);

    if (response.success && response.leads) {
      // Transform leads to frontend format
      response.leads = response.leads.map(lead => this.transformLeadToFrontend(lead));
    }

    return response;
  },

  async getLeadStats() {
    return this.request('/leads/stats');
  },

  async getPendingFollowUps() {
    const response = await this.request('/leads/follow-ups/pending');

    if (response.success && response.notifications) {
      // Transform activity types to frontend format
      response.notifications = response.notifications.map(n => ({
        ...n,
        type: this.activityTypeToFrontend(n.type)
      }));
    }

    return response;
  },

  async getLead(id) {
    const response = await this.request(`/leads/${id}`);

    if (response.success && response.lead) {
      response.lead = this.transformLeadToFrontend(response.lead);
    }

    return response;
  },

  async createLead(data) {
    const backendData = this.transformLeadToBackend(data);

    const response = await this.request('/leads', {
      method: 'POST',
      body: backendData
    });

    if (response.success && response.lead) {
      response.lead = this.transformLeadToFrontend(response.lead);
    }

    return response;
  },

  async updateLead(id, data) {
    const backendData = this.transformLeadToBackend(data);

    const response = await this.request(`/leads/${id}`, {
      method: 'PUT',
      body: backendData
    });

    if (response.success && response.lead) {
      response.lead = this.transformLeadToFrontend(response.lead);
    }

    return response;
  },

  async deleteLead(id) {
    return this.request(`/leads/${id}`, { method: 'DELETE' });
  },

  // =============================================
  // ACTIVITY TYPE/OUTCOME MAPPING
  // =============================================

  activityTypeToBackend(frontendType) {
    const mapping = {
      'llamada_entrante': 'LLAMADA_ENTRANTE',
      'llamada_saliente': 'LLAMADA_SALIENTE',
      'whatsapp': 'WHATSAPP',
      'email': 'EMAIL',
      'visita': 'VISITA',
      'reunion': 'REUNION',
      'nota': 'NOTA',
      'oferta': 'OFERTA',
      'seguimiento': 'SEGUIMIENTO'
    };
    return mapping[frontendType] || 'NOTA';
  },

  activityTypeToFrontend(backendType) {
    return backendType ? backendType.toLowerCase() : 'nota';
  },

  activityOutcomeToBackend(frontendOutcome) {
    const mapping = {
      'exitoso': 'EXITOSO',
      'sin_respuesta': 'SIN_RESPUESTA',
      'ocupado': 'OCUPADO',
      'rechazado': 'RECHAZADO',
      'pendiente': 'PENDIENTE',
      'no_aplica': 'NO_APLICA'
    };
    return mapping[frontendOutcome] || 'NO_APLICA';
  },

  activityOutcomeToFrontend(backendOutcome) {
    return backendOutcome ? backendOutcome.toLowerCase() : 'no_aplica';
  },

  // =============================================
  // LEAD ACTIVITIES ENDPOINTS
  // =============================================

  async getLeadActivities(leadId, filters = {}) {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', this.activityTypeToBackend(filters.type));
    if (filters.outcome) params.append('outcome', this.activityOutcomeToBackend(filters.outcome));
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const queryString = params.toString();
    const response = await this.request(`/leads/${leadId}/activities${queryString ? `?${queryString}` : ''}`);

    if (response.success && response.activities) {
      response.activities = response.activities.map(a => this.transformActivityToFrontend(a));
    }

    return response;
  },

  async addLeadActivity(leadId, activity) {
    const backendData = this.transformActivityToBackend(activity);

    const response = await this.request(`/leads/${leadId}/activities`, {
      method: 'POST',
      body: backendData
    });

    if (response.success && response.activity) {
      response.activity = this.transformActivityToFrontend(response.activity);
    }

    return response;
  },

  async updateLeadActivity(leadId, activityId, activity) {
    const backendData = this.transformActivityToBackend(activity);

    const response = await this.request(`/leads/${leadId}/activities/${activityId}`, {
      method: 'PUT',
      body: backendData
    });

    if (response.success && response.activity) {
      response.activity = this.transformActivityToFrontend(response.activity);
    }

    return response;
  },

  async deleteLeadActivity(leadId, activityId) {
    return this.request(`/leads/${leadId}/activities/${activityId}`, { method: 'DELETE' });
  },

  // =============================================
  // ACTIVITY DATA TRANSFORMERS
  // =============================================

  transformActivityToFrontend(activity) {
    return {
      ...activity,
      type: this.activityTypeToFrontend(activity.type),
      outcome: this.activityOutcomeToFrontend(activity.outcome),
      // Format dates
      date: activity.date ? activity.date.split('T')[0] : null,
      followUpDate: activity.followUpDate ? activity.followUpDate.split('T')[0] : null,
      createdAt: activity.createdAt ? new Date(activity.createdAt) : null,
      // Map relations
      createdBy: activity.createdBy ? {
        id: activity.createdBy.id,
        name: activity.createdBy.name,
        avatar: activity.createdBy.avatar
      } : null
    };
  },

  transformActivityToBackend(data) {
    const backendData = { ...data };

    // Transform enums if present
    if (data.type) {
      backendData.type = this.activityTypeToBackend(data.type);
    }
    if (data.outcome) {
      backendData.outcome = this.activityOutcomeToBackend(data.outcome);
    }

    // Ensure numeric fields
    if (data.duration !== undefined && data.duration !== null && data.duration !== '') {
      backendData.duration = parseInt(data.duration);
    }

    // Remove read-only fields
    delete backendData.id;
    delete backendData.createdBy;
    delete backendData.createdAt;
    delete backendData.updatedAt;
    delete backendData.leadId;

    return backendData;
  },

  // =============================================
  // LEAD DATA TRANSFORMERS
  // =============================================

  transformLeadToFrontend(lead) {
    return {
      ...lead,
      stage: this.stageToFrontend(lead.stage),
      source: this.sourceToFrontend(lead.source),
      // Map backend relations to frontend format
      assignedTo: lead.assignedToId,
      agent: lead.assignedTo ? {
        id: lead.assignedTo.id,
        name: lead.assignedTo.name,
        avatar: lead.assignedTo.avatar
      } : null,
      // Transform activities if present
      activities: lead.activities ? lead.activities.map(a => this.transformActivityToFrontend(a)) : []
    };
  },

  transformLeadToBackend(data) {
    const backendData = { ...data };

    // Transform stage if present
    if (data.stage) {
      backendData.stage = this.stageToBackend(data.stage);
    }

    // Transform source if present
    if (data.source) {
      backendData.source = this.sourceToBackend(data.source);
    }

    // Map frontend field names to backend field names
    if (data.assignedTo !== undefined) {
      backendData.assignedToId = data.assignedTo;
      delete backendData.assignedTo;
    }

    if (data.property !== undefined) {
      backendData.propertyId = data.property;
      delete backendData.property;
    }

    // Remove frontend-only fields
    delete backendData.agent;
    delete backendData.nextAction;

    return backendData;
  },

  // =============================================
  // USERS ENDPOINTS (CRUD completo)
  // =============================================

  roleToBackend(frontendRole) {
    const mapping = {
      'superadmin': 'SUPERADMIN',
      'administrador': 'ADMIN',
      'admin': 'ADMIN',
      'agente': 'VENDEDOR',
      'vendedor': 'VENDEDOR'
    };
    return mapping[frontendRole] || 'VENDEDOR';
  },

  roleToFrontend(backendRole) {
    const mapping = {
      'SUPERADMIN': 'superadmin',
      'ADMIN': 'administrador',
      'VENDEDOR': 'agente'
    };
    return mapping[backendRole] || 'agente';
  },

  async getUsers(filters = {}) {
    const params = new URLSearchParams();
    if (filters.role) params.append('role', this.roleToBackend(filters.role));
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
    if (filters.search) params.append('search', filters.search);

    const queryString = params.toString();
    const response = await this.request(`/users${queryString ? `?${queryString}` : ''}`);

    if (response.users) {
      response.users = response.users.map(u => this.transformUserToFrontend(u));
    }

    return response;
  },

  async getUser(id) {
    const response = await this.request(`/users/${id}`);

    if (response.user) {
      response.user = this.transformUserToFrontend(response.user);
    }

    return response;
  },

  async createUser(data) {
    const backendData = this.transformUserToBackend(data);

    const response = await this.request('/users', {
      method: 'POST',
      body: backendData
    });

    if (response.user) {
      response.user = this.transformUserToFrontend(response.user);
    }

    return response;
  },

  async updateUser(id, data) {
    const backendData = this.transformUserToBackend(data);

    const response = await this.request(`/users/${id}`, {
      method: 'PUT',
      body: backendData
    });

    if (response.user) {
      response.user = this.transformUserToFrontend(response.user);
    }

    return response;
  },

  async deleteUser(id) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  },

  async resetUserPassword(id, newPassword) {
    return this.request(`/users/${id}/reset-password`, {
      method: 'POST',
      body: { newPassword }
    });
  },

  transformUserToFrontend(user) {
    return {
      ...user,
      role: this.roleToFrontend(user.role),
      status: user.isActive ? 'activo' : 'inactivo',
      avatar: user.avatar || (user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'),
      leadsCount: user._count?.assignedLeads || 0,
      propertiesCount: user._count?.assignedProperties || 0
    };
  },

  transformUserToBackend(data) {
    const backendData = { ...data };

    if (data.role) {
      backendData.role = this.roleToBackend(data.role);
    }
    if (data.status !== undefined) {
      backendData.isActive = data.status === 'activo';
      delete backendData.status;
    }

    // Remove frontend-only fields
    delete backendData.avatar;
    delete backendData.leadsCount;
    delete backendData.propertiesCount;
    delete backendData._count;

    return backendData;
  },

  // =============================================
  // PROPERTIES ENDPOINTS (CRUD completo)
  // =============================================

  async getProperties(filters = {}) {
    const params = new URLSearchParams();

    if (filters.type) params.append('type', this.propertyTypeToBackend(filters.type));
    if (filters.status) params.append('status', this.propertyStatusToBackend(filters.status));
    if (filters.operation) params.append('operation', this.operationToBackend(filters.operation));
    if (filters.city) params.append('city', filters.city);
    if (filters.neighborhood) params.append('neighborhood', filters.neighborhood);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.currency) params.append('currency', this.currencyToBackend(filters.currency));
    if (filters.minRooms) params.append('minRooms', filters.minRooms);
    if (filters.maxRooms) params.append('maxRooms', filters.maxRooms);
    if (filters.featured) params.append('featured', filters.featured);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const queryString = params.toString();
    const endpoint = `/properties${queryString ? `?${queryString}` : ''}`;

    const response = await this.request(endpoint);

    if (response.success && response.properties) {
      response.properties = response.properties.map(prop => this.transformPropertyToFrontend(prop));
    }

    return response;
  },

  async getProperty(id) {
    const response = await this.request(`/properties/${id}`);

    if (response.success && response.property) {
      response.property = this.transformPropertyToFrontend(response.property);
    }

    return response;
  },

  async createProperty(data) {
    const backendData = this.transformPropertyToBackend(data);

    const response = await this.request('/properties', {
      method: 'POST',
      body: backendData
    });

    if (response.success && response.property) {
      response.property = this.transformPropertyToFrontend(response.property);
    }

    return response;
  },

  async updateProperty(id, data) {
    const backendData = this.transformPropertyToBackend(data);

    const response = await this.request(`/properties/${id}`, {
      method: 'PUT',
      body: backendData
    });

    if (response.success && response.property) {
      response.property = this.transformPropertyToFrontend(response.property);
    }

    return response;
  },

  async deleteProperty(id) {
    return this.request(`/properties/${id}`, { method: 'DELETE' });
  },

  // =============================================
  // PROPERTY DATA TRANSFORMERS
  // =============================================

  transformPropertyToFrontend(property) {
    return {
      ...property,
      type: this.propertyTypeToFrontend(property.type),
      operation: this.operationToFrontend(property.operation),
      status: this.propertyStatusToFrontend(property.status),
      currency: this.currencyToFrontend(property.currency),
      assignedTo: property.assignedToId,
      agent: property.assignedTo ? {
        id: property.assignedTo.id,
        name: property.assignedTo.name,
        phone: property.assignedTo.phone,
        email: property.assignedTo.email,
        avatar: property.assignedTo.avatar
      } : null,
      // Map backend field names to frontend expectations
      area: property.totalArea || property.area,
      leadsCount: property._count?.leads || 0
    };
  },

  transformPropertyToBackend(data) {
    const backendData = { ...data };

    // Transform enums if present
    if (data.type) {
      backendData.type = this.propertyTypeToBackend(data.type);
    }
    if (data.operation) {
      backendData.operation = this.operationToBackend(data.operation);
    }
    if (data.status) {
      backendData.status = this.propertyStatusToBackend(data.status);
    }
    if (data.currency) {
      backendData.currency = this.currencyToBackend(data.currency);
    }

    // Map frontend field names to backend field names
    if (data.assignedTo !== undefined) {
      backendData.assignedToId = data.assignedTo;
      delete backendData.assignedTo;
    }

    // Map area to totalArea for backend
    if (data.area !== undefined) {
      backendData.totalArea = data.area;
      delete backendData.area;
    }

    // Remove frontend-only fields
    delete backendData.agent;
    delete backendData.leadsCount;
    delete backendData._count;

    return backendData;
  },

  // =============================================
  // CONTACTS ENDPOINTS
  // =============================================

  async getContacts(filters = {}) {
    const params = new URLSearchParams();

    if (filters.type) params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const queryString = params.toString();
    const endpoint = `/contacts${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  },

  async getContact(id) {
    return this.request(`/contacts/${id}`);
  },

  async createContact(data) {
    const response = await this.request('/contacts', {
      method: 'POST',
      body: data
    });

    return response;
  },

  async updateContact(id, data) {
    const response = await this.request(`/contacts/${id}`, {
      method: 'PUT',
      body: data
    });

    return response;
  },

  async deleteContact(id) {
    return this.request(`/contacts/${id}`, { method: 'DELETE' });
  },

  // =============================================
  // TRANSACTIONS ENDPOINTS
  // =============================================

  transactionTypeToBackend(frontendType) {
    const mapping = {
      'ingreso': 'INGRESO',
      'egreso': 'EGRESO'
    };
    return mapping[frontendType] || 'INGRESO';
  },

  transactionTypeToFrontend(backendType) {
    return backendType ? backendType.toLowerCase() : 'ingreso';
  },

  async getTransactions(filters = {}) {
    const params = new URLSearchParams();

    if (filters.type) params.append('type', this.transactionTypeToBackend(filters.type));
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.property) params.append('property', filters.property);
    if (filters.contact) params.append('contact', filters.contact);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const queryString = params.toString();
    const endpoint = `/transactions${queryString ? `?${queryString}` : ''}`;

    const response = await this.request(endpoint);

    if (response.success && response.transactions) {
      response.transactions = response.transactions.map(t => this.transformTransactionToFrontend(t));
    }

    return response;
  },

  async getTransactionsSummary(filters = {}) {
    const params = new URLSearchParams();

    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.property) params.append('property', filters.property);

    const queryString = params.toString();
    const endpoint = `/transactions/summary${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  },

  async getTransaction(id) {
    const response = await this.request(`/transactions/${id}`);

    if (response.success && response.transaction) {
      response.transaction = this.transformTransactionToFrontend(response.transaction);
    }

    return response;
  },

  async createTransaction(data) {
    const backendData = this.transformTransactionToBackend(data);

    const response = await this.request('/transactions', {
      method: 'POST',
      body: backendData
    });

    if (response.success && response.transaction) {
      response.transaction = this.transformTransactionToFrontend(response.transaction);
    }

    return response;
  },

  async updateTransaction(id, data) {
    const backendData = this.transformTransactionToBackend(data);

    const response = await this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: backendData
    });

    if (response.success && response.transaction) {
      response.transaction = this.transformTransactionToFrontend(response.transaction);
    }

    return response;
  },

  async deleteTransaction(id) {
    return this.request(`/transactions/${id}`, { method: 'DELETE' });
  },

  // =============================================
  // TRANSACTION DATA TRANSFORMERS
  // =============================================

  transformTransactionToFrontend(transaction) {
    return {
      ...transaction,
      type: this.transactionTypeToFrontend(transaction.type),
      currency: this.currencyToFrontend(transaction.currency),
      // Map relations
      propertyId: transaction.propertyId,
      property: transaction.property ? {
        id: transaction.property.id,
        title: transaction.property.title,
        address: transaction.property.address
      } : null,
      contactId: transaction.contactId,
      contact: transaction.contact ? {
        id: transaction.contact.id,
        name: transaction.contact.name,
        email: transaction.contact.email
      } : null,
      createdBy: transaction.createdBy ? {
        id: transaction.createdBy.id,
        name: transaction.createdBy.name
      } : null
    };
  },

  transformTransactionToBackend(data) {
    const backendData = { ...data };

    // Transform enums if present
    if (data.type) {
      backendData.type = this.transactionTypeToBackend(data.type);
    }
    if (data.currency) {
      backendData.currency = this.currencyToBackend(data.currency);
    }

    // Ensure amount is a number
    if (data.amount !== undefined) {
      backendData.amount = parseFloat(data.amount);
    }

    // Remove frontend-only fields
    delete backendData.property;
    delete backendData.contact;
    delete backendData.createdBy;

    return backendData;
  },

  // =============================================
  // EVENTS ENDPOINTS
  // =============================================

  eventTypeToBackend(frontendType) {
    const mapping = {
      'visita': 'VISITA',
      'reunion': 'REUNION',
      'llamada': 'LLAMADA',
      'firma': 'FIRMA',
      'tasacion': 'TASACION',
      'capacitacion': 'CAPACITACION',
      'ajuste_alquiler': 'AJUSTE_ALQUILER',
      'vencimiento_contrato': 'VENCIMIENTO_CONTRATO',
      'otro': 'OTRO'
    };
    return mapping[frontendType] || 'OTRO';
  },

  eventTypeToFrontend(backendType) {
    return backendType ? backendType.toLowerCase() : 'otro';
  },

  eventStatusToBackend(frontendStatus) {
    const mapping = {
      'pendiente': 'PENDIENTE',
      'confirmado': 'CONFIRMADO',
      'completado': 'COMPLETADO',
      'cancelado': 'CANCELADO'
    };
    return mapping[frontendStatus] || 'PENDIENTE';
  },

  eventStatusToFrontend(backendStatus) {
    return backendStatus ? backendStatus.toLowerCase() : 'pendiente';
  },

  async getEvents(filters = {}) {
    const params = new URLSearchParams();

    if (filters.type) params.append('type', this.eventTypeToBackend(filters.type));
    if (filters.status) params.append('status', this.eventStatusToBackend(filters.status));
    if (filters.date) params.append('date', filters.date);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.agent) params.append('agent', filters.agent);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const queryString = params.toString();
    const endpoint = `/events${queryString ? `?${queryString}` : ''}`;

    const response = await this.request(endpoint);

    if (response.success && response.events) {
      response.events = response.events.map(e => this.transformEventToFrontend(e));
    }

    return response;
  },

  async getUpcomingEvents(limit = 10) {
    const response = await this.request(`/events/upcoming?limit=${limit}`);

    if (response.success && response.events) {
      response.events = response.events.map(e => this.transformEventToFrontend(e));
    }

    return response;
  },

  async getEvent(id) {
    const response = await this.request(`/events/${id}`);

    if (response.success && response.event) {
      response.event = this.transformEventToFrontend(response.event);
    }

    return response;
  },

  async createEvent(data) {
    const backendData = this.transformEventToBackend(data);

    const response = await this.request('/events', {
      method: 'POST',
      body: backendData
    });

    if (response.success && response.event) {
      response.event = this.transformEventToFrontend(response.event);
    }

    return response;
  },

  async updateEvent(id, data) {
    const backendData = this.transformEventToBackend(data);

    const response = await this.request(`/events/${id}`, {
      method: 'PUT',
      body: backendData
    });

    if (response.success && response.event) {
      response.event = this.transformEventToFrontend(response.event);
    }

    return response;
  },

  async deleteEvent(id) {
    return this.request(`/events/${id}`, { method: 'DELETE' });
  },

  // =============================================
  // EVENT DATA TRANSFORMERS
  // =============================================

  transformEventToFrontend(event) {
    return {
      ...event,
      type: this.eventTypeToFrontend(event.type),
      status: this.eventStatusToFrontend(event.status),
      // Format date for frontend (YYYY-MM-DD)
      date: event.date ? event.date.split('T')[0] : null,
      // Map relations
      property: event.property ? {
        id: event.property.id,
        title: event.property.title,
        address: event.property.address
      } : null,
      lead: event.lead ? {
        id: event.lead.id,
        name: event.lead.name,
        email: event.lead.email,
        phone: event.lead.phone
      } : null,
      agent: event.agent ? {
        id: event.agent.id,
        name: event.agent.name,
        avatar: event.agent.avatar
      } : null,
      contact: event.contact ? {
        id: event.contact.id,
        name: event.contact.name,
        email: event.contact.email,
        phone: event.contact.phone
      } : null
    };
  },

  transformEventToBackend(data) {
    const backendData = { ...data };

    // Transform enums if present
    if (data.type) {
      backendData.type = this.eventTypeToBackend(data.type);
    }
    if (data.status) {
      backendData.status = this.eventStatusToBackend(data.status);
    }

    // Map frontend field names to backend field names
    if (data.property !== undefined && typeof data.property === 'object') {
      backendData.propertyId = data.property?.id;
      delete backendData.property;
    }
    if (data.lead !== undefined && typeof data.lead === 'object') {
      backendData.leadId = data.lead?.id;
      delete backendData.lead;
    }
    if (data.agent !== undefined && typeof data.agent === 'object') {
      backendData.agentId = data.agent?.id;
      delete backendData.agent;
    }
    if (data.contact !== undefined && typeof data.contact === 'object') {
      backendData.contactId = data.contact?.id;
      delete backendData.contact;
    }

    // Remove frontend-only fields
    delete backendData.createdBy;

    return backendData;
  },

  // =============================================
  // RENTALS ENDPOINTS
  // =============================================

  rentalStatusToBackend(frontendStatus) {
    const mapping = {
      'activo': 'ACTIVO',
      'vencido': 'VENCIDO',
      'rescindido': 'RESCINDIDO',
      'renovado': 'RENOVADO'
    };
    return mapping[frontendStatus] || 'ACTIVO';
  },

  rentalStatusToFrontend(backendStatus) {
    return backendStatus ? backendStatus.toLowerCase() : 'activo';
  },

  adjustmentFrequencyToBackend(frontendFreq) {
    const mapping = {
      'mensual': 'MENSUAL',
      'bimestral': 'BIMESTRAL',
      'trimestral': 'TRIMESTRAL',
      'cuatrimestral': 'CUATRIMESTRAL',
      'semestral': 'SEMESTRAL',
      'anual': 'ANUAL'
    };
    return mapping[frontendFreq] || 'TRIMESTRAL';
  },

  adjustmentFrequencyToFrontend(backendFreq) {
    return backendFreq ? backendFreq.toLowerCase() : 'trimestral';
  },

  async getRentals(filters = {}) {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', this.rentalStatusToBackend(filters.status));
    if (filters.property) params.append('property', filters.property);
    if (filters.propietario) params.append('propietario', filters.propietario);
    if (filters.inquilino) params.append('inquilino', filters.inquilino);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const queryString = params.toString();
    const endpoint = `/rentals${queryString ? `?${queryString}` : ''}`;

    const response = await this.request(endpoint);

    if (response.success && response.rentals) {
      response.rentals = response.rentals.map(r => this.transformRentalToFrontend(r));
    }

    return response;
  },

  async getExpiringRentals(days = 90) {
    const response = await this.request(`/rentals/expiring?days=${days}`);

    if (response.success && response.rentals) {
      response.rentals = response.rentals.map(r => this.transformRentalToFrontend(r));
    }

    return response;
  },

  async getUpcomingAdjustments(days = 30) {
    const response = await this.request(`/rentals/adjustments?days=${days}`);

    if (response.success && response.rentals) {
      response.rentals = response.rentals.map(r => this.transformRentalToFrontend(r));
    }

    return response;
  },

  async getRentalStats() {
    return this.request('/rentals/stats');
  },

  async getRental(id) {
    const response = await this.request(`/rentals/${id}`);

    if (response.success && response.rental) {
      response.rental = this.transformRentalToFrontend(response.rental);
    }

    return response;
  },

  async createRental(data) {
    const backendData = this.transformRentalToBackend(data);

    const response = await this.request('/rentals', {
      method: 'POST',
      body: backendData
    });

    if (response.success && response.rental) {
      response.rental = this.transformRentalToFrontend(response.rental);
    }

    return response;
  },

  async updateRental(id, data) {
    const backendData = this.transformRentalToBackend(data);

    const response = await this.request(`/rentals/${id}`, {
      method: 'PUT',
      body: backendData
    });

    if (response.success && response.rental) {
      response.rental = this.transformRentalToFrontend(response.rental);
    }

    return response;
  },

  async deleteRental(id) {
    return this.request(`/rentals/${id}`, { method: 'DELETE' });
  },

  // =============================================
  // RENTAL DATA TRANSFORMERS
  // =============================================

  transformRentalToFrontend(rental) {
    return {
      ...rental,
      status: this.rentalStatusToFrontend(rental.status),
      adjustmentFrequency: this.adjustmentFrequencyToFrontend(rental.adjustmentFrequency),
      // Format dates for frontend (YYYY-MM-DD)
      startDate: rental.startDate ? rental.startDate.split('T')[0] : null,
      endDate: rental.endDate ? rental.endDate.split('T')[0] : null,
      nextAdjustmentDate: rental.nextAdjustmentDate ? rental.nextAdjustmentDate.split('T')[0] : null,
      // Map guarantor fields to object
      guarantor: rental.guarantorName ? {
        name: rental.guarantorName,
        phone: rental.guarantorPhone,
        relationship: rental.guarantorRelationship
      } : null,
      // Map relations
      property: rental.property ? {
        id: rental.property.id,
        title: rental.property.title,
        address: rental.property.address,
        type: rental.property.type ? rental.property.type.toLowerCase() : null
      } : null,
      propietario: rental.propietario ? {
        id: rental.propietario.id,
        name: rental.propietario.name,
        email: rental.propietario.email,
        phone: rental.propietario.phone
      } : null,
      inquilino: rental.inquilino ? {
        id: rental.inquilino.id,
        name: rental.inquilino.name,
        email: rental.inquilino.email,
        phone: rental.inquilino.phone
      } : null
    };
  },

  transformRentalToBackend(data) {
    const backendData = { ...data };

    // Transform enums if present
    if (data.status) {
      backendData.status = this.rentalStatusToBackend(data.status);
    }
    if (data.adjustmentFrequency) {
      backendData.adjustmentFrequency = this.adjustmentFrequencyToBackend(data.adjustmentFrequency);
    }

    // Map guarantor object to fields
    if (data.guarantor) {
      backendData.guarantorName = data.guarantor.name;
      backendData.guarantorPhone = data.guarantor.phone;
      backendData.guarantorRelationship = data.guarantor.relationship;
      delete backendData.guarantor;
    }

    // Map relation IDs
    if (data.property && typeof data.property === 'object') {
      backendData.propertyId = data.property.id;
      delete backendData.property;
    }
    if (data.propietario && typeof data.propietario === 'object') {
      backendData.propietarioId = data.propietario.id;
      delete backendData.propietario;
    }
    if (data.inquilino && typeof data.inquilino === 'object') {
      backendData.inquilinoId = data.inquilino.id;
      delete backendData.inquilino;
    }

    // Ensure numeric fields
    if (data.monthlyRent !== undefined) {
      backendData.monthlyRent = parseFloat(data.monthlyRent);
    }
    if (data.adjustmentPercentage !== undefined) {
      backendData.adjustmentPercentage = parseFloat(data.adjustmentPercentage);
    }
    if (data.depositAmount !== undefined) {
      backendData.depositAmount = parseFloat(data.depositAmount);
    }
    if (data.paymentDay !== undefined) {
      backendData.paymentDay = parseInt(data.paymentDay);
    }

    return backendData;
  },

  // =============================================
  // DOCUMENTS ENDPOINTS
  // =============================================

  async getDocuments(filters = {}) {
    const params = new URLSearchParams();

    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.templateId) params.append('templateId', filters.templateId);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const queryString = params.toString();
    const endpoint = `/documents${queryString ? `?${queryString}` : ''}`;

    const response = await this.request(endpoint);

    if (response.success && response.documents) {
      response.documents = response.documents.map(d => this.transformDocumentToFrontend(d));
    }

    return response;
  },

  async getDocumentStats() {
    return this.request('/documents/stats');
  },

  async getDocument(id) {
    const response = await this.request(`/documents/${id}`);

    if (response.success && response.document) {
      response.document = this.transformDocumentToFrontend(response.document);
    }

    return response;
  },

  async createDocument(data) {
    const backendData = this.transformDocumentToBackend(data);

    const response = await this.request('/documents', {
      method: 'POST',
      body: backendData
    });

    if (response.success && response.document) {
      response.document = this.transformDocumentToFrontend(response.document);
    }

    return response;
  },

  async updateDocument(id, data) {
    const backendData = this.transformDocumentToBackend(data);

    const response = await this.request(`/documents/${id}`, {
      method: 'PUT',
      body: backendData
    });

    if (response.success && response.document) {
      response.document = this.transformDocumentToFrontend(response.document);
    }

    return response;
  },

  async deleteDocument(id) {
    return this.request(`/documents/${id}`, { method: 'DELETE' });
  },

  // =============================================
  // DOCUMENT DATA TRANSFORMERS
  // =============================================

  transformDocumentToFrontend(document) {
    return {
      ...document,
      // Format dates for frontend
      createdAt: document.createdAt ? new Date(document.createdAt) : null,
      updatedAt: document.updatedAt ? new Date(document.updatedAt) : null,
      // Map relations
      property: document.property ? {
        id: document.property.id,
        title: document.property.title,
        address: document.property.address
      } : null,
      createdBy: document.createdBy ? {
        id: document.createdBy.id,
        name: document.createdBy.name,
        email: document.createdBy.email
      } : null
    };
  },

  transformDocumentToBackend(data) {
    const backendData = { ...data };

    // Map relation IDs
    if (data.property && typeof data.property === 'object') {
      backendData.propertyId = data.property.id;
      delete backendData.property;
    }

    // Remove read-only fields
    delete backendData.id;
    delete backendData.createdAt;
    delete backendData.updatedAt;
    delete backendData.createdBy;

    return backendData;
  },

  // =============================================
  // DASHBOARD ENDPOINTS
  // =============================================

  async getDashboardStats() {
    const response = await this.request('/dashboard/stats');

    if (response.stats) {
      // Transform events to frontend format
      if (response.upcomingEvents) {
        response.upcomingEvents = response.upcomingEvents.map(e => this.transformEventToFrontend(e));
      }
    }

    return response;
  },

  async getQuickStats() {
    return this.request('/dashboard/quick-stats');
  },

  // =============================================
  // HEALTH CHECK
  // =============================================

  async checkHealth() {
    try {
      const response = await fetch(`${this.BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  },

  // =============================================
  // FILE UPLOAD (Direct to Supabase)
  // =============================================

  /**
   * Generate unique filename for uploads
   */
  generateFilename(extension = 'jpg') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}.${extension}`;
  },

  /**
   * Convert HEIC/HEIF to JPEG (iPhone photos)
   * @param {File} file - Original file
   * @returns {Promise<File>} Converted file or original if not HEIC
   */
  async convertHeicToJpeg(file) {
    const isHeic = file.type === 'image/heic' ||
                   file.type === 'image/heif' ||
                   file.name.toLowerCase().endsWith('.heic') ||
                   file.name.toLowerCase().endsWith('.heif');

    if (!isHeic) {
      return file;
    }

    // Check if heic2any is available
    if (typeof heic2any === 'undefined') {
      console.warn('heic2any not loaded');
      throw new Error('La librería de conversión no está disponible. Por favor, usá imágenes JPG o PNG.');
    }

    try {
      console.log('Converting HEIC to JPEG...');

      // Read file as ArrayBuffer for better compatibility
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: file.type });

      const result = await heic2any({
        blob: blob,
        toType: 'image/jpeg',
        quality: 0.92,
        multiple: false
      });

      // heic2any may return array for multi-image HEIC
      const resultBlob = Array.isArray(result) ? result[0] : result;

      // Create new File with .jpg extension
      const newFilename = file.name.replace(/\.(heic|heif)$/i, '.jpg');
      console.log('HEIC conversion successful');
      return new File([resultBlob], newFilename, { type: 'image/jpeg' });
    } catch (error) {
      console.error('HEIC conversion error:', error);
      throw new Error('No se pudo convertir la imagen HEIC. Por favor, convertí la foto a JPG antes de subirla, o configurá tu iPhone: Ajustes → Cámara → Formatos → Más compatible.');
    }
  },

  /**
   * Get proper file extension based on MIME type
   */
  getExtensionFromMime(mimeType, fallbackName) {
    const mimeToExt = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/heic': 'jpg', // Force HEIC to JPG extension
      'image/heif': 'jpg'  // Force HEIF to JPG extension
    };

    if (mimeToExt[mimeType]) {
      return mimeToExt[mimeType];
    }

    // Fallback to file extension, but convert heic/heif to jpg
    const ext = fallbackName.split('.').pop().toLowerCase();
    if (ext === 'heic' || ext === 'heif') {
      return 'jpg';
    }
    return ext || 'jpg';
  },

  /**
   * Upload a single file directly to Supabase Storage
   * @param {File} file - File to upload
   * @returns {Promise<Object>} Upload result with URL
   */
  async uploadFileToSupabase(file) {
    try {
      // Convert HEIC to JPEG if needed
      const processedFile = await this.convertHeicToJpeg(file);

      // Get proper extension (never use heic/heif)
      const ext = this.getExtensionFromMime(processedFile.type, processedFile.name);
      const filename = this.generateFilename(ext);

      const response = await fetch(
        `${this.SUPABASE_URL}/storage/v1/object/${this.SUPABASE_BUCKET}/${filename}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
            'Content-Type': processedFile.type || 'image/jpeg',
            'x-upsert': 'false'
          },
          body: processedFile
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir archivo');
      }

      // Return public URL
      const publicUrl = `${this.SUPABASE_URL}/storage/v1/object/public/${this.SUPABASE_BUCKET}/${filename}`;
      return { success: true, url: publicUrl, filename };
    } catch (error) {
      console.error('Supabase upload error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Upload images for a property (direct to Supabase, then update backend)
   * @param {string} propertyId - The property ID
   * @param {FileList|File[]} files - Files to upload
   * @returns {Promise<Object>} Upload result with image URLs
   */
  async uploadPropertyImages(propertyId, files) {
    const uploadedUrls = [];
    const errors = [];

    // Upload each file directly to Supabase
    for (const file of files) {
      const result = await this.uploadFileToSupabase(file);
      if (result.success) {
        uploadedUrls.push(result.url);
      } else {
        errors.push(result.error);
      }
    }

    if (uploadedUrls.length === 0) {
      return { success: false, error: errors[0] || 'No se pudieron subir las imágenes' };
    }

    // Update property in backend with new image URLs
    try {
      const property = await this.getProperty(propertyId);
      const existingImages = property?.images || [];
      const allImages = [...existingImages, ...uploadedUrls];

      await this.updateProperty(propertyId, { images: allImages });

      return {
        success: true,
        images: uploadedUrls.map(url => ({ url })),
        allImages,
        message: `${uploadedUrls.length} imagen(es) subida(s)`
      };
    } catch (error) {
      console.error('Error updating property with images:', error);
      // Images were uploaded but property update failed
      return {
        success: true,
        images: uploadedUrls.map(url => ({ url })),
        allImages: uploadedUrls,
        warning: 'Imágenes subidas pero hubo un error actualizando la propiedad'
      };
    }
  },

  /**
   * Upload temporary images (for new properties) - direct to Supabase
   * @param {FileList|File[]} files - Files to upload
   * @returns {Promise<Object>} Upload result with image URLs
   */
  async uploadTempImages(files) {
    const uploadedUrls = [];
    const errors = [];

    for (const file of files) {
      const result = await this.uploadFileToSupabase(file);
      if (result.success) {
        uploadedUrls.push({ url: result.url, filename: result.filename });
      } else {
        errors.push(result.error);
      }
    }

    if (uploadedUrls.length === 0) {
      return { success: false, error: errors[0] || 'No se pudieron subir las imágenes' };
    }

    return {
      success: true,
      images: uploadedUrls,
      message: `${uploadedUrls.length} imagen(es) subida(s)`
    };
  },

  /**
   * Delete a file from Supabase Storage
   * @param {string} fileUrl - The full Supabase URL of the file
   * @returns {Promise<boolean>} Success status
   */
  async deleteFileFromSupabase(fileUrl) {
    // Extract filename from URL
    const match = fileUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    if (!match) return false;

    const filePath = match[1];

    try {
      const response = await fetch(
        `${this.SUPABASE_URL}/storage/v1/object/${this.SUPABASE_BUCKET}/${filePath}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`
          }
        }
      );
      return response.ok;
    } catch (error) {
      console.error('Supabase delete error:', error);
      return false;
    }
  },

  /**
   * Delete an image from a property
   * @param {string} propertyId - The property ID
   * @param {string} imageUrl - The image URL to delete
   * @returns {Promise<Object>} Result
   */
  async deletePropertyImage(propertyId, imageUrl) {
    try {
      // Delete from Supabase if it's a Supabase URL
      if (imageUrl.includes('supabase.co')) {
        await this.deleteFileFromSupabase(imageUrl);
      }

      // Update property to remove image from array
      const property = await this.getProperty(propertyId);
      const updatedImages = (property?.images || []).filter(img => img !== imageUrl);

      await this.updateProperty(propertyId, { images: updatedImages });

      return { success: true, images: updatedImages };
    } catch (error) {
      console.error('Delete image error:', error);
      return { success: false, error: 'Error al eliminar imagen' };
    }
  },

  /**
   * Get full URL for an uploaded image
   * @param {string} imageUrl - Relative image URL (e.g., /uploads/properties/image.webp)
   * @returns {string} Full URL
   */
  getImageUrl(imageUrl) {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    // Remove /api from BASE_URL and append the image path
    const baseUrl = this.BASE_URL.replace('/api', '');
    return `${baseUrl}${imageUrl}`;
  },

  // =============================================
  // PDF GENERATION
  // =============================================

  /**
   * Generate and download PDF from content
   * @param {Object} data - { content, title, templateName, includeSignatures }
   */
  async generatePDF(data) {
    try {
      const response = await fetch(`${this.BASE_URL}/pdf/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Error al generar PDF' };
      }

      // Get the PDF blob
      const blob = await response.blob();
      return { success: true, blob };
    } catch (error) {
      console.error('PDF generation error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * Download PDF for a saved document
   * @param {string} documentId - The document ID
   * @param {boolean} includeSignatures - Include signature lines
   */
  async downloadDocumentPDF(documentId, includeSignatures = false) {
    try {
      const response = await fetch(`${this.BASE_URL}/pdf/document/${documentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ includeSignatures })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Error al descargar PDF' };
      }

      // Get filename from Content-Disposition header
      const disposition = response.headers.get('Content-Disposition');
      let filename = 'documento.pdf';
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      const blob = await response.blob();
      return { success: true, blob, filename };
    } catch (error) {
      console.error('PDF download error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * Trigger browser download for a blob
   * @param {Blob} blob - PDF blob
   * @param {string} filename - Filename for download
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // =============================================
  // SETTINGS ENDPOINTS (Branding)
  // =============================================

  /**
   * Get app settings (branding config)
   * Public endpoint - no auth required
   */
  async getSettings() {
    try {
      const response = await fetch(`${this.BASE_URL}/settings`);
      const data = await response.json();

      if (response.ok) {
        return { success: true, settings: data.settings };
      }

      return { success: false, error: data.error || 'Error al obtener configuración' };
    } catch (error) {
      console.error('Get settings error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * Update app settings (SUPERADMIN only)
   * @param {Object} settings - { primaryColor, backgroundColor, companyName, logo }
   */
  async updateSettings(settings) {
    return this.request('/settings', {
      method: 'PUT',
      body: settings
    });
  },

  // =============================================
  // TASKS ENDPOINTS
  // =============================================

  taskPriorityToBackend(frontendPriority) {
    const mapping = {
      'alta': 'ALTA',
      'media': 'MEDIA',
      'baja': 'BAJA'
    };
    return mapping[frontendPriority] || 'MEDIA';
  },

  taskPriorityToFrontend(backendPriority) {
    return backendPriority ? backendPriority.toLowerCase() : 'media';
  },

  taskStatusToBackend(frontendStatus) {
    const mapping = {
      'pendiente': 'PENDIENTE',
      'en_progreso': 'EN_PROGRESO',
      'completada': 'COMPLETADA',
      'cancelada': 'CANCELADA'
    };
    return mapping[frontendStatus] || 'PENDIENTE';
  },

  taskStatusToFrontend(backendStatus) {
    return backendStatus ? backendStatus.toLowerCase() : 'pendiente';
  },

  async getTasks(filters = {}) {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', this.taskStatusToBackend(filters.status));
    if (filters.priority) params.append('priority', this.taskPriorityToBackend(filters.priority));
    if (filters.leadId) params.append('leadId', filters.leadId);
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters.overdue) params.append('overdue', filters.overdue);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const queryString = params.toString();
    const endpoint = `/tasks${queryString ? `?${queryString}` : ''}`;

    const response = await this.request(endpoint);

    if (response.success && response.tasks) {
      response.tasks = response.tasks.map(t => this.transformTaskToFrontend(t));
    }

    return response;
  },

  async getMyTasks(includeCompleted = false) {
    const params = new URLSearchParams();
    if (includeCompleted) params.append('includeCompleted', 'true');

    const queryString = params.toString();
    const response = await this.request(`/tasks/my-tasks${queryString ? `?${queryString}` : ''}`);

    if (response.success) {
      if (response.tasks) {
        response.tasks = response.tasks.map(t => this.transformTaskToFrontend(t));
      }
      if (response.grouped) {
        response.grouped.overdue = response.grouped.overdue?.map(t => this.transformTaskToFrontend(t)) || [];
        response.grouped.today = response.grouped.today?.map(t => this.transformTaskToFrontend(t)) || [];
        response.grouped.upcoming = response.grouped.upcoming?.map(t => this.transformTaskToFrontend(t)) || [];
      }
    }

    return response;
  },

  async getTaskStats() {
    return this.request('/tasks/stats');
  },

  async getTask(id) {
    const response = await this.request(`/tasks/${id}`);

    if (response.success && response.task) {
      response.task = this.transformTaskToFrontend(response.task);
    }

    return response;
  },

  async createTask(data) {
    const backendData = this.transformTaskToBackend(data);

    const response = await this.request('/tasks', {
      method: 'POST',
      body: backendData
    });

    if (response.success && response.task) {
      response.task = this.transformTaskToFrontend(response.task);
    }

    return response;
  },

  async updateTask(id, data) {
    const backendData = this.transformTaskToBackend(data);

    const response = await this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: backendData
    });

    if (response.success && response.task) {
      response.task = this.transformTaskToFrontend(response.task);
    }

    return response;
  },

  async completeTask(id) {
    const response = await this.request(`/tasks/${id}/complete`, {
      method: 'PUT'
    });

    if (response.success && response.task) {
      response.task = this.transformTaskToFrontend(response.task);
    }

    return response;
  },

  async deleteTask(id) {
    return this.request(`/tasks/${id}`, { method: 'DELETE' });
  },

  // =============================================
  // TASK DATA TRANSFORMERS
  // =============================================

  transformTaskToFrontend(task) {
    return {
      ...task,
      priority: this.taskPriorityToFrontend(task.priority),
      status: this.taskStatusToFrontend(task.status),
      // Format dates
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : null,
      completedAt: task.completedAt ? new Date(task.completedAt) : null,
      createdAt: task.createdAt ? new Date(task.createdAt) : null,
      // Map relations
      lead: task.lead ? {
        id: task.lead.id,
        name: task.lead.name,
        stage: task.lead.stage ? task.lead.stage.toLowerCase() : null
      } : null,
      property: task.property ? {
        id: task.property.id,
        title: task.property.title,
        address: task.property.address
      } : null,
      assignedTo: task.assignedTo ? {
        id: task.assignedTo.id,
        name: task.assignedTo.name,
        avatar: task.assignedTo.avatar
      } : null,
      createdBy: task.createdBy ? {
        id: task.createdBy.id,
        name: task.createdBy.name
      } : null
    };
  },

  transformTaskToBackend(data) {
    const backendData = { ...data };

    // Transform enums if present
    if (data.priority) {
      backendData.priority = this.taskPriorityToBackend(data.priority);
    }
    if (data.status) {
      backendData.status = this.taskStatusToBackend(data.status);
    }

    // Map relation IDs
    if (data.lead && typeof data.lead === 'object') {
      backendData.leadId = data.lead.id;
      delete backendData.lead;
    }
    if (data.property && typeof data.property === 'object') {
      backendData.propertyId = data.property.id;
      delete backendData.property;
    }
    if (data.assignedTo && typeof data.assignedTo === 'object') {
      backendData.assignedToId = data.assignedTo.id;
      delete backendData.assignedTo;
    }

    // Remove read-only fields
    delete backendData.createdBy;
    delete backendData.createdAt;
    delete backendData.completedAt;

    return backendData;
  }
};
