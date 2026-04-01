/**
 * DOMUM - Branding & Theme Manager
 * Handles custom colors, logo, and company name
 * Configuration is stored in the backend database
 */
const Branding = {
  CACHE_KEY: 'domum_branding_cache',

  defaultConfig: {
    primaryColor: '#00D4FF',
    backgroundColor: '#0A0E14',
    companyName: 'DOMUM',
    logo: null
  },

  // In-memory config (loaded from backend)
  _config: null,

  /**
   * Get current config (sync - returns cached version)
   * Use loadConfig() for fresh data from backend
   */
  getConfig() {
    if (this._config) {
      return { ...this._config };
    }
    // Fallback to localStorage cache if not loaded yet
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      return cached ? { ...this.defaultConfig, ...JSON.parse(cached) } : { ...this.defaultConfig };
    } catch (e) {
      return { ...this.defaultConfig };
    }
  },

  /**
   * Load config from backend (async)
   */
  async loadConfig() {
    try {
      const response = await API.getSettings();
      if (response.success && response.settings) {
        this._config = { ...this.defaultConfig, ...response.settings };
        // Cache locally for faster initial loads
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(this._config));
        return this._config;
      }
    } catch (e) {
      console.error('Error loading branding from backend:', e);
    }
    // Fallback to cached or defaults
    return this.getConfig();
  },

  /**
   * Save config to backend (async - SUPERADMIN only)
   */
  async saveConfig(config) {
    try {
      const response = await API.updateSettings(config);
      if (response.success) {
        this._config = { ...this.defaultConfig, ...config };
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(this._config));
        this.applyConfig(this._config);
        return true;
      } else {
        console.error('Error saving branding:', response.error);
        return false;
      }
    } catch (e) {
      console.error('Error saving branding config:', e);
      return false;
    }
  },

  /**
   * Reset config to defaults (async - SUPERADMIN only)
   */
  async resetConfig() {
    const success = await this.saveConfig(this.defaultConfig);
    if (success) {
      return { ...this.defaultConfig };
    }
    return this.getConfig();
  },

  applyConfig(config) {
    const root = document.documentElement;

    // Apply primary color to CSS variables
    root.style.setProperty('--accent-cyan', config.primaryColor);

    // Create RGB version for transparency effects
    const rgb = this.hexToRgb(config.primaryColor);
    if (rgb) {
      root.style.setProperty('--accent-cyan-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }

    // Apply background color
    if (config.backgroundColor) {
      root.style.setProperty('--bg-primary', config.backgroundColor);
      // Generate lighter/darker variants for secondary backgrounds
      const bgRgb = this.hexToRgb(config.backgroundColor);
      if (bgRgb) {
        const secondary = this.adjustBrightness(bgRgb, 10);
        const sidebar = this.adjustBrightness(bgRgb, -10);
        const card = this.adjustBrightness(bgRgb, 20);
        root.style.setProperty('--bg-secondary', `rgb(${secondary.r}, ${secondary.g}, ${secondary.b})`);
        root.style.setProperty('--bg-sidebar', `rgb(${sidebar.r}, ${sidebar.g}, ${sidebar.b})`);
        root.style.setProperty('--bg-card', `rgb(${card.r}, ${card.g}, ${card.b})`);
        root.style.setProperty('--bg-card-hover', `rgb(${card.r + 10}, ${card.g + 10}, ${card.b + 10})`);
      }
    }

    // Update sidebar logo and name
    this.updateSidebarBranding(config);

    // Update login screen branding
    this.updateLoginBranding(config);
  },

  adjustBrightness(rgb, amount) {
    return {
      r: Math.max(0, Math.min(255, rgb.r + amount)),
      g: Math.max(0, Math.min(255, rgb.g + amount)),
      b: Math.max(0, Math.min(255, rgb.b + amount))
    };
  },

  updateSidebarBranding(config) {
    const sidebarLogo = document.querySelector('.sidebar__logo');
    if (sidebarLogo) {
      if (config.logo) {
        sidebarLogo.innerHTML = `
          <img src="${config.logo}" alt="${config.companyName}" class="sidebar__logo-img">
          <span>${config.companyName}</span>
        `;
      } else {
        // Use inline SVG (building-2 icon) at 80x80 to avoid Lucide resizing issues
        sidebarLogo.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-logo-icon"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
          <span>${config.companyName}</span>
        `;
      }
    }
  },

  updateLoginBranding(config) {
    const loginTitle = document.querySelector('.login-title');
    const loginLogoIcon = document.querySelector('.login-logo-icon');

    if (loginTitle) {
      loginTitle.textContent = config.companyName;
    }

    if (loginLogoIcon) {
      if (config.logo) {
        loginLogoIcon.classList.add('has-image');
        loginLogoIcon.innerHTML = `<img src="${config.logo}" alt="${config.companyName}">`;
      } else {
        loginLogoIcon.classList.remove('has-image');
        loginLogoIcon.innerHTML = '<i data-lucide="building-2"></i>';
        lucide.createIcons();
      }
    }
  },

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  /**
   * Initialize branding - loads from backend and applies
   */
  async init() {
    // First apply cached/default config for immediate visual feedback
    const cachedConfig = this.getConfig();
    this.applyConfig(cachedConfig);

    // Then load fresh config from backend
    const config = await this.loadConfig();
    this.applyConfig(config);
  }
};

/**
 * DOMUM - Main Application
 * Router, event handling, and initialization
 */

// ============================================
// COMING SOON MODE - Páginas habilitadas
// Cambiar a false o eliminar este bloque para habilitar todas las páginas
// ============================================
const COMING_SOON_MODE = true;
const ENABLED_PAGES = ['crm', 'usuarios', 'contactos', 'propiedades', 'administraciones'];

const App = {
  currentPage: 'dashboard',
  notifications: [],

  async init() {
    // Load data first
    const dataLoaded = await DataStore.init();
    if (!dataLoaded) {
      console.error('Failed to load data');
      return;
    }

    // Initialize branding/theme from backend
    await Branding.init();

    // Initialize components
    Modals.init();
    Panels.init();
    Toast.init();

    // Setup login
    this.setupLogin();

    // Setup navigation
    this.setupNavigation();

    // Setup global events
    this.setupGlobalEvents();

    // Render icons
    lucide.createIcons();

    console.log('App initialized');
  },

  setupLogin() {
    const loginScreen = document.getElementById('login-screen');
    const loginForm = document.getElementById('login-form');
    const app = document.getElementById('app');

    // Check if already logged in (has valid token)
    this.checkExistingSession();

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = loginForm.querySelector('input[type="email"]').value;
      const password = loginForm.querySelector('input[type="password"]').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      // Show loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Ingresando...';
      lucide.createIcons();

      // Try API login
      const result = await API.login(email, password);

      if (result.success) {
        // Login successful
        DataStore.setCurrentUser(result.user);
        this.updateSidebarUser(result.user);

        // Load data from API
        await Promise.all([
          DataStore.loadLeadsFromAPI(),
          DataStore.loadPropertiesFromAPI(),
          DataStore.loadUsersFromAPI()
        ]);

        loginScreen.classList.add('hidden');
        app.classList.remove('hidden');

        // Navigate to first enabled page in COMING_SOON_MODE
        const initialPage = COMING_SOON_MODE ? ENABLED_PAGES[0] : 'dashboard';
        this.navigate(initialPage);
        Toast.show('success', 'Bienvenido', `Hola ${result.user.name}`);

        // Load notifications
        this.loadNotifications();
      } else {
        // Login failed - check if backend is available
        const backendAvailable = await API.checkHealth();

        if (!backendAvailable) {
          // Backend not running
          Toast.show('error', 'Error de conexión', 'No se pudo conectar con el servidor. Verificá que el backend esté corriendo.');
        } else {
          // Backend available but login failed
          Toast.show('error', 'Error', result.error || 'Credenciales incorrectas');
        }
      }

      // Reset button state
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="log-in"></i> Ingresar';
      lucide.createIcons();
    });
  },

  async checkExistingSession() {
    const token = API.getAccessToken();
    if (!token) return;

    const result = await API.getMe();
    if (result.success && result.user) {
      DataStore.setCurrentUser(result.user);
      this.updateSidebarUser(result.user);

      // Load data from API
      await Promise.all([
        DataStore.loadLeadsFromAPI(),
        DataStore.loadPropertiesFromAPI(),
        DataStore.loadUsersFromAPI()
      ]);

      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');

      // Navigate to first enabled page in COMING_SOON_MODE
      const initialPage = COMING_SOON_MODE ? ENABLED_PAGES[0] : 'dashboard';
      this.navigate(initialPage);

      // Load notifications
      this.loadNotifications();
    } else {
      // Token invalid, clear it
      API.clearTokens();
    }
  },

  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        this.navigate(page);
      });
    });

    // Handle browser back/forward
    window.addEventListener('hashchange', () => {
      const page = window.location.hash.substring(1) || 'dashboard';
      this.navigate(page, false);
    });

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', () => {
      Modals.confirm({
        title: '¿Cerrar sesión?',
        message: '¿Estás seguro de que querés cerrar sesión?',
        icon: 'log-out',
        type: 'warning',
        confirmText: 'Cerrar sesión',
        onConfirm: async () => {
          await API.logout();
          DataStore.currentUser = null;
          document.getElementById('app').classList.add('hidden');
          document.getElementById('login-screen').classList.remove('hidden');
          Toast.show('info', 'Sesión cerrada');
        }
      });
    });
  },

  // Update sidebar with current user info
  updateSidebarUser(user) {
    if (!user) return;

    const avatar = document.querySelector('.sidebar__footer .user-avatar');
    const name = document.querySelector('.sidebar__footer .user-name');
    const role = document.querySelector('.sidebar__footer .user-role');

    if (avatar) {
      avatar.textContent = user.avatar || (user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U');
    }
    if (name) {
      name.textContent = user.name || 'Usuario';
    }
    if (role) {
      role.textContent = Utils.getRoleLabel(user.role) || 'Usuario';
    }
  },

  navigate(page, updateHash = true) {
    // Update current page
    this.currentPage = page;

    // Update hash
    if (updateHash) {
      window.location.hash = page;
    }

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Update page title
    const titles = {
      dashboard: 'Dashboard',
      propiedades: 'Propiedades',
      crm: 'CRM',
      contactos: 'Contactos',
      calendario: 'Calendario',
      administraciones: 'Administraciones',
      documentos: 'Documentos IA',
      caja: 'Caja',
      informes: 'Informes',
      usuarios: 'Usuarios',
      configuracion: 'Configuración'
    };
    document.getElementById('page-title').textContent = titles[page] || 'Dashboard';

    // Render page content
    this.renderPage(page);
  },

  renderPage(page) {
    const content = document.getElementById('content');

    // Check if page is disabled in COMING_SOON_MODE
    if (COMING_SOON_MODE && !ENABLED_PAGES.includes(page)) {
      content.innerHTML = this.renderComingSoonPage(page);
      lucide.createIcons();
      return;
    }

    // Get page content
    const pageContent = Pages[page] ? Pages[page]() : Pages.dashboard();
    content.innerHTML = pageContent;

    // Re-render icons
    lucide.createIcons();

    // Setup page-specific events
    this.setupPageEvents(page);
  },

  renderComingSoonPage(page) {
    const pageNames = {
      dashboard: 'Dashboard',
      calendario: 'Calendario',
      administraciones: 'Administraciones',
      documentos: 'Documentos IA',
      caja: 'Caja',
      informes: 'Informes',
      configuracion: 'Configuración'
    };
    const pageName = pageNames[page] || page;

    return `
      <div class="page page--coming-soon" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        text-align: center;
        padding: 2rem;
      ">
        <div style="
          background: rgba(0, 212, 255, 0.1);
          border-radius: 50%;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
        ">
          <i data-lucide="construction" style="width: 60px; height: 60px; color: var(--accent-cyan);"></i>
        </div>
        <h1 style="
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 1rem;
        ">Próximamente</h1>
        <p style="
          font-size: 1.125rem;
          color: var(--text-secondary);
          max-width: 400px;
          line-height: 1.6;
        ">
          La sección <strong style="color: var(--accent-cyan);">${pageName}</strong> estará disponible muy pronto.
          Estamos trabajando para brindarte la mejor experiencia.
        </p>
        <a href="#crm" class="btn btn--primary" style="margin-top: 2rem;">
          <i data-lucide="arrow-left"></i>
          Ir al CRM
        </a>
      </div>
    `;
  },

  setupPageEvents(page) {
    switch (page) {
      case 'dashboard':
        this.setupDashboardPage();
        break;
      case 'propiedades':
        this.setupPropertiesPage();
        break;
      case 'crm':
        this.setupCRMPage();
        break;
      case 'contactos':
        this.setupContactsPage();
        break;
      case 'calendario':
        this.setupCalendarPage();
        break;
      case 'caja':
        this.setupCajaPage();
        break;
      case 'documentos':
        this.setupDocumentosPage();
        break;
      case 'administraciones':
        this.setupAdministracionesPage();
        break;
      case 'configuracion':
        this.setupConfiguracionPage();
        break;
      case 'usuarios':
        this.setupUsuariosPage();
        break;
    }

    // Common tab handling
    this.setupTabs();

    // Common card click handling
    this.setupCardClicks();
  },

  async setupDashboardPage() {
    // Load dashboard stats from API if authenticated
    if (API.getAccessToken()) {
      try {
        await DataStore.loadDashboardStatsFromAPI();
        // Re-render the dashboard with fresh data
        this.renderDashboard();
      } catch (error) {
        console.warn('Could not load dashboard stats from API:', error);
      }
    }

    // Load tasks
    this.loadDashboardTasks();

    // New task button
    document.getElementById('new-task-btn')?.addEventListener('click', () => {
      Modals.newTask();
    });

    // Lead row clicks in recent leads section
    Utils.delegate(document.getElementById('content'), 'click', '.lead-row', (e, target) => {
      const id = target.dataset.id;
      if (id) {
        Panels.lead(id);
      }
    });

    // Event item clicks
    Utils.delegate(document.getElementById('content'), 'click', '.event-item', (e, target) => {
      const id = target.dataset.id;
      if (id) {
        Toast.show('info', 'Detalle de evento', 'Panel de eventos en desarrollo');
      }
    });
  },

  async loadDashboardTasks() {
    const container = document.getElementById('dashboard-tasks-container');
    if (!container) return;

    try {
      const response = await API.getMyTasks();

      if (response.success) {
        const { tasks, summary, grouped } = response;

        if (tasks.length === 0) {
          container.innerHTML = Components.emptyTasks();
        } else {
          // Combine overdue and today tasks for display
          const urgentTasks = [...(grouped.overdue || []), ...(grouped.today || [])];
          const upcomingTasks = grouped.upcoming || [];

          let html = Components.tasksSummary(summary);

          if (urgentTasks.length > 0) {
            html += `
              <div class="tasks-section" style="margin-bottom: 1rem;">
                <h4 style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: 0.75rem;">
                  <i data-lucide="alert-triangle" style="width: 14px; height: 14px; margin-right: 0.5rem; color: var(--accent-orange);"></i>
                  Urgentes
                </h4>
                <div class="tasks-list" style="display: grid; gap: 0.5rem;">
                  ${urgentTasks.slice(0, 5).map(t => Components.taskCard(t)).join('')}
                </div>
              </div>
            `;
          }

          if (upcomingTasks.length > 0) {
            html += `
              <div class="tasks-section">
                <h4 style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: 0.75rem;">
                  <i data-lucide="clock" style="width: 14px; height: 14px; margin-right: 0.5rem;"></i>
                  Próximas
                </h4>
                <div class="tasks-list" style="display: grid; gap: 0.5rem;">
                  ${upcomingTasks.slice(0, 5).map(t => Components.taskCard(t)).join('')}
                </div>
              </div>
            `;
          }

          container.innerHTML = html;

          // Setup task event listeners
          this.setupDashboardTaskEvents();
        }

        lucide.createIcons();
      } else {
        container.innerHTML = `
          <div style="text-align: center; padding: 2rem; color: var(--text-tertiary);">
            <p>Error al cargar tareas</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-tertiary);">
          <p>Error al cargar tareas</p>
        </div>
      `;
    }
  },

  setupDashboardTaskEvents() {
    const container = document.getElementById('dashboard-tasks-container');
    if (!container) return;

    // Complete task buttons
    container.querySelectorAll('.task-complete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const taskId = btn.dataset.taskId;
        try {
          await DataStore.completeTaskViaAPI(taskId);
          Toast.show('success', 'Tarea completada');
          this.loadDashboardTasks();
        } catch (error) {
          Toast.show('error', 'Error', error.message);
        }
      });
    });

    // Task card clicks
    container.querySelectorAll('.task-card').forEach(card => {
      card.addEventListener('click', () => {
        const taskId = card.dataset.taskId;
        Modals.editTask(taskId);
      });
    });
  },

  renderDashboard() {
    const content = document.getElementById('content');
    if (!content || this.currentPage !== 'dashboard') return;

    // Re-render the entire dashboard with updated data
    const pageContent = Pages.dashboard();
    content.innerHTML = pageContent;
    lucide.createIcons();

    // Load tasks
    this.loadDashboardTasks();

    // New task button
    document.getElementById('new-task-btn')?.addEventListener('click', () => {
      Modals.newTask();
    });

    // Re-bind event handlers for the new content
    Utils.delegate(content, 'click', '.lead-row', (e, target) => {
      const id = target.dataset.id;
      if (id) {
        Panels.lead(id);
      }
    });
  },

  async setupPropertiesPage() {
    // Try to load properties from API if authenticated
    if (API.getAccessToken()) {
      try {
        await DataStore.loadPropertiesFromAPI();
        // Re-render the properties grid with fresh data
        this.renderPropertiesGrid();
      } catch (error) {
        console.warn('Could not load properties from API:', error);
      }
    }

    // Property card clicks
    Utils.delegate(document.getElementById('content'), 'click', '.property-card', (e, target) => {
      const id = target.dataset.id;
      Panels.property(id);
    });

    // View toggle
    const viewButtons = document.querySelectorAll('.view-toggle__btn');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.view;
        const container = document.getElementById('properties-container');
        container.className = view === 'list' ? 'properties-list' : 'properties-grid';
      });
    });

    // Filter by operation tabs
    this.setupPropertyFilters();
  },

  renderPropertiesGrid() {
    const container = document.getElementById('properties-container');
    if (!container) return;

    const properties = DataStore.getProperties();
    container.innerHTML = properties.map(p => Components.propertyCard(p)).join('');
    lucide.createIcons();
  },

  setupPropertyFilters() {
    // Type filter
    const typeFilter = document.getElementById('filter-type');
    if (typeFilter) {
      typeFilter.addEventListener('change', () => this.filterProperties());
    }

    // Status filter
    const statusFilter = document.getElementById('filter-status');
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.filterProperties());
    }

    // Tab filtering for operation
    const tabs = document.querySelectorAll('.page--propiedades .tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.filterProperties();
      });
    });
  },

  filterProperties() {
    const activeTab = document.querySelector('.page--propiedades .tab--active')?.dataset.tab || 'all';
    const typeFilter = document.getElementById('filter-type')?.value || '';
    const statusFilter = document.getElementById('filter-status')?.value || '';

    const filters = {};
    if (activeTab !== 'all') filters.operation = activeTab;
    if (typeFilter) filters.type = typeFilter;
    if (statusFilter) filters.status = statusFilter;

    const properties = DataStore.getProperties(filters);
    const container = document.getElementById('properties-container');

    if (container) {
      container.innerHTML = properties.map(p => Components.propertyCard(p)).join('');
      lucide.createIcons();
    }
  },

  async setupCRMPage() {
    // Try to load leads from API
    if (API.getAccessToken()) {
      try {
        await DataStore.loadLeadsFromAPI();
        // Re-render the CRM page with fresh data
        this.renderCRMPipeline();
      } catch (error) {
        console.warn('Could not load leads from API:', error);
      }
    }

    // Lead card clicks (including follow-up badge)
    Utils.delegate(document.getElementById('content'), 'click', '.lead-card', (e, target) => {
      // Check if clicking on follow-up badge
      const followupBadge = e.target.closest('.lead-card__followup');
      if (followupBadge) {
        e.stopPropagation();
        const leadId = followupBadge.dataset.followupLead;
        if (leadId) {
          Modals.completeFollowUp(leadId);
        }
        return;
      }
      // Normal card click - open panel
      const id = target.dataset.id;
      Panels.lead(id);
    });

    // Drag and drop for pipeline
    this.setupPipelineDragDrop();

    // CRM Search
    const crmSearch = document.getElementById('crm-search');
    if (crmSearch) {
      crmSearch.addEventListener('input', Utils.debounce((e) => {
        this.filterCRMLeads();
      }, 300));
    }

    // Agent filter
    const agentFilter = document.getElementById('filter-agent');
    if (agentFilter) {
      agentFilter.addEventListener('change', () => {
        this.filterCRMLeads();
      });
    }

    // CRM Tabs (Pipeline / Archivados)
    Utils.delegate(document.getElementById('content'), 'click', '.tab', (e, target) => {
      const tabId = target.dataset.tab;
      if (tabId === 'pipeline' || tabId === 'archivados') {
        // Update tab active state
        document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('tab--active'));
        target.classList.add('tab--active');

        // Toggle views
        const pipelineView = document.getElementById('crm-pipeline');
        const archivadosView = document.getElementById('crm-archivados');

        if (pipelineView && archivadosView) {
          pipelineView.style.display = tabId === 'pipeline' ? '' : 'none';
          archivadosView.style.display = tabId === 'archivados' ? '' : 'none';
        }
      }
    });

    // Archived lead card clicks
    Utils.delegate(document.getElementById('content'), 'click', '.archived-lead-card', (e, target) => {
      // Check if clicking restore button
      if (e.target.closest('[data-restore-lead]')) return;
      const id = target.dataset.id;
      if (id) Panels.lead(id);
    });

    // Restore lead button
    Utils.delegate(document.getElementById('content'), 'click', '[data-restore-lead]', async (e, target) => {
      e.stopPropagation();
      const leadId = target.dataset.restoreLead;
      if (!leadId) return;

      try {
        // Move lead back to "nuevo" stage
        await DataStore.updateLeadStageViaAPI(leadId, 'nuevo');
        Toast.show('success', 'Lead restaurado', 'Movido a la etapa "Nuevo"');

        // Refresh CRM view
        await DataStore.loadLeadsFromAPI();
        this.navigate('crm');
      } catch (error) {
        Toast.show('error', 'Error', error.message || 'No se pudo restaurar el lead');
      }
    });
  },

  renderCRMPipeline() {
    const stages = DataStore.leadStages.filter(s => !['perdido'].includes(s.id));
    const pipelineBoard = document.querySelector('.pipeline-board');

    if (pipelineBoard) {
      pipelineBoard.innerHTML = stages.map(stage => {
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
      }).join('');

      lucide.createIcons();
      this.setupPipelineDragDrop();
    }
  },

  filterCRMLeads() {
    const searchQuery = (document.getElementById('crm-search')?.value || '').toLowerCase();
    const agentId = document.getElementById('filter-agent')?.value || '';

    document.querySelectorAll('.lead-card').forEach(card => {
      const leadId = card.dataset.id;
      const lead = DataStore.getLeadById(leadId);

      if (!lead) {
        card.style.display = 'none';
        return;
      }

      // Check agent filter
      const matchesAgent = !agentId || lead.assignedTo === agentId;

      // Check search query
      const name = (lead.name || '').toLowerCase();
      const email = (lead.email || '').toLowerCase();
      const phone = (lead.phone || '').toLowerCase();
      const propertyTitle = (lead.property?.title || '').toLowerCase();
      const matchesSearch = !searchQuery ||
        name.includes(searchQuery) ||
        email.includes(searchQuery) ||
        phone.includes(searchQuery) ||
        propertyTitle.includes(searchQuery);

      card.style.display = (matchesAgent && matchesSearch) ? '' : 'none';
    });

    // Update column counts
    document.querySelectorAll('.pipeline-column').forEach(column => {
      const visibleCards = column.querySelectorAll('.lead-card:not([style*="display: none"])').length;
      const countEl = column.querySelector('.pipeline-column__count');
      if (countEl) {
        countEl.textContent = visibleCards;
      }
    });
  },

  setupPipelineDragDrop() {
    const cards = document.querySelectorAll('.lead-card');
    const columns = document.querySelectorAll('.pipeline-column__body');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.dataset.id);
        card.classList.add('dragging');
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });
    });

    columns.forEach(column => {
      column.addEventListener('dragover', (e) => {
        e.preventDefault();
        column.classList.add('drag-over');
      });

      column.addEventListener('dragleave', () => {
        column.classList.remove('drag-over');
      });

      column.addEventListener('drop', async (e) => {
        e.preventDefault();
        column.classList.remove('drag-over');
        const leadId = e.dataTransfer.getData('text/plain');
        const card = document.querySelector(`[data-id="${leadId}"]`);
        const newStage = column.dataset.stage;

        if (card && column) {
          // Get current lead and update stage
          const lead = DataStore.getLeadById(leadId);
          if (lead && lead.stage !== newStage) {
            // Move card visually first for instant feedback
            column.appendChild(card);

            // Get stage display name
            const stageInfo = DataStore.leadStages.find(s => s.id === newStage);
            const stageName = stageInfo ? stageInfo.name : newStage;

            try {
              // Update via API if using real backend
              if (DataStore.useAPI) {
                await DataStore.updateLeadStageViaAPI(leadId, newStage);
                Toast.show('success', 'Lead actualizado', `Movido a ${stageName}`);
              } else {
                // Fallback to local update
                DataStore.updateLead({ ...lead, stage: newStage });
                Toast.show('success', 'Lead actualizado', `Movido a ${stageName} (modo demo)`);
              }

              // Update column counts
              this.updatePipelineCounts();
            } catch (error) {
              // Revert on error
              Toast.show('error', 'Error', error.message || 'No se pudo actualizar el lead');
              // Move card back to original column
              const originalColumn = document.querySelector(`.pipeline-column__body[data-stage="${lead.stage}"]`);
              if (originalColumn) {
                originalColumn.appendChild(card);
              }
            }
          } else {
            column.appendChild(card);
          }
        }
      });
    });
  },

  updatePipelineCounts() {
    document.querySelectorAll('.pipeline-column').forEach(column => {
      const stage = column.dataset.stage;
      const count = DataStore.getLeadsByStage(stage).length;
      const countEl = column.querySelector('.pipeline-column__count');
      if (countEl) {
        countEl.textContent = count;
      }
    });
  },

  setupContactsPage() {
    // Contact row clicks
    Utils.delegate(document.getElementById('content'), 'click', '.contact-row', (e, target) => {
      if (!e.target.closest('.table-actions')) {
        // Could open contact detail panel
        Toast.show('info', 'Detalle de contacto', 'Panel en desarrollo');
      }
    });
    // Search is now handled by global header search
  },

  setupCalendarPage() {
    // Event clicks
    Utils.delegate(document.getElementById('content'), 'click', '.event-item', (e, target) => {
      Toast.show('info', 'Detalle de evento', 'Panel en desarrollo');
    });

    // Calendar day clicks
    Utils.delegate(document.getElementById('content'), 'click', '.calendar-day', (e, target) => {
      const date = target.dataset.date;
      // Could show events for that day
    });
  },

  setupCajaPage() {
    // Transaction row clicks
    Utils.delegate(document.getElementById('content'), 'click', '.transaction-row', (e, target) => {
      const id = target.dataset.id;
      Panels.transaction(id);
    });
  },

  setupDocumentosPage() {
    // Upload button
    document.getElementById('upload-doc-btn')?.addEventListener('click', () => {
      Modals.upload({
        title: 'Subir Documento',
        accept: '.pdf,.doc,.docx',
        onUpload: (files) => {
          console.log('Files uploaded:', files);
        }
      });
    });

    // Generate document button (main button)
    document.getElementById('generate-doc-btn')?.addEventListener('click', () => {
      Modals.generateDocument();
    });

    // Document type cards - click to generate
    Utils.delegate(document.getElementById('content'), 'click', '.doc-type-card', (e, target) => {
      const templateId = target.dataset.template;
      if (templateId) {
        Modals.generateDocument(templateId);
      }
    });

    // Quick action chips
    Utils.delegate(document.getElementById('content'), 'click', '.chip--action', (e, target) => {
      const templateId = target.dataset.template;
      if (templateId) {
        Modals.generateDocument(templateId);
      }
    });

    // Edit document button
    Utils.delegate(document.getElementById('content'), 'click', '.doc-edit-btn', (e, target) => {
      e.stopPropagation();
      const docId = target.dataset.docId;
      if (docId) {
        Modals.editDocument(docId);
      }
    });

    // Download document button - generates PDF
    Utils.delegate(document.getElementById('content'), 'click', '.doc-download-btn', async (e, target) => {
      e.stopPropagation();
      const docId = target.dataset.docId;

      // Show loading state
      const originalHtml = target.innerHTML;
      target.innerHTML = '<i data-lucide="loader-2" class="spin"></i>';
      target.disabled = true;
      lucide.createIcons();

      try {
        // Get document data
        const doc = DataStore.getGeneratedDocumentById(docId) ||
                    await DataStore.getDocumentById(docId);

        if (doc) {
          // Generate PDF locally using html2pdf.js
          await DocumentPDFGenerator.generate(doc, true);
        } else {
          Toast.show('error', 'Error', 'No se encontró el documento');
        }
      } catch (error) {
        console.error('Download error:', error);
        Toast.show('error', 'Error', 'No se pudo descargar el documento');
      }

      // Restore button
      target.innerHTML = originalHtml;
      target.disabled = false;
      lucide.createIcons();
    });

    // Delete document button
    Utils.delegate(document.getElementById('content'), 'click', '.doc-delete-btn', (e, target) => {
      e.stopPropagation();
      const docId = target.dataset.docId;
      Modals.confirm({
        title: '¿Eliminar documento?',
        message: 'Esta acción no se puede deshacer.',
        icon: 'trash-2',
        type: 'danger',
        confirmText: 'Eliminar',
        onConfirm: async () => {
          try {
            await DataStore.deleteDocumentViaAPI(docId);
            App.renderPage('documentos');
            Toast.show('success', 'Documento eliminado');
          } catch (error) {
            Toast.show('error', 'Error', error.message);
          }
        }
      });
    });

    // Tab filtering for documents
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        this.filterDocuments(tabId);
      });
    });
  },

  filterDocuments(filter) {
    const container = document.getElementById('docs-container');
    if (!container) return;

    let docs = DataStore.getGeneratedDocuments();

    if (filter !== 'todos') {
      docs = docs.filter(d => d.category === filter);
    }

    if (docs.length > 0) {
      container.innerHTML = docs.map(doc => `
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
      `).join('');
    } else {
      container.innerHTML = `
        <div class="docs-empty">
          <i data-lucide="file-plus"></i>
          <h4>Sin documentos en esta categoría</h4>
          <p>Generá un documento usando las opciones de arriba</p>
        </div>
      `;
    }

    lucide.createIcons();
  },

  setupConfiguracionPage() {
    const config = Branding.getConfig();
    let currentConfig = { ...config };

    // Company name input
    const companyNameInput = document.getElementById('config-company-name');
    if (companyNameInput) {
      companyNameInput.addEventListener('input', (e) => {
        currentConfig.companyName = e.target.value || 'DOMUM';
        this.updateConfigPreview(currentConfig);
      });
    }

    // Logo upload
    const logoInput = document.getElementById('logo-input');
    if (logoInput) {
      logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 2 * 1024 * 1024) {
            Toast.show('error', 'Error', 'El archivo es muy grande. Máximo 2MB.');
            return;
          }

          const reader = new FileReader();
          reader.onload = (event) => {
            currentConfig.logo = event.target.result;
            this.updateConfigPreview(currentConfig);
            this.updateLogoPreviewUI(currentConfig.logo);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Remove logo button
    const removeLogoBtn = document.getElementById('remove-logo-btn');
    if (removeLogoBtn) {
      removeLogoBtn.addEventListener('click', () => {
        currentConfig.logo = null;
        this.updateConfigPreview(currentConfig);
        this.updateLogoPreviewUI(null);
      });
    }

    // Primary color presets
    const primaryPresets = document.querySelectorAll('.color-preset[data-target="primary"]');
    primaryPresets.forEach(preset => {
      preset.addEventListener('click', () => {
        const color = preset.dataset.color;
        currentConfig.primaryColor = color;

        // Update UI - only primary presets
        primaryPresets.forEach(p => {
          p.classList.remove('active');
          p.innerHTML = '';
        });
        preset.classList.add('active');
        preset.innerHTML = '<i data-lucide="check"></i>';
        lucide.createIcons();

        // Update custom color inputs
        document.getElementById('primary-color-input').value = color;
        document.getElementById('primary-color-hex').value = color;

        this.updateConfigPreview(currentConfig);
      });
    });

    // Primary color picker input
    const primaryColorInput = document.getElementById('primary-color-input');
    if (primaryColorInput) {
      primaryColorInput.addEventListener('input', (e) => {
        const color = e.target.value;
        currentConfig.primaryColor = color;
        document.getElementById('primary-color-hex').value = color;

        // Deselect presets
        primaryPresets.forEach(p => {
          p.classList.remove('active');
          p.innerHTML = '';
        });

        this.updateConfigPreview(currentConfig);
      });
    }

    // Primary color hex input
    const primaryColorHex = document.getElementById('primary-color-hex');
    if (primaryColorHex) {
      primaryColorHex.addEventListener('input', (e) => {
        let color = e.target.value;
        if (!color.startsWith('#')) {
          color = '#' + color;
        }
        if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
          currentConfig.primaryColor = color;
          document.getElementById('primary-color-input').value = color;

          // Deselect presets
          primaryPresets.forEach(p => {
            p.classList.remove('active');
            p.innerHTML = '';
          });

          this.updateConfigPreview(currentConfig);
        }
      });
    }

    // Background color presets
    const bgPresets = document.querySelectorAll('.color-preset[data-target="background"]');
    bgPresets.forEach(preset => {
      preset.addEventListener('click', () => {
        const color = preset.dataset.color;
        currentConfig.backgroundColor = color;

        // Update UI - only bg presets
        bgPresets.forEach(p => {
          p.classList.remove('active');
          p.innerHTML = '';
        });
        preset.classList.add('active');
        preset.innerHTML = '<i data-lucide="check"></i>';
        lucide.createIcons();

        // Update custom color inputs
        document.getElementById('bg-color-input').value = color;
        document.getElementById('bg-color-hex').value = color;

        this.updateConfigPreview(currentConfig);
      });
    });

    // Background color picker input
    const bgColorInput = document.getElementById('bg-color-input');
    if (bgColorInput) {
      bgColorInput.addEventListener('input', (e) => {
        const color = e.target.value;
        currentConfig.backgroundColor = color;
        document.getElementById('bg-color-hex').value = color;

        // Deselect presets
        bgPresets.forEach(p => {
          p.classList.remove('active');
          p.innerHTML = '';
        });

        this.updateConfigPreview(currentConfig);
      });
    }

    // Background color hex input
    const bgColorHex = document.getElementById('bg-color-hex');
    if (bgColorHex) {
      bgColorHex.addEventListener('input', (e) => {
        let color = e.target.value;
        if (!color.startsWith('#')) {
          color = '#' + color;
        }
        if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
          currentConfig.backgroundColor = color;
          document.getElementById('bg-color-input').value = color;

          // Deselect presets
          bgPresets.forEach(p => {
            p.classList.remove('active');
            p.innerHTML = '';
          });

          this.updateConfigPreview(currentConfig);
        }
      });
    }

    // Save button
    const saveBtn = document.getElementById('save-config-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Guardando...';
        lucide.createIcons();

        const success = await Branding.saveConfig(currentConfig);

        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i data-lucide="save"></i> Guardar cambios';
        lucide.createIcons();

        if (success) {
          Toast.show('success', 'Guardado', 'La configuración se guardó correctamente');
        } else {
          Toast.show('error', 'Error', 'No se pudo guardar la configuración. Verificá que tengas permisos de SUPERADMIN.');
        }
      });
    }

    // Reset button
    const resetBtn = document.getElementById('reset-config-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Modals.confirm({
          title: '¿Restaurar configuración?',
          message: 'Se restaurarán los valores por defecto. Esta acción no se puede deshacer.',
          icon: 'rotate-ccw',
          type: 'warning',
          confirmText: 'Restaurar',
          onConfirm: async () => {
            currentConfig = await Branding.resetConfig();
            App.renderPage('configuracion');
            Toast.show('success', 'Restaurado', 'Configuración restaurada a valores por defecto');
          }
        });
      });
    }

    // Initial preview setup
    this.updateConfigPreview(currentConfig);
  },

  updateConfigPreview(config) {
    const previewContainer = document.getElementById('preview-container');
    if (!previewContainer) return;

    // Update preview colors
    previewContainer.style.setProperty('--preview-accent', config.primaryColor);
    previewContainer.style.setProperty('--preview-bg', config.backgroundColor || '#0A0E14');

    // Calculate derived background colors
    const bgRgb = Branding.hexToRgb(config.backgroundColor || '#0A0E14');
    if (bgRgb) {
      const sidebar = Branding.adjustBrightness(bgRgb, -10);
      const card = Branding.adjustBrightness(bgRgb, 20);
      previewContainer.style.setProperty('--preview-bg-sidebar', `rgb(${sidebar.r}, ${sidebar.g}, ${sidebar.b})`);
      previewContainer.style.setProperty('--preview-bg-card', `rgb(${card.r}, ${card.g}, ${card.b})`);
    }

    // Update preview logo
    const previewLogoIcon = document.getElementById('preview-logo-icon');
    if (previewLogoIcon) {
      if (config.logo) {
        previewLogoIcon.innerHTML = `<img src="${config.logo}" alt="Logo">`;
      } else {
        previewLogoIcon.innerHTML = '<i data-lucide="building-2"></i>';
        lucide.createIcons();
      }
    }

    // Update preview company name
    const previewCompanyName = document.getElementById('preview-company-name');
    if (previewCompanyName) {
      previewCompanyName.textContent = config.companyName || 'DOMUM';
    }
  },

  updateLogoPreviewUI(logoData) {
    const logoPreview = document.getElementById('logo-preview');
    if (logoPreview) {
      if (logoData) {
        logoPreview.innerHTML = `<img src="${logoData}" alt="Logo" class="logo-preview__img">`;
      } else {
        logoPreview.innerHTML = '<i data-lucide="building-2"></i>';
        lucide.createIcons();
      }
    }

    // Re-render page to update remove button visibility
    // App.renderPage('configuracion');
  },

  async setupUsuariosPage() {
    // Load users from API if authenticated
    if (API.getAccessToken()) {
      try {
        await DataStore.loadUsersFromAPI();
        // Re-render the users table with fresh data
        this.renderUsersTable();
      } catch (error) {
        console.warn('Could not load users from API:', error);
        Toast.show('warning', 'Usando datos locales', 'No se pudo conectar con el servidor');
      }
    }

    // Edit user button clicks
    Utils.delegate(document.getElementById('content'), 'click', '.edit-user-btn', (e, target) => {
      e.stopPropagation();
      const userId = target.dataset.id;
      if (userId) {
        Modals.editUser(userId);
      }
    });

    // Delete user button clicks
    Utils.delegate(document.getElementById('content'), 'click', '.delete-user-btn', (e, target) => {
      e.stopPropagation();
      const userId = target.dataset.id;
      if (userId) {
        Modals.deleteUser(userId);
      }
    });

    // User row clicks (open detail panel)
    Utils.delegate(document.getElementById('content'), 'click', '.user-row', (e, target) => {
      if (!e.target.closest('.table-actions')) {
        const userId = target.dataset.id;
        if (userId) {
          Panels.user(userId);
        }
      }
    });

    // Role filter
    const roleFilter = document.getElementById('filter-role');
    if (roleFilter) {
      roleFilter.addEventListener('change', () => {
        this.filterUsers();
      });
    }

    // Tab filtering for users
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        this.filterUsers(tabId);
      });
    });
  },

  filterUsers(statusFilter = 'todos') {
    const roleFilter = document.getElementById('filter-role')?.value || '';

    document.querySelectorAll('.user-row').forEach(row => {
      const userId = row.dataset.id;
      const user = DataStore.getUserById(userId);

      if (!user) {
        row.style.display = 'none';
        return;
      }

      // Check status filter
      let matchesStatus = true;
      if (statusFilter === 'activos') {
        matchesStatus = user.status === 'activo';
      } else if (statusFilter === 'inactivos') {
        matchesStatus = user.status === 'inactivo';
      }

      // Check role filter
      const matchesRole = !roleFilter || user.role === roleFilter;

      row.style.display = (matchesStatus && matchesRole) ? '' : 'none';
    });
  },

  renderUsersTable() {
    const users = DataStore.getUsers();
    const currentUser = DataStore.currentUser;
    const currentUserRole = currentUser?.role || 'administrador';

    // Update stats
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'activo').length;
    const adminCount = users.filter(u => u.role === 'administrador' || u.role === 'superadmin').length;
    const agentCount = users.filter(u => u.role === 'agente').length;

    // Update stats cards
    const statsContainer = document.querySelector('.users-summary');
    if (statsContainer) {
      statsContainer.innerHTML = `
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
      `;
    }

    // Update table
    const tbody = document.getElementById('users-tbody');
    if (tbody) {
      tbody.innerHTML = users.map(u => Components.userRow(u, currentUserRole)).join('');
    }

    // Update tab counts
    const tabs = document.querySelectorAll('.page--usuarios .tab');
    tabs.forEach(tab => {
      const tabId = tab.dataset.tab;
      const countEl = tab.querySelector('.tab__count');
      if (countEl) {
        switch (tabId) {
          case 'todos':
            countEl.textContent = totalUsers;
            break;
          case 'activos':
            countEl.textContent = activeUsers;
            break;
          case 'inactivos':
            countEl.textContent = totalUsers - activeUsers;
            break;
        }
      }
    });

    lucide.createIcons();
  },

  // Booking calendar state
  bookingCalendarState: {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    propertyFilter: null
  },

  async setupAdministracionesPage() {
    // Load rentals from API
    if (API.getAccessToken()) {
      try {
        await DataStore.loadRentalsFromAPI();
        // Re-render with fresh data
        this.renderRentalsGrid();
      } catch (error) {
        console.error('Error loading rentals from API:', error);
        Toast.show('warning', 'Usando datos locales', 'No se pudo conectar con el servidor');
      }
    }

    // Setup main admin tabs (Contratos vs Temporarios)
    const adminTabs = document.querySelectorAll('.admin-tabs .tab');
    adminTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        this.switchAdminView(tabId);
      });
    });

    // Rental card clicks
    Utils.delegate(document.getElementById('content'), 'click', '.rental-card', (e, target) => {
      if (!e.target.closest('.rental-card__btn')) {
        const id = target.dataset.id;
        Panels.rental(id);
      }
    });

    // View rental detail button
    Utils.delegate(document.getElementById('content'), 'click', '[data-action="view-rental"]', (e, target) => {
      e.stopPropagation();
      const id = target.dataset.id;
      Panels.rental(id);
    });

    // View toggle
    const viewButtons = document.querySelectorAll('.view-toggle__btn');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.view;
        const container = document.getElementById('rentals-container');
        if (container) {
          container.className = view === 'list' ? 'rentals-list' : 'rentals-grid';
        }
      });
    });

    // Tab filtering for rentals (sub-tabs within contratos view)
    const rentalTabs = document.querySelectorAll('#contratos-view .filters-bar .tab');
    rentalTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        this.filterRentals(tabId);
      });
    });

    // Setup temporarios view handlers
    this.setupTemporariosView();
  },

  switchAdminView(viewId) {
    // Update tab states
    document.querySelectorAll('.admin-tabs .tab').forEach(t => {
      t.classList.toggle('tab--active', t.dataset.tab === viewId);
    });

    // Toggle view visibility
    const contratosView = document.getElementById('contratos-view');
    const temporariosView = document.getElementById('temporarios-view');

    if (contratosView) contratosView.classList.toggle('hidden', viewId !== 'contratos');
    if (temporariosView) temporariosView.classList.toggle('hidden', viewId !== 'temporarios');

    // Re-render icons
    lucide.createIcons();
  },

  setupTemporariosView() {
    // Property filter
    const propertyFilter = document.getElementById('filter-temp-property');
    if (propertyFilter) {
      propertyFilter.addEventListener('change', (e) => {
        this.bookingCalendarState.propertyFilter = e.target.value || null;
        this.renderBookingCalendar();
      });
    }

    // Month navigation
    const prevBtn = document.getElementById('prev-booking-month');
    const nextBtn = document.getElementById('next-booking-month');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.navigateBookingMonth(-1));
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.navigateBookingMonth(1));
    }

    // Booking card clicks
    Utils.delegate(document.getElementById('content'), 'click', '.booking-card', (e, target) => {
      const id = target.dataset.id;
      // TODO: Implementar panel de detalle de booking
      console.log('View booking:', id);
    });

    // Booking item clicks in sidebar
    Utils.delegate(document.getElementById('content'), 'click', '.booking-item', (e, target) => {
      const id = target.dataset.id;
      // TODO: Implementar panel de detalle de booking
      console.log('View booking:', id);
    });

    // Calendar booking block clicks
    Utils.delegate(document.getElementById('content'), 'click', '.calendar-booking-block', (e, target) => {
      e.stopPropagation();
      const bookingId = target.dataset.bookingId;
      // TODO: Implementar panel de detalle de booking
      console.log('View booking from calendar:', bookingId);
    });

    // New booking button
    const newBookingBtn = document.getElementById('new-booking-btn');
    if (newBookingBtn) {
      newBookingBtn.addEventListener('click', () => {
        // TODO: Implementar modal de nueva reserva
        Toast.show('info', 'Proximamente', 'El formulario de nueva reserva estara disponible pronto');
      });
    }
  },

  navigateBookingMonth(delta) {
    this.bookingCalendarState.month += delta;

    if (this.bookingCalendarState.month > 11) {
      this.bookingCalendarState.month = 0;
      this.bookingCalendarState.year++;
    } else if (this.bookingCalendarState.month < 0) {
      this.bookingCalendarState.month = 11;
      this.bookingCalendarState.year--;
    }

    this.renderBookingCalendar();
  },

  renderBookingCalendar() {
    const { year, month, propertyFilter } = this.bookingCalendarState;
    const bookings = DataStore.getTemporaryBookingsForMonth(year, month, propertyFilter);

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    // Update title
    const titleEl = document.getElementById('booking-calendar-title');
    if (titleEl) {
      titleEl.textContent = `${monthNames[month]} ${year}`;
    }

    // Generate calendar days
    const today = new Date();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    let calendarDays = '';

    // Previous month days
    const prevMonth = new Date(year, month, 0);
    for (let i = startOffset - 1; i >= 0; i--) {
      const day = new Date(year, month - 1, prevMonth.getDate() - i);
      calendarDays += Components.calendarBookingDay(day, bookings, false, false);
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i);
      const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      calendarDays += Components.calendarBookingDay(day, bookings, isToday, true);
    }

    // Next month days
    const remaining = 42 - (startOffset + daysInMonth);
    for (let i = 1; i <= remaining; i++) {
      const day = new Date(year, month + 1, i);
      calendarDays += Components.calendarBookingDay(day, bookings, false, false);
    }

    // Update grid
    const gridEl = document.getElementById('booking-calendar-grid');
    if (gridEl) {
      gridEl.innerHTML = calendarDays;
    }

    lucide.createIcons();
  },

  renderRentalsGrid() {
    const container = document.getElementById('rentals-container');
    if (!container) return;

    const activeRentals = DataStore.getActiveRentals();
    const stats = DataStore.getRentalStats();

    // Update stats cards
    const statsContainer = document.querySelector('.rentals-summary');
    if (statsContainer) {
      statsContainer.innerHTML = `
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
          color: stats.expiringContracts > 0 ? 'orange' : 'green'
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
          subtitle: stats.monthlyIncomeARS > 0 && stats.monthlyIncomeUSD > 0 ? '+ ' + Utils.formatCurrency(stats.monthlyIncomeUSD, 'USD') : '',
          icon: 'wallet',
          color: 'green'
        })}
      `;
    }

    // Render rentals grid
    if (activeRentals.length > 0) {
      container.innerHTML = activeRentals.map(rental => Components.rentalCard(rental)).join('');
    } else {
      container.innerHTML = Components.emptyState(
        'file-text',
        'Sin contratos activos',
        'No hay contratos de alquiler registrados. Creá uno nuevo para comenzar.'
      );
    }

    // Update tab counts
    const expiringRentals = DataStore.getExpiringRentals(90);
    const allRentals = DataStore.getRentals();
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      const tabId = tab.dataset.tab;
      const countEl = tab.querySelector('.tab__count');
      if (countEl) {
        switch (tabId) {
          case 'activos':
            countEl.textContent = activeRentals.length;
            break;
          case 'por_vencer':
            countEl.textContent = expiringRentals.length;
            break;
          case 'todos':
            countEl.textContent = allRentals.length;
            break;
        }
      }
    });

    lucide.createIcons();
  },

  filterRentals(filter) {
    const container = document.getElementById('rentals-container');
    if (!container) return;

    let rentals;
    switch (filter) {
      case 'activos':
        rentals = DataStore.getActiveRentals();
        break;
      case 'por_vencer':
        rentals = DataStore.getExpiringRentals(90);
        break;
      case 'todos':
      default:
        rentals = DataStore.getRentals();
        break;
    }

    if (rentals.length > 0) {
      container.innerHTML = rentals.map(rental => Components.rentalCard(rental)).join('');
    } else {
      container.innerHTML = Components.emptyState(
        'file-text',
        'Sin contratos',
        filter === 'por_vencer' ? 'No hay contratos próximos a vencer.' : 'No hay contratos registrados.'
      );
    }

    lucide.createIcons();
  },

  setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabContainer = tab.closest('.tabs');
        tabContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('tab--active'));
        tab.classList.add('tab--active');

        // Could filter content based on tab
        const tabId = tab.dataset.tab;
        this.handleTabChange(tabId);
      });
    });
  },

  handleTabChange(tabId) {
    // Handle filtering based on tab selection
    // This is a simplified version - you'd implement actual filtering here
    console.log('Tab changed to:', tabId);
  },

  setupCardClicks() {
    // Lead row clicks in dashboard
    Utils.delegate(document.getElementById('content'), 'click', '.lead-row', (e, target) => {
      const id = target.dataset.id;
      Panels.lead(id);
    });
  },

  setupGlobalEvents() {
    // New button in header
    document.getElementById('new-btn').addEventListener('click', () => {
      // Show contextual new modal based on current page
      switch (this.currentPage) {
        case 'propiedades':
          Modals.newProperty();
          break;
        case 'crm':
          Modals.newLead();
          break;
        case 'contactos':
          Modals.newContact();
          break;
        case 'calendario':
          Modals.newEvent();
          break;
        case 'caja':
          Modals.newTransaction();
          break;
        case 'documentos':
          Modals.newDocument();
          break;
        case 'administraciones':
          Modals.newRental();
          break;
        case 'usuarios':
          Modals.newUser();
          break;
        default:
          // Show a menu of options
          this.showNewMenu();
      }
    });

    // Notifications button
    document.getElementById('notifications-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleNotifications();
    });

    // Close notifications dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('notifications-dropdown');
      const btn = document.getElementById('notifications-btn');
      if (dropdown && !dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });

    // Global search
    const searchInput = document.querySelector('.header .search-input');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.filterCurrentPage(e.target.value.toLowerCase());
      }, 300));
    }
  },

  filterCurrentPage(query) {
    switch (this.currentPage) {
      case 'propiedades':
        document.querySelectorAll('.property-card').forEach(card => {
          const title = card.querySelector('.property-card__title')?.textContent.toLowerCase() || '';
          const address = card.querySelector('.property-card__address')?.textContent.toLowerCase() || '';
          card.style.display = (title.includes(query) || address.includes(query)) ? '' : 'none';
        });
        break;
      case 'contactos':
        document.querySelectorAll('.contact-row').forEach(row => {
          const name = row.querySelector('.contact-name')?.textContent.toLowerCase() || '';
          const email = row.querySelector('.contact-email')?.textContent.toLowerCase() || '';
          row.style.display = (name.includes(query) || email.includes(query)) ? '' : 'none';
        });
        break;
      case 'crm':
        document.querySelectorAll('.lead-card').forEach(card => {
          const name = card.querySelector('.lead-card__name')?.textContent.toLowerCase() || '';
          const property = card.querySelector('.lead-card__property')?.textContent.toLowerCase() || '';
          card.style.display = (name.includes(query) || property.includes(query)) ? '' : 'none';
        });
        break;
      case 'caja':
        document.querySelectorAll('.transaction-row').forEach(row => {
          const desc = row.querySelector('.transaction-title')?.textContent.toLowerCase() || '';
          const category = row.querySelector('.badge')?.textContent.toLowerCase() || '';
          row.style.display = (desc.includes(query) || category.includes(query)) ? '' : 'none';
        });
        break;
      case 'administraciones':
        document.querySelectorAll('.rental-card').forEach(card => {
          const title = card.querySelector('.rental-card__title')?.textContent.toLowerCase() || '';
          const address = card.querySelector('.rental-card__address')?.textContent.toLowerCase() || '';
          const propietario = card.querySelectorAll('.rental-card__party-name')[0]?.textContent.toLowerCase() || '';
          const inquilino = card.querySelectorAll('.rental-card__party-name')[1]?.textContent.toLowerCase() || '';
          const match = title.includes(query) || address.includes(query) || propietario.includes(query) || inquilino.includes(query);
          card.style.display = match ? '' : 'none';
        });
        break;
      case 'usuarios':
        document.querySelectorAll('.user-row').forEach(row => {
          const name = row.querySelector('.user-name')?.textContent.toLowerCase() || '';
          const email = row.cells?.[1]?.textContent.toLowerCase() || '';
          row.style.display = (name.includes(query) || email.includes(query)) ? '' : 'none';
        });
        break;
    }
  },

  showNewMenu() {
    Modals.confirm({
      title: '¿Qué querés crear?',
      message: 'Seleccioná el tipo de elemento',
      icon: 'plus',
      type: 'info',
      confirmText: 'Propiedad',
      cancelText: 'Lead',
      onConfirm: () => {
        setTimeout(() => Modals.newProperty(), 100);
      }
    });
  },

  // =============================================
  // NOTIFICATIONS
  // =============================================

  async loadNotifications() {
    try {
      const result = await API.getPendingFollowUps();

      if (result.success) {
        this.notifications = result.notifications || [];
        this.renderNotifications();
        this.updateNotificationBadge();
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  },

  renderNotifications() {
    const listContainer = document.getElementById('notifications-list');
    const emptyContainer = document.getElementById('notifications-empty');

    if (!listContainer) return;

    if (this.notifications.length === 0) {
      listContainer.style.display = 'none';
      emptyContainer.style.display = 'flex';
      lucide.createIcons();
      return;
    }

    listContainer.style.display = 'block';
    emptyContainer.style.display = 'none';

    const typeLabels = {
      'llamada_entrante': 'Llamada entrante',
      'llamada_saliente': 'Llamada saliente',
      'whatsapp': 'WhatsApp',
      'email': 'Email',
      'visita': 'Visita',
      'reunion': 'Reunión',
      'nota': 'Nota',
      'oferta': 'Oferta',
      'seguimiento': 'Seguimiento'
    };

    const typeIcons = {
      'llamada_entrante': 'phone-incoming',
      'llamada_saliente': 'phone-outgoing',
      'whatsapp': 'message-circle',
      'email': 'mail',
      'visita': 'home',
      'reunion': 'users',
      'nota': 'file-text',
      'oferta': 'tag',
      'seguimiento': 'refresh-cw'
    };

    listContainer.innerHTML = this.notifications.map(n => {
      const statusClass = n.isOverdue ? 'overdue' : 'today';
      const icon = typeIcons[n.type] || 'bell';
      const typeLabel = typeLabels[n.type] || n.type;

      const followUpDate = new Date(n.followUpDate);
      const day = String(followUpDate.getDate()).padStart(2, '0');
      const month = String(followUpDate.getMonth() + 1).padStart(2, '0');
      const year = followUpDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;

      return `
        <div class="notification-item" data-lead-id="${n.leadId}">
          <div class="notification-item__icon notification-item__icon--${statusClass}">
            <i data-lucide="${icon}"></i>
          </div>
          <div class="notification-item__content">
            <div class="notification-item__lead">${n.leadName}</div>
            <div class="notification-item__type">${typeLabel} · Seguimiento: ${formattedDate}</div>
            ${n.notes ? `<div class="notification-item__notes">${n.notes}</div>` : ''}
          </div>
          <div class="notification-item__date notification-item__date--${statusClass}">
            ${n.isOverdue ? '⚠️ Vencido' : '📅 Hoy'}
          </div>
        </div>
      `;
    }).join('');

    // Add click handlers to open lead panel
    listContainer.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', () => {
        const leadId = item.dataset.leadId;
        document.getElementById('notifications-dropdown').classList.remove('active');
        Panels.lead(leadId);
      });
    });

    lucide.createIcons();
  },

  updateNotificationBadge() {
    const badge = document.getElementById('notification-count');
    if (!badge) return;

    const count = this.notifications.length;

    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  },

  toggleNotifications() {
    const dropdown = document.getElementById('notifications-dropdown');
    if (!dropdown) return;

    const isActive = dropdown.classList.contains('active');

    if (!isActive) {
      // Reload notifications when opening
      this.loadNotifications();
    }

    dropdown.classList.toggle('active');
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
