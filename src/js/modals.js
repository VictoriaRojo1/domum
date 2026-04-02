/**
 * DOMUM - Modal System
 * All modal templates and handling logic
 */

/**
 * Form Validation Helper
 * Provides consistent validation and error messages
 */
const FormValidation = {
  // Email regex pattern
  emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Password validation
  validatePassword(password) {
    const errors = [];

    if (!password || password.length < 8) {
      errors.push('Debe tener al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Debe incluir al menos una mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Debe incluir al menos una minúscula');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Debe incluir al menos un número');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  // Email validation
  validateEmail(email) {
    if (!email) return { isValid: true, error: null }; // Optional field

    if (!this.emailPattern.test(email)) {
      return { isValid: false, error: 'El formato del email es inválido' };
    }
    return { isValid: true, error: null };
  },

  // Required email validation
  validateRequiredEmail(email) {
    if (!email || !email.trim()) {
      return { isValid: false, error: 'El email es requerido' };
    }
    if (!this.emailPattern.test(email)) {
      return { isValid: false, error: 'El formato del email es inválido' };
    }
    return { isValid: true, error: null };
  },

  // Numeric validation
  validatePositiveNumber(value, fieldName) {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return { isValid: false, error: `${fieldName} debe ser un número mayor a 0` };
    }
    return { isValid: true, error: null };
  },

  // Date range validation
  validateDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
      return { isValid: false, error: 'Las fechas son requeridas' };
    }
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return { isValid: false, error: 'La fecha de fin debe ser posterior a la fecha de inicio' };
    }
    return { isValid: true, error: null };
  },

  // Budget range validation
  validateBudgetRange(min, max) {
    if (!min && !max) return { isValid: true, error: null }; // Both optional

    const minNum = parseFloat(min) || 0;
    const maxNum = parseFloat(max) || Infinity;

    if (min && max && minNum >= maxNum) {
      return { isValid: false, error: 'El presupuesto mínimo debe ser menor al máximo' };
    }
    return { isValid: true, error: null };
  },

  // Percentage validation (0-100)
  validatePercentage(value, fieldName) {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 100) {
      return { isValid: false, error: `${fieldName} debe estar entre 0 y 100` };
    }
    return { isValid: true, error: null };
  },

  // Show validation error with Toast
  showError(title, message) {
    Toast.show('error', title, message);
  },

  // Show multiple validation errors
  showErrors(title, errors) {
    if (Array.isArray(errors) && errors.length > 0) {
      Toast.show('error', title, errors.join('. '));
    }
  }
};

const Modals = {
  overlay: null,
  container: null,
  isOpen: false,

  init() {
    this.overlay = document.getElementById('modal-overlay');
    this.container = document.getElementById('modal-container');

    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  },

  open(content, size = 'md') {
    this.container.className = `modal modal--${size}`;
    this.container.innerHTML = content;
    this.overlay.classList.add('active');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';

    // Re-render icons
    if (window.lucide) {
      lucide.createIcons();
    }

    // Focus first input
    const firstInput = this.container.querySelector('input, select, textarea');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  },

  close() {
    this.overlay.classList.remove('active');
    this.isOpen = false;
    document.body.style.overflow = '';
  },

  // Confirmation Modal
  confirm(options) {
    const { title, message, icon = 'alert-triangle', type = 'warning', confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm } = options;

    const content = `
      <div class="modal__body" style="text-align: center; padding: 2rem;">
        <div class="confirm-modal__icon confirm-modal__icon--${type}">
          <i data-lucide="${icon}"></i>
        </div>
        <h3 class="confirm-modal__title">${title}</h3>
        <p class="confirm-modal__message">${message}</p>
      </div>
      <div class="modal__footer" style="justify-content: center;">
        <button class="btn btn--outline" id="modal-cancel">${cancelText}</button>
        <button class="btn btn--${type === 'danger' ? 'danger' : 'primary'}" id="modal-confirm">${confirmText}</button>
      </div>
    `;

    this.open(content, 'sm');

    document.getElementById('modal-cancel').addEventListener('click', () => this.close());
    document.getElementById('modal-confirm').addEventListener('click', () => {
      if (onConfirm) onConfirm();
      this.close();
    });
  },

  // Upload Modal
  upload(options = {}) {
    const { title = 'Subir Archivos', accept = '*', multiple = true, onUpload } = options;

    const content = `
      <div class="modal__header">
        <h2 class="modal__title">${title}</h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body">
        <div class="upload-zone" id="upload-zone">
          <div class="upload-zone__icon">
            <i data-lucide="cloud-upload"></i>
          </div>
          <h3 class="upload-zone__title">Arrastrá archivos aquí</h3>
          <p class="upload-zone__subtitle">o hacé click para seleccionar</p>
          <p class="upload-zone__formats">PDF, DOC, DOCX, JPG, PNG hasta 10MB</p>
          <input type="file" id="file-input" ${multiple ? 'multiple' : ''} accept="${accept}" style="display: none;">
        </div>
        <div class="upload-progress" id="upload-progress" style="display: none;">
          <!-- Progress items will be added here -->
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-upload" disabled>Subir</button>
      </div>
    `;

    this.open(content, 'md');

    const zone = document.getElementById('upload-zone');
    const input = document.getElementById('file-input');
    const progress = document.getElementById('upload-progress');
    const uploadBtn = document.getElementById('modal-upload');
    let files = [];

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      handleFiles(e.dataTransfer.files);
    });
    input.addEventListener('change', () => handleFiles(input.files));

    function handleFiles(fileList) {
      files = Array.from(fileList);
      progress.style.display = 'block';
      progress.innerHTML = files.map(f => `
        <div class="upload-file">
          <div class="upload-file__icon"><i data-lucide="file"></i></div>
          <div class="upload-file__info">
            <span class="upload-file__name">${f.name}</span>
            <div class="upload-file__progress"><div class="upload-file__progress-bar" style="width: 0%"></div></div>
          </div>
        </div>
      `).join('');
      lucide.createIcons();
      uploadBtn.disabled = false;
    }

    document.getElementById('modal-close').addEventListener('click', () => this.close());
    document.getElementById('modal-cancel').addEventListener('click', () => this.close());
    uploadBtn.addEventListener('click', () => {
      // Simulate upload
      const bars = progress.querySelectorAll('.upload-file__progress-bar');
      bars.forEach((bar, i) => {
        let width = 0;
        const interval = setInterval(() => {
          width += Math.random() * 30;
          bar.style.width = Math.min(width, 100) + '%';
          if (width >= 100) {
            clearInterval(interval);
            if (i === bars.length - 1) {
              Toast.show('success', 'Archivos subidos correctamente');
              if (onUpload) onUpload(files);
              this.close();
            }
          }
        }, 200);
      });
    });
  },

  // User Selector Modal
  userSelector(options = {}) {
    const { title = 'Seleccionar Usuario', users = DataStore.users, onSelect } = options;

    const content = `
      <div class="modal__header">
        <h2 class="modal__title">${title}</h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body">
        <div class="user-selector__search">
          <div class="search-box">
            <i data-lucide="search"></i>
            <input type="text" placeholder="Buscar usuario..." class="search-input" id="user-search">
          </div>
        </div>
        <div class="user-selector__list" id="user-list">
          ${users.map(u => `
            <div class="user-selector__item" data-id="${u.id}">
              <div class="user-selector__avatar">${u.avatar}</div>
              <div class="user-selector__info">
                <span class="user-selector__name">${u.name}</span>
                <span class="user-selector__role">${u.role}</span>
              </div>
              <div class="user-selector__check">
                <i data-lucide="check"></i>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-select" disabled>Seleccionar</button>
      </div>
    `;

    this.open(content, 'sm');

    let selectedUser = null;
    const list = document.getElementById('user-list');
    const selectBtn = document.getElementById('modal-select');

    list.addEventListener('click', (e) => {
      const item = e.target.closest('.user-selector__item');
      if (item) {
        list.querySelectorAll('.user-selector__item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        selectedUser = item.dataset.id;
        selectBtn.disabled = false;
      }
    });

    document.getElementById('user-search').addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      list.querySelectorAll('.user-selector__item').forEach(item => {
        const name = item.querySelector('.user-selector__name').textContent.toLowerCase();
        item.style.display = name.includes(search) ? '' : 'none';
      });
    });

    document.getElementById('modal-close').addEventListener('click', () => this.close());
    document.getElementById('modal-cancel').addEventListener('click', () => this.close());
    selectBtn.addEventListener('click', () => {
      if (selectedUser && onSelect) {
        onSelect(DataStore.getUserById(selectedUser));
      }
      this.close();
    });
  },

  // New Property Modal
  newProperty() {
    const content = `
      <div class="modal__header">
        <h2 class="modal__title">Nueva Propiedad</h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body form-modal">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Título *</label>
            <input type="text" class="form-input" id="new-prop-title" placeholder="Ej: Departamento 3 amb. luminoso">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tipo</label>
            <select class="form-select" id="new-prop-type">
              <option value="departamento">Departamento</option>
              <option value="casa">Casa</option>
              <option value="ph">PH</option>
              <option value="local">Local</option>
              <option value="oficina">Oficina</option>
              <option value="terreno">Terreno</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Operación</label>
            <select class="form-select" id="new-prop-operation">
              <option value="venta">Venta</option>
              <option value="alquiler">Alquiler</option>
              <option value="alquiler_temporario">Alquiler Temporario</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Precio *</label>
            <input type="number" class="form-input" id="new-prop-price" placeholder="0">
          </div>
          <div class="form-group">
            <label class="form-label">Moneda</label>
            <select class="form-select" id="new-prop-currency">
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Dirección *</label>
          <input type="text" class="form-input" id="new-prop-address" placeholder="Calle y número">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Barrio</label>
            <input type="text" class="form-input" id="new-prop-neighborhood" placeholder="Ej: Palermo">
          </div>
          <div class="form-group">
            <label class="form-label">Ciudad *</label>
            <input type="text" class="form-input" id="new-prop-city" placeholder="Ej: CABA">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Dormitorios</label>
            <input type="number" class="form-input" id="new-prop-bedrooms" placeholder="0" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">Baños</label>
            <input type="number" class="form-input" id="new-prop-bathrooms" placeholder="0" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">Superficie (m²)</label>
            <input type="number" class="form-input" id="new-prop-area" placeholder="0" min="0">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Descripción</label>
          <textarea class="form-textarea" id="new-prop-description" rows="3" placeholder="Descripción de la propiedad..."></textarea>
        </div>
        <div class="form-section">
          <h4 class="form-section__title">Imágenes</h4>
          <div class="image-upload-area" id="image-upload-area">
            <input type="file" id="image-input" multiple accept="image/*" class="hidden">
            <div class="image-upload-dropzone" id="image-dropzone">
              <i data-lucide="upload-cloud"></i>
              <p>Arrastrá imágenes aquí o <span class="text-accent">hacé click para seleccionar</span></p>
              <span class="text-muted">Máximo 10 imágenes, 10MB cada una</span>
            </div>
            <div class="image-preview-grid" id="image-preview-grid"></div>
          </div>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-save">
          <i data-lucide="save"></i>
          Guardar Propiedad
        </button>
      </div>
    `;

    this.open(content, 'lg');

    // Track selected files
    let selectedFiles = [];

    // Setup image upload
    const dropzone = document.getElementById('image-dropzone');
    const fileInput = document.getElementById('image-input');
    const previewGrid = document.getElementById('image-preview-grid');

    const updatePreviews = () => {
      previewGrid.innerHTML = selectedFiles.map((file, index) => `
        <div class="image-preview-item" data-index="${index}">
          <img src="${URL.createObjectURL(file)}" alt="Preview">
          <button class="image-preview-remove" data-index="${index}">
            <i data-lucide="x"></i>
          </button>
        </div>
      `).join('');
      lucide.createIcons();

      // Setup remove buttons
      previewGrid.querySelectorAll('.image-preview-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.index);
          selectedFiles.splice(idx, 1);
          updatePreviews();
        });
      });
    };

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      selectedFiles = [...selectedFiles, ...files].slice(0, 10);
      updatePreviews();
    });

    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      selectedFiles = [...selectedFiles, ...files].slice(0, 10);
      updatePreviews();
    });

    // Setup close/cancel buttons
    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.close());

    // Setup save button with API call
    document.getElementById('modal-save')?.addEventListener('click', async () => {
      const saveBtn = document.getElementById('modal-save');

      // Collect form data
      const propertyData = {
        title: document.getElementById('new-prop-title')?.value.trim(),
        type: document.getElementById('new-prop-type')?.value,
        operation: document.getElementById('new-prop-operation')?.value,
        price: document.getElementById('new-prop-price')?.value,
        currency: document.getElementById('new-prop-currency')?.value,
        address: document.getElementById('new-prop-address')?.value.trim(),
        neighborhood: document.getElementById('new-prop-neighborhood')?.value.trim(),
        city: document.getElementById('new-prop-city')?.value.trim(),
        bedrooms: document.getElementById('new-prop-bedrooms')?.value || null,
        bathrooms: document.getElementById('new-prop-bathrooms')?.value || null,
        area: document.getElementById('new-prop-area')?.value || null,
        description: document.getElementById('new-prop-description')?.value.trim()
      };

      // Validate required fields
      if (!propertyData.title) {
        Toast.show('error', 'Campo requerido', 'El título es requerido');
        return;
      }
      if (!propertyData.address) {
        Toast.show('error', 'Campo requerido', 'La dirección es requerida');
        return;
      }
      if (!propertyData.city) {
        Toast.show('error', 'Campo requerido', 'La ciudad es requerida');
        return;
      }

      // Price validation - must be a positive number
      const priceValidation = FormValidation.validatePositiveNumber(propertyData.price, 'El precio');
      if (!priceValidation.isValid) {
        Toast.show('error', 'Precio inválido', priceValidation.error);
        return;
      }

      // Show loading state
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Guardando...';
      lucide.createIcons();

      try {
        let createdProperty = null;

        // Try API first if authenticated
        if (DataStore.useAPI && API.getAccessToken()) {
          createdProperty = await DataStore.createPropertyViaAPI(propertyData);

          // Upload images if any selected
          if (selectedFiles.length > 0 && createdProperty?.id) {
            saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Subiendo imágenes...';
            lucide.createIcons();

            const uploadResult = await API.uploadPropertyImages(createdProperty.id, selectedFiles);
            if (uploadResult.success) {
              // Update local cache with the new image URLs
              const propertyIndex = DataStore.properties.findIndex(p => p.id === createdProperty.id);
              if (propertyIndex !== -1 && uploadResult.allImages) {
                DataStore.properties[propertyIndex].images = uploadResult.allImages;
              }
              Toast.show('success', 'Propiedad creada', `Se subieron ${selectedFiles.length} imagen(es)`);
            } else {
              Toast.show('warning', 'Propiedad creada', 'Las imágenes no se pudieron subir');
            }
          } else {
            Toast.show('success', 'Propiedad creada', 'La propiedad se guardó correctamente');
          }
        } else {
          // Fallback to local (demo mode)
          const newProperty = {
            id: Utils.generateId('prop'),
            ...propertyData,
            status: 'disponible',
            featured: false,
            images: selectedFiles.map(f => URL.createObjectURL(f)),
            createdAt: new Date().toISOString()
          };
          DataStore.properties.unshift(newProperty);
          Toast.show('success', 'Propiedad creada (demo)', 'La propiedad se guardó localmente');
        }

        this.close();

        // Refresh properties page if visible
        if (typeof App !== 'undefined' && App.currentPage === 'propiedades') {
          App.renderPropertiesGrid();
        }
      } catch (error) {
        Toast.show('error', 'Error', error.message || 'No se pudo crear la propiedad');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i data-lucide="save"></i> Guardar Propiedad';
        lucide.createIcons();
      }
    });
  },

  // Edit Property Modal
  editProperty(propertyId) {
    const property = DataStore.getPropertyById(propertyId);
    if (!property) {
      Toast.show('error', 'Propiedad no encontrada');
      return;
    }

    const content = `
      <div class="modal__header">
        <h2 class="modal__title">Editar Propiedad</h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body form-modal">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Título</label>
            <input type="text" class="form-input" id="edit-title" value="${property.title || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tipo</label>
            <select class="form-select" id="edit-type">
              <option value="departamento" ${property.type === 'departamento' ? 'selected' : ''}>Departamento</option>
              <option value="casa" ${property.type === 'casa' ? 'selected' : ''}>Casa</option>
              <option value="ph" ${property.type === 'ph' ? 'selected' : ''}>PH</option>
              <option value="local" ${property.type === 'local' ? 'selected' : ''}>Local</option>
              <option value="oficina" ${property.type === 'oficina' ? 'selected' : ''}>Oficina</option>
              <option value="terreno" ${property.type === 'terreno' ? 'selected' : ''}>Terreno</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Operación</label>
            <select class="form-select" id="edit-operation">
              <option value="venta" ${property.operation === 'venta' ? 'selected' : ''}>Venta</option>
              <option value="alquiler" ${property.operation === 'alquiler' ? 'selected' : ''}>Alquiler</option>
              <option value="alquiler_temporario" ${property.operation === 'alquiler_temporario' ? 'selected' : ''}>Alquiler Temporario</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Estado</label>
            <select class="form-select" id="edit-status">
              <option value="disponible" ${property.status === 'disponible' ? 'selected' : ''}>Disponible</option>
              <option value="reservada" ${property.status === 'reservada' ? 'selected' : ''}>Reservada</option>
              <option value="vendida" ${property.status === 'vendida' ? 'selected' : ''}>Vendida</option>
              <option value="alquilada" ${property.status === 'alquilada' ? 'selected' : ''}>Alquilada</option>
              <option value="pausada" ${property.status === 'pausada' ? 'selected' : ''}>Pausada</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Precio</label>
            <input type="number" class="form-input" id="edit-price" value="${property.price || 0}">
          </div>
          <div class="form-group">
            <label class="form-label">Moneda</label>
            <select class="form-select" id="edit-currency">
              <option value="USD" ${property.currency === 'USD' ? 'selected' : ''}>USD</option>
              <option value="ARS" ${property.currency === 'ARS' ? 'selected' : ''}>ARS</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Dirección</label>
          <input type="text" class="form-input" id="edit-address" value="${property.address || ''}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Barrio</label>
            <input type="text" class="form-input" id="edit-neighborhood" value="${property.neighborhood || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Ciudad</label>
            <input type="text" class="form-input" id="edit-city" value="${property.city || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Dormitorios</label>
            <input type="number" class="form-input" id="edit-bedrooms" value="${property.bedrooms || 0}" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">Baños</label>
            <input type="number" class="form-input" id="edit-bathrooms" value="${property.bathrooms || 0}" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">Superficie (m²)</label>
            <input type="number" class="form-input" id="edit-area" value="${property.area || 0}" min="0">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Descripción</label>
          <textarea class="form-textarea" id="edit-description" rows="3">${property.description || ''}</textarea>
        </div>

        <!-- Images Section -->
        <div class="form-group">
          <label class="form-label">Imágenes <span class="text-muted">(máximo 10)</span></label>
          <div class="property-images-manager" id="images-manager">
            <div class="property-images-grid" id="images-grid">
              ${(property.images || []).map((img, index) => `
                <div class="property-image-item" draggable="true" data-index="${index}" data-url="${img}">
                  <img src="${API.getImageUrl(img)}" alt="Imagen ${index + 1}">
                  <div class="property-image-item__badge">${index === 0 ? 'Principal' : index + 1}</div>
                  <button type="button" class="property-image-item__delete" data-url="${img}" title="Eliminar imagen">
                    <i data-lucide="x"></i>
                  </button>
                </div>
              `).join('')}
            </div>
            <div class="property-images-upload" id="images-upload">
              <input type="file" id="images-input" multiple accept="image/*" style="display: none;">
              <div class="property-images-dropzone" id="images-dropzone">
                <i data-lucide="image-plus"></i>
                <span>Arrastrá imágenes aquí o hacé click para seleccionar</span>
                <span class="text-muted">JPG, PNG, WebP - Máx 10MB cada una</span>
              </div>
            </div>
            <div class="property-images-loading" id="images-loading" style="display: none;">
              <i data-lucide="loader-2" class="spin"></i>
              <span>Subiendo imágenes...</span>
            </div>
          </div>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-save">Guardar Cambios</button>
      </div>
    `;

    this.open(content, 'lg');

    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.close());

    // =============================================
    // IMAGE MANAGEMENT
    // =============================================

    // Track current images order (will be updated on drag & drop)
    let currentImages = [...(property.images || [])];
    const MAX_IMAGES = 10;

    // Helper function to re-render images grid
    const renderImagesGrid = () => {
      const grid = document.getElementById('images-grid');
      if (!grid) return;

      grid.innerHTML = currentImages.map((img, index) => `
        <div class="property-image-item" draggable="true" data-index="${index}" data-url="${img}">
          <img src="${API.getImageUrl(img)}" alt="Imagen ${index + 1}">
          <div class="property-image-item__badge">${index === 0 ? 'Principal' : index + 1}</div>
          <button type="button" class="property-image-item__delete" data-url="${img}" title="Eliminar imagen">
            <i data-lucide="x"></i>
          </button>
        </div>
      `).join('');

      lucide.createIcons();
      setupDragAndDrop();
      setupDeleteButtons();
    };

    // Setup delete buttons
    const setupDeleteButtons = () => {
      document.querySelectorAll('.property-image-item__delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const imageUrl = btn.dataset.url;

          if (!confirm('¿Eliminar esta imagen?')) return;

          // Show loading
          btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i>';
          lucide.createIcons();

          try {
            // Delete from server
            const result = await API.deletePropertyImage(propertyId, imageUrl);

            if (result.success) {
              // Remove from local array
              currentImages = currentImages.filter(img => img !== imageUrl);
              renderImagesGrid();
              Toast.show('success', 'Imagen eliminada');
            } else {
              Toast.show('error', 'Error', result.error || 'No se pudo eliminar la imagen');
              btn.innerHTML = '<i data-lucide="x"></i>';
              lucide.createIcons();
            }
          } catch (error) {
            Toast.show('error', 'Error', 'Error al eliminar imagen');
            btn.innerHTML = '<i data-lucide="x"></i>';
            lucide.createIcons();
          }
        });
      });
    };

    // Drag and drop for reordering
    let draggedItem = null;
    let draggedIndex = null;

    const setupDragAndDrop = () => {
      const items = document.querySelectorAll('.property-image-item');

      items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
          draggedItem = item;
          draggedIndex = parseInt(item.dataset.index);
          item.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragend', () => {
          item.classList.remove('dragging');
          draggedItem = null;
          draggedIndex = null;
          document.querySelectorAll('.property-image-item').forEach(i => i.classList.remove('drag-over'));
        });

        item.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (draggedItem && item !== draggedItem) {
            item.classList.add('drag-over');
          }
        });

        item.addEventListener('dragleave', () => {
          item.classList.remove('drag-over');
        });

        item.addEventListener('drop', (e) => {
          e.preventDefault();
          item.classList.remove('drag-over');

          if (!draggedItem || item === draggedItem) return;

          const targetIndex = parseInt(item.dataset.index);

          // Reorder the array
          const [removed] = currentImages.splice(draggedIndex, 1);
          currentImages.splice(targetIndex, 0, removed);

          // Re-render
          renderImagesGrid();
        });
      });
    };

    // File upload handling
    const dropzone = document.getElementById('images-dropzone');
    const fileInput = document.getElementById('images-input');
    const loadingEl = document.getElementById('images-loading');

    const uploadImages = async (files) => {
      if (!files || files.length === 0) return;

      // Check max images
      if (currentImages.length + files.length > MAX_IMAGES) {
        Toast.show('error', 'Límite excedido', `Máximo ${MAX_IMAGES} imágenes. Actualmente tenés ${currentImages.length}.`);
        return;
      }

      // Show loading
      if (loadingEl) loadingEl.style.display = 'flex';
      if (dropzone) dropzone.style.display = 'none';

      try {
        const result = await API.uploadPropertyImages(propertyId, files);

        if (result.success && result.images) {
          // Add new images to current array
          const newUrls = result.images.map(img => img.url);
          currentImages = [...currentImages, ...newUrls];
          renderImagesGrid();
          Toast.show('success', `${result.images.length} imagen(es) subida(s)`);
        } else {
          Toast.show('error', 'Error', result.error || 'Error al subir imágenes');
        }
      } catch (error) {
        Toast.show('error', 'Error', 'Error de conexión al subir imágenes');
      } finally {
        if (loadingEl) loadingEl.style.display = 'none';
        if (dropzone) dropzone.style.display = 'flex';
      }
    };

    // Click to select files
    dropzone?.addEventListener('click', () => fileInput?.click());

    // File input change
    fileInput?.addEventListener('change', (e) => {
      uploadImages(e.target.files);
      e.target.value = ''; // Reset input
    });

    // Drag and drop zone
    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone?.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      uploadImages(e.dataTransfer.files);
    });

    // Initialize
    lucide.createIcons();
    setupDragAndDrop();
    setupDeleteButtons();

    // =============================================
    // SAVE HANDLER
    // =============================================

    document.getElementById('modal-save')?.addEventListener('click', async () => {
      const saveBtn = document.getElementById('modal-save');

      // Collect updated data (including reordered images)
      const updates = {
        title: document.getElementById('edit-title')?.value.trim(),
        type: document.getElementById('edit-type')?.value,
        operation: document.getElementById('edit-operation')?.value,
        status: document.getElementById('edit-status')?.value,
        price: parseFloat(document.getElementById('edit-price')?.value) || 0,
        currency: document.getElementById('edit-currency')?.value,
        address: document.getElementById('edit-address')?.value.trim(),
        neighborhood: document.getElementById('edit-neighborhood')?.value.trim(),
        city: document.getElementById('edit-city')?.value.trim(),
        bedrooms: parseInt(document.getElementById('edit-bedrooms')?.value) || 0,
        bathrooms: parseInt(document.getElementById('edit-bathrooms')?.value) || 0,
        area: parseInt(document.getElementById('edit-area')?.value) || 0,
        description: document.getElementById('edit-description')?.value.trim(),
        images: currentImages // Include reordered images
      };

      // Validate required fields
      if (!updates.title) {
        Toast.show('error', 'Error', 'El título es requerido');
        return;
      }
      if (!updates.address) {
        Toast.show('error', 'Error', 'La dirección es requerida');
        return;
      }
      if (!updates.city) {
        Toast.show('error', 'Error', 'La ciudad es requerida');
        return;
      }

      // Show loading state
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Guardando...';
      lucide.createIcons();

      try {
        // Try API first if authenticated
        if (DataStore.useAPI && API.getAccessToken()) {
          await DataStore.updatePropertyViaAPI(propertyId, updates);
          Toast.show('success', 'Propiedad actualizada', 'Los cambios se guardaron correctamente');
        } else {
          // Fallback to local (demo mode)
          DataStore.updateProperty({ id: propertyId, ...updates });
          Toast.show('success', 'Propiedad actualizada (demo)', 'Los cambios se guardaron localmente');
        }

        this.close();

        // Refresh properties page if visible
        if (typeof App !== 'undefined' && App.currentPage === 'propiedades') {
          App.renderPropertiesGrid();
        }

        // Close panel if open
        if (typeof Panels !== 'undefined' && Panels.currentPropertyId === propertyId) {
          Panels.close();
        }
      } catch (error) {
        Toast.show('error', 'Error', error.message || 'No se pudo actualizar la propiedad');
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Guardar Cambios';
      }
    });
  },

  // New Event for Property - Pre-selects the property
  newEventForProperty(propertyId) {
    const property = DataStore.getPropertyById(propertyId);
    if (!property) {
      Toast.show('error', 'Propiedad no encontrada');
      return;
    }

    const content = `
      <div class="modal__header">
        <h2 class="modal__title">Agendar Visita</h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body form-modal">
        <!-- Property Preview -->
        <div class="event-property-preview">
          <div class="event-property-preview__image">
            <img src="${Components.getPropertyImage(property)}" alt="${property.title}">
          </div>
          <div class="event-property-preview__info">
            <span class="event-property-preview__title">${property.title}</span>
            <span class="event-property-preview__address">${property.address}, ${property.neighborhood}</span>
          </div>
        </div>

        <div class="event-type-selector">
          ${DataStore.eventTypes.map((t, i) => `
            <button type="button" class="event-type-btn ${t.id === 'visita' ? 'active' : ''}" data-type="${t.id}">
              <i data-lucide="${t.icon}" class="event-type-btn__icon"></i>
              <span class="event-type-btn__label">${t.name}</span>
            </button>
          `).join('')}
        </div>
        <div class="form-group">
          <label class="form-label">Título</label>
          <input type="text" class="form-input" id="event-title" value="Visita - ${property.title}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Fecha</label>
            <input type="date" class="form-input" id="event-date" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group">
            <label class="form-label">Hora Inicio</label>
            <input type="time" class="form-input" id="event-start" value="10:00">
          </div>
          <div class="form-group">
            <label class="form-label">Hora Fin</label>
            <input type="time" class="form-input" id="event-end" value="11:00">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Lead / Cliente</label>
          <select class="form-select" id="event-lead">
            <option value="">Seleccionar...</option>
            ${DataStore.leads.map(l => `
              <option value="${l.id}">${l.name}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Ubicación</label>
          <input type="text" class="form-input" id="event-location" value="${property.address}, ${property.neighborhood}">
        </div>
        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-textarea" id="event-notes" rows="2" placeholder="Notas adicionales..."></textarea>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-save">
          <i data-lucide="calendar-plus"></i>
          Agendar Visita
        </button>
      </div>
    `;

    this.open(content, 'lg');

    // Event type selector
    const typeButtons = this.container.querySelectorAll('.event-type-btn');
    typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        typeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.close());
    document.getElementById('modal-save')?.addEventListener('click', async () => {
      const type = this.container.querySelector('.event-type-btn.active')?.dataset.type || 'visita';
      const title = document.getElementById('event-title')?.value?.trim();
      const date = document.getElementById('event-date')?.value;
      const startTime = document.getElementById('event-start')?.value;
      const endTime = document.getElementById('event-end')?.value;
      const leadId = document.getElementById('event-lead')?.value;
      const location = document.getElementById('event-location')?.value?.trim();
      const notes = document.getElementById('event-notes')?.value?.trim();

      // Validation
      if (!title || !date || !startTime || !endTime) {
        Toast.show('error', 'Campos requeridos', 'Completá título, fecha y horarios');
        return;
      }

      try {
        const saveBtn = document.getElementById('modal-save');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Guardando...';

        await DataStore.createEventViaAPI({
          type,
          title,
          date,
          startTime,
          endTime,
          propertyId: propertyId || undefined,
          leadId: leadId || undefined,
          location: location || undefined,
          notes: notes || undefined,
          status: 'pendiente'
        });

        Toast.show('success', 'Visita agendada correctamente');
        this.close();

        // Refresh calendar if visible
        if (typeof App !== 'undefined' && App.currentView === 'calendario') {
          App.views.calendario.render();
        }
      } catch (error) {
        Toast.show('error', 'Error', error.message);
        const saveBtn = document.getElementById('modal-save');
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i data-lucide="calendar-plus"></i> Agendar Visita';
        }
      }
    });
  },

  // New Lead Modal
  newLead() {
    const content = `
      <div class="modal__header">
        <h2 class="modal__title">Nuevo Lead</h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body form-modal">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nombre Completo</label>
            <input type="text" class="form-input" placeholder="Nombre y apellido">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" placeholder="email@ejemplo.com">
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input type="tel" class="form-input" placeholder="+54 9 11 1234-5678">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Fuente</label>
            <select class="form-select">
              <option value="referido">Referido</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="google">Google</option>
              <option value="directo">Directo</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Asignar a</label>
            <select class="form-select">
              ${DataStore.users.filter(u => u.role === 'agente').map(u => `
                <option value="${u.id}">${u.name}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Propiedad de Interés</label>
          <select class="form-select">
            <option value="">Seleccionar propiedad...</option>
            ${DataStore.properties.map(p => `
              <option value="${p.id}">${p.title} - ${p.neighborhood}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Presupuesto Mínimo</label>
            <input type="number" class="form-input" placeholder="0">
          </div>
          <div class="form-group">
            <label class="form-label">Presupuesto Máximo</label>
            <input type="number" class="form-input" placeholder="0">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-textarea" rows="3" placeholder="Notas adicionales..."></textarea>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-save">Guardar Lead</button>
      </div>
    `;

    this.open(content, 'md');

    // Setup modal buttons with actual save logic
    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.close());
    document.getElementById('modal-save')?.addEventListener('click', async () => {
      const inputs = document.querySelectorAll('.modal .form-input, .modal .form-select, .modal .form-textarea');
      const [nameInput, emailInput, phoneInput, sourceSelect, assignedSelect, propertySelect, budgetMinInput, budgetMaxInput, notesTextarea] = inputs;

      const name = nameInput?.value?.trim();
      if (!name) {
        Toast.show('error', 'Campo requerido', 'El nombre es requerido');
        return;
      }

      // Email validation (optional but must be valid if provided)
      const email = emailInput?.value?.trim();
      if (email) {
        const emailValidation = FormValidation.validateEmail(email);
        if (!emailValidation.isValid) {
          Toast.show('error', 'Email inválido', emailValidation.error);
          return;
        }
      }

      // Budget validation (min must be less than max)
      const budgetMin = budgetMinInput?.value ? parseFloat(budgetMinInput.value) : null;
      const budgetMax = budgetMaxInput?.value ? parseFloat(budgetMaxInput.value) : null;

      if (budgetMin !== null && budgetMax !== null) {
        const budgetValidation = FormValidation.validateBudgetRange(budgetMin, budgetMax);
        if (!budgetValidation.isValid) {
          Toast.show('error', 'Presupuesto inválido', budgetValidation.error);
          return;
        }
      }

      const leadData = {
        name,
        email: email || null,
        phone: phoneInput?.value?.trim() || null,
        source: sourceSelect?.value || 'referido',
        assignedTo: assignedSelect?.value || null,
        property: propertySelect?.value || null,
        budgetMin: budgetMin,
        budgetMax: budgetMax,
        notes: notesTextarea?.value?.trim() || null
      };

      const saveBtn = document.getElementById('modal-save');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Guardando...';
      lucide.createIcons();

      try {
        if (DataStore.useAPI) {
          await DataStore.createLeadViaAPI(leadData);
        } else {
          // Fallback to local storage for demo mode
          const newLead = {
            id: Utils.generateId('lead'),
            ...leadData,
            stage: 'nuevo',
            score: 0,
            createdAt: new Date().toISOString()
          };
          DataStore.leads.unshift(newLead);
        }

        Toast.show('success', 'Lead creado correctamente');
        this.close();

        // Refresh CRM if on that page
        if (typeof App !== 'undefined' && App.currentPage === 'crm') {
          App.renderCRMPipeline();
        }
      } catch (error) {
        Toast.show('error', 'Error', error.message || 'No se pudo crear el lead');
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Guardar Lead';
      }
    });
  },

  // Edit Lead Modal
  editLead(leadId) {
    const lead = DataStore.getLeadById(leadId);
    if (!lead) {
      Toast.show('error', 'Lead no encontrado');
      return;
    }

    const content = `
      <div class="modal__header">
        <h2 class="modal__title">Editar Lead</h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body form-modal">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nombre Completo</label>
            <input type="text" class="form-input" id="edit-lead-name" value="${lead.name || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="edit-lead-email" value="${lead.email || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input type="tel" class="form-input" id="edit-lead-phone" value="${lead.phone || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Fuente</label>
            <select class="form-select" id="edit-lead-source">
              <option value="referido" ${lead.source === 'referido' ? 'selected' : ''}>Referido</option>
              <option value="instagram" ${lead.source === 'instagram' ? 'selected' : ''}>Instagram</option>
              <option value="facebook" ${lead.source === 'facebook' ? 'selected' : ''}>Facebook</option>
              <option value="google" ${lead.source === 'google' ? 'selected' : ''}>Google</option>
              <option value="linkedin" ${lead.source === 'linkedin' ? 'selected' : ''}>LinkedIn</option>
              <option value="directo" ${lead.source === 'directo' ? 'selected' : ''}>Directo</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Etapa</label>
            <select class="form-select" id="edit-lead-stage">
              ${DataStore.leadStages.map(s => `
                <option value="${s.id}" ${lead.stage === s.id ? 'selected' : ''}>${s.name}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Asignar a</label>
            <select class="form-select" id="edit-lead-agent">
              ${DataStore.users.filter(u => u.role === 'agente').map(u => `
                <option value="${u.id}" ${lead.assignedTo === u.id ? 'selected' : ''}>${u.name}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Score</label>
            <input type="number" class="form-input" id="edit-lead-score" value="${lead.score || 0}" min="0" max="100">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Propiedad de Interés</label>
          <select class="form-select" id="edit-lead-property">
            <option value="">Sin propiedad asignada</option>
            ${DataStore.properties.map(p => `
              <option value="${p.id}" ${lead.property?.id === p.id ? 'selected' : ''}>${p.title} - ${p.neighborhood}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Presupuesto Mínimo</label>
            <input type="number" class="form-input" id="edit-lead-budget-min" value="${lead.budget?.min || 0}">
          </div>
          <div class="form-group">
            <label class="form-label">Presupuesto Máximo</label>
            <input type="number" class="form-input" id="edit-lead-budget-max" value="${lead.budget?.max || 0}">
          </div>
          <div class="form-group">
            <label class="form-label">Moneda</label>
            <select class="form-select" id="edit-lead-currency">
              <option value="USD" ${lead.budget?.currency === 'USD' ? 'selected' : ''}>USD</option>
              <option value="ARS" ${lead.budget?.currency === 'ARS' ? 'selected' : ''}>ARS</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Intereses</label>
          <input type="text" class="form-input" id="edit-lead-interests"
                 value="${lead.interests?.join(', ') || ''}"
                 placeholder="departamento, ph, casa (separados por coma)">
        </div>
        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-textarea" id="edit-lead-notes" rows="3">${lead.notes || ''}</textarea>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-save">Guardar Cambios</button>
      </div>
    `;

    this.open(content, 'lg');

    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.close());
    document.getElementById('modal-save')?.addEventListener('click', async () => {
      const name = document.getElementById('edit-lead-name')?.value?.trim();
      if (!name) {
        Toast.show('error', 'Error', 'El nombre es requerido');
        return;
      }

      const propertyId = document.getElementById('edit-lead-property')?.value;
      const property = propertyId ? DataStore.getPropertyById(propertyId) : null;

      const updates = {
        name,
        email: document.getElementById('edit-lead-email')?.value?.trim() || null,
        phone: document.getElementById('edit-lead-phone')?.value?.trim() || null,
        source: document.getElementById('edit-lead-source')?.value,
        stage: document.getElementById('edit-lead-stage')?.value,
        assignedTo: document.getElementById('edit-lead-agent')?.value,
        score: parseInt(document.getElementById('edit-lead-score')?.value) || 0,
        property: propertyId || null,
        budgetMin: parseFloat(document.getElementById('edit-lead-budget-min')?.value) || null,
        budgetMax: parseFloat(document.getElementById('edit-lead-budget-max')?.value) || null,
        budgetCurrency: document.getElementById('edit-lead-currency')?.value,
        interests: document.getElementById('edit-lead-interests')?.value
          .split(',')
          .map(i => i.trim())
          .filter(i => i),
        notes: document.getElementById('edit-lead-notes')?.value?.trim() || null
      };

      const saveBtn = document.getElementById('modal-save');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Guardando...';
      lucide.createIcons();

      try {
        if (DataStore.useAPI) {
          await DataStore.updateLeadViaAPI(leadId, updates);
        } else {
          // Fallback to local update for demo mode
          const updatedLead = {
            ...lead,
            ...updates,
            property: property ? { id: property.id, title: property.title } : null
          };
          DataStore.updateLead(updatedLead);
        }

        Toast.show('success', 'Lead actualizado correctamente');
        this.close();

        // Refresh CRM if on that page
        if (typeof App !== 'undefined' && App.currentPage === 'crm') {
          App.renderCRMPipeline();
        }

        // Close panel if open
        if (typeof Panels !== 'undefined') {
          Panels.close();
        }
      } catch (error) {
        Toast.show('error', 'Error', error.message || 'No se pudo actualizar el lead');
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Guardar Cambios';
      }
    });
  },

  // New Contact Modal
  newContact() {
    const content = `
      <div class="modal__header">
        <h2 class="modal__title">Nuevo Contacto</h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body form-modal">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nombre Completo</label>
            <input type="text" class="form-input" id="contact-name" placeholder="Nombre y apellido">
          </div>
          <div class="form-group">
            <label class="form-label">Tipo</label>
            <select class="form-select" id="contact-type">
              <option value="propietario">Propietario</option>
              <option value="inquilino">Inquilino</option>
              <option value="comprador_potencial">Comprador Potencial</option>
              <option value="inversor">Inversor</option>
              <option value="constructora">Constructora</option>
              <option value="colega">Colega</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="contact-email" placeholder="email@ejemplo.com">
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input type="tel" class="form-input" id="contact-phone" placeholder="+54 9 11 1234-5678">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Dirección</label>
          <input type="text" class="form-input" id="contact-address" placeholder="Dirección completa">
        </div>
        <div class="form-group" style="position: relative;">
          <label class="form-label">Referido por</label>
          <input type="text" class="form-input" id="contact-referred-by" placeholder="Nombre de quien refirió" autocomplete="off">
          <div id="referred-by-suggestions" class="autocomplete-suggestions" style="display: none;"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-textarea" id="contact-notes" rows="3" placeholder="Notas adicionales..."></textarea>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-save">Guardar Contacto</button>
      </div>
    `;

    this.open(content, 'md');

    // Setup autocomplete for "Referido por"
    const referredByInput = document.getElementById('contact-referred-by');
    const suggestionsDiv = document.getElementById('referred-by-suggestions');

    if (referredByInput && suggestionsDiv) {
      referredByInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        if (query.length < 2) {
          suggestionsDiv.style.display = 'none';
          return;
        }

        // Filter contacts by name
        const matches = DataStore.contacts
          .filter(c => c.name.toLowerCase().includes(query))
          .slice(0, 5);

        if (matches.length === 0) {
          suggestionsDiv.style.display = 'none';
          return;
        }

        suggestionsDiv.innerHTML = matches.map(c => `
          <div class="autocomplete-item" data-name="${c.name}">
            <span class="autocomplete-name">${c.name}</span>
            ${c.type ? `<span class="autocomplete-type">${c.type}</span>` : ''}
          </div>
        `).join('');
        suggestionsDiv.style.display = 'block';

        // Handle click on suggestion
        suggestionsDiv.querySelectorAll('.autocomplete-item').forEach(item => {
          item.addEventListener('click', () => {
            referredByInput.value = item.dataset.name;
            suggestionsDiv.style.display = 'none';
          });
        });
      });

      // Hide suggestions when clicking outside
      document.addEventListener('click', (e) => {
        if (!referredByInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
          suggestionsDiv.style.display = 'none';
        }
      });
    }

    // Setup save button
    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.close());
    document.getElementById('modal-save')?.addEventListener('click', async () => {
      const name = document.getElementById('contact-name')?.value?.trim();
      const type = document.getElementById('contact-type')?.value;
      const email = document.getElementById('contact-email')?.value?.trim();
      const phone = document.getElementById('contact-phone')?.value?.trim();
      const address = document.getElementById('contact-address')?.value?.trim();
      const referredBy = document.getElementById('contact-referred-by')?.value?.trim();
      const notes = document.getElementById('contact-notes')?.value?.trim();

      // Validation
      if (!name) {
        Toast.show('error', 'Campo requerido', 'El nombre es requerido');
        return;
      }

      // Email validation (optional)
      if (email) {
        const emailValidation = FormValidation.validateEmail(email);
        if (!emailValidation.isValid) {
          Toast.show('error', 'Email inválido', emailValidation.error);
          return;
        }
      }

      const saveBtn = document.getElementById('modal-save');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Guardando...';
      if (window.lucide) lucide.createIcons();

      try {
        if (DataStore.useAPI && API.getAccessToken()) {
          await DataStore.createContactViaAPI({
            name,
            type,
            email: email || null,
            phone: phone || null,
            address: address || null,
            referredBy: referredBy || null,
            notes: notes || null
          });
        } else {
          // Fallback to local (demo mode)
          const newContact = {
            id: Utils.generateId('contact'),
            name,
            type,
            email,
            phone,
            address,
            referredBy,
            notes,
            createdAt: new Date().toISOString()
          };
          DataStore.contacts.unshift(newContact);
        }

        Toast.show('success', 'Contacto creado correctamente');
        this.close();

        // Refresh contacts page if visible
        if (typeof App !== 'undefined' && App.currentPage === 'contactos') {
          App.navigate('contactos');
        }
      } catch (error) {
        Toast.show('error', 'Error', error.message || 'No se pudo crear el contacto');
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Guardar Contacto';
      }
    });
  },

  // Edit Contact Modal
  editContact(contactId) {
    const contact = DataStore.getContactById(contactId);
    if (!contact) {
      Toast.show('error', 'Contacto no encontrado');
      return;
    }

    const content = `
      <div class="modal__header">
        <h2 class="modal__title">Editar Contacto</h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body form-modal">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nombre Completo</label>
            <input type="text" class="form-input" id="contact-name" placeholder="Nombre y apellido" value="${contact.name || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Tipo</label>
            <select class="form-select" id="contact-type">
              <option value="propietario" ${contact.type === 'propietario' ? 'selected' : ''}>Propietario</option>
              <option value="inquilino" ${contact.type === 'inquilino' ? 'selected' : ''}>Inquilino</option>
              <option value="comprador_potencial" ${contact.type === 'comprador_potencial' ? 'selected' : ''}>Comprador Potencial</option>
              <option value="inversor" ${contact.type === 'inversor' ? 'selected' : ''}>Inversor</option>
              <option value="constructora" ${contact.type === 'constructora' ? 'selected' : ''}>Constructora</option>
              <option value="colega" ${contact.type === 'colega' ? 'selected' : ''}>Colega</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="contact-email" placeholder="email@ejemplo.com" value="${contact.email || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input type="tel" class="form-input" id="contact-phone" placeholder="+54 9 11 1234-5678" value="${contact.phone || ''}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Dirección</label>
          <input type="text" class="form-input" id="contact-address" placeholder="Dirección completa" value="${contact.address || ''}">
        </div>
        <div class="form-group" style="position: relative;">
          <label class="form-label">Referido por</label>
          <input type="text" class="form-input" id="contact-referred-by" placeholder="Nombre de quien refirió" autocomplete="off" value="${contact.referredBy || ''}">
          <div id="referred-by-suggestions" class="autocomplete-suggestions" style="display: none;"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-textarea" id="contact-notes" rows="3" placeholder="Notas adicionales...">${contact.notes || ''}</textarea>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-save">Guardar Cambios</button>
      </div>
    `;

    this.open(content, 'md');

    // Setup autocomplete for "Referido por"
    const referredByInput = document.getElementById('contact-referred-by');
    const suggestionsDiv = document.getElementById('referred-by-suggestions');

    if (referredByInput && suggestionsDiv) {
      referredByInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        if (query.length < 2) {
          suggestionsDiv.style.display = 'none';
          return;
        }

        // Filter contacts by name (exclude current contact)
        const matches = DataStore.contacts
          .filter(c => c.id !== contactId && c.name.toLowerCase().includes(query))
          .slice(0, 5);

        if (matches.length === 0) {
          suggestionsDiv.style.display = 'none';
          return;
        }

        suggestionsDiv.innerHTML = matches.map(c => `
          <div class="autocomplete-item" data-name="${c.name}">
            <span class="autocomplete-name">${c.name}</span>
            ${c.type ? `<span class="autocomplete-type">${c.type}</span>` : ''}
          </div>
        `).join('');
        suggestionsDiv.style.display = 'block';

        // Handle click on suggestion
        suggestionsDiv.querySelectorAll('.autocomplete-item').forEach(item => {
          item.addEventListener('click', () => {
            referredByInput.value = item.dataset.name;
            suggestionsDiv.style.display = 'none';
          });
        });
      });

      // Hide suggestions when clicking outside
      document.addEventListener('click', (e) => {
        if (!referredByInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
          suggestionsDiv.style.display = 'none';
        }
      });
    }

    // Setup save button
    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.close());
    document.getElementById('modal-save')?.addEventListener('click', async () => {
      const name = document.getElementById('contact-name')?.value?.trim();
      const type = document.getElementById('contact-type')?.value;
      const email = document.getElementById('contact-email')?.value?.trim();
      const phone = document.getElementById('contact-phone')?.value?.trim();
      const address = document.getElementById('contact-address')?.value?.trim();
      const referredBy = document.getElementById('contact-referred-by')?.value?.trim();
      const notes = document.getElementById('contact-notes')?.value?.trim();

      // Validation
      if (!name) {
        Toast.show('error', 'Campo requerido', 'El nombre es requerido');
        return;
      }

      // Email validation (optional)
      if (email) {
        const emailValidation = FormValidation.validateEmail(email);
        if (!emailValidation.isValid) {
          Toast.show('error', 'Email inválido', emailValidation.error);
          return;
        }
      }

      const saveBtn = document.getElementById('modal-save');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Guardando...';
      if (window.lucide) lucide.createIcons();

      try {
        if (DataStore.useAPI && API.getAccessToken()) {
          await DataStore.updateContactViaAPI(contactId, {
            name,
            type,
            email: email || null,
            phone: phone || null,
            address: address || null,
            referredBy: referredBy || null,
            notes: notes || null
          });
        } else {
          // Fallback to local (demo mode)
          const contactIndex = DataStore.contacts.findIndex(c => c.id === contactId);
          if (contactIndex !== -1) {
            DataStore.contacts[contactIndex] = {
              ...DataStore.contacts[contactIndex],
              name,
              type,
              email,
              phone,
              address,
              referredBy,
              notes,
              updatedAt: new Date().toISOString()
            };
          }
        }

        Toast.show('success', 'Contacto actualizado correctamente');
        this.close();

        // Refresh contacts page if visible
        if (typeof App !== 'undefined' && App.currentPage === 'contactos') {
          App.navigate('contactos');
        }
      } catch (error) {
        Toast.show('error', 'Error', error.message || 'No se pudo actualizar el contacto');
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Guardar Cambios';
      }
    });
  },

  // New Transaction Modal
  newTransaction() {
    const content = `
      <div class="modal__header">
        <h2 class="modal__title">Nueva Transacción</h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body form-modal">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tipo</label>
            <select class="form-select" id="txn-type">
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Categoría</label>
            <select class="form-select" id="txn-category">
              <option value="comision_venta">Comisión Venta</option>
              <option value="comision_alquiler">Comisión Alquiler</option>
              <option value="administracion">Administración</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Monto</label>
            <input type="number" class="form-input" placeholder="0">
          </div>
          <div class="form-group">
            <label class="form-label">Moneda</label>
            <select class="form-select">
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input type="date" class="form-input" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label class="form-label">Descripción</label>
          <input type="text" class="form-input" placeholder="Descripción del movimiento">
        </div>
        <div class="form-group">
          <label class="form-label">Propiedad (opcional)</label>
          <select class="form-select">
            <option value="">Sin propiedad asociada</option>
            ${DataStore.properties.map(p => `
              <option value="${p.id}">${p.title}</option>
            `).join('')}
          </select>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-save">Registrar</button>
      </div>
    `;

    this.open(content, 'md');
    this.setupModalButtons(() => {
      Toast.show('success', 'Transacción registrada correctamente');
    });
  },

  // New Event Modal
  newEvent() {
    const content = `
      <div class="modal__header">
        <h2 class="modal__title">Nuevo Evento</h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body form-modal">
        <div class="event-type-selector">
          ${DataStore.eventTypes.map((t, i) => `
            <button type="button" class="event-type-btn ${i === 0 ? 'active' : ''}" data-type="${t.id}">
              <i data-lucide="${t.icon}" class="event-type-btn__icon"></i>
              <span class="event-type-btn__label">${t.name}</span>
            </button>
          `).join('')}
        </div>
        <div class="form-group">
          <label class="form-label">Título</label>
          <input type="text" class="form-input" placeholder="Título del evento">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Fecha</label>
            <input type="date" class="form-input" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group">
            <label class="form-label">Hora Inicio</label>
            <input type="time" class="form-input" value="10:00">
          </div>
          <div class="form-group">
            <label class="form-label">Hora Fin</label>
            <input type="time" class="form-input" value="11:00">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Lead (opcional)</label>
          <select class="form-select">
            <option value="">Seleccionar lead...</option>
            ${DataStore.leads.map(l => `
              <option value="${l.id}">${l.name}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Propiedad (opcional)</label>
          <select class="form-select">
            <option value="">Seleccionar propiedad...</option>
            ${DataStore.properties.map(p => `
              <option value="${p.id}">${p.title}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Ubicación</label>
          <input type="text" class="form-input" placeholder="Dirección o lugar">
        </div>
        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-textarea" rows="2" placeholder="Notas adicionales..."></textarea>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-save">Crear Evento</button>
      </div>
    `;

    this.open(content, 'lg');

    // Event type selector
    const typeButtons = this.container.querySelectorAll('.event-type-btn');
    typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        typeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    this.setupModalButtons(() => {
      Toast.show('success', 'Evento creado correctamente');
    });
  },

  // New Document Modal
  newDocument() {
    const content = `
      <div class="modal__header">
        <h2 class="modal__title">Nuevo Documento</h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body form-modal">
        <div class="form-group">
          <label class="form-label">Tipo de Documento</label>
          <select class="form-select">
            <option value="contrato_alquiler">Contrato de Alquiler</option>
            <option value="contrato_venta">Boleto de Compraventa</option>
            <option value="reserva">Contrato de Reserva</option>
            <option value="cesion">Cesión de Derechos</option>
            <option value="poder">Poder</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Nombre del Documento</label>
          <input type="text" class="form-input" placeholder="Ej: Contrato Alquiler - Juan Pérez">
        </div>
        <div class="form-group">
          <label class="form-label">Propiedad Relacionada</label>
          <select class="form-select">
            <option value="">Seleccionar propiedad...</option>
            ${DataStore.properties.map(p => `
              <option value="${p.id}">${p.title}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Contacto Relacionado</label>
          <select class="form-select">
            <option value="">Seleccionar contacto...</option>
            ${DataStore.contacts.map(c => `
              <option value="${c.id}">${c.name}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-section">
          <h4 class="form-section__title">Archivo</h4>
          <div class="upload-zone" id="doc-upload-zone">
            <div class="upload-zone__icon">
              <i data-lucide="file-text"></i>
            </div>
            <p class="upload-zone__title">Subir documento</p>
            <p class="upload-zone__subtitle">o generar con IA</p>
          </div>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--secondary">
          <i data-lucide="sparkles"></i>
          Generar con IA
        </button>
        <button class="btn btn--primary" id="modal-save">Guardar</button>
      </div>
    `;

    this.open(content, 'md');
    this.setupModalButtons(() => {
      Toast.show('success', 'Documento guardado correctamente');
    });
  },

  // New Rental Contract Modal (Administraciones)
  newRental() {
    const rentalProperties = DataStore.getProperties({ operation: 'alquiler' });
    const propietarios = DataStore.getContacts({ type: 'propietario' });
    const inquilinos = DataStore.getContacts({ type: 'inquilino' });
    const frequencies = DataStore.adjustmentFrequencies || [];

    const content = `
      <div class="modal__header">
        <h2 class="modal__title">Nuevo Contrato de Alquiler</h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body form-modal">
        <div class="form-section">
          <h4 class="form-section__title">Propiedad y Partes</h4>

          <div class="form-group">
            <label class="form-label">Propiedad</label>
            <select class="form-select" id="rental-property">
              <option value="">Seleccionar propiedad...</option>
              ${rentalProperties.map(p => `
                <option value="${p.id}" data-owner="${p.owner?.id || ''}">${p.title} - ${p.address}</option>
              `).join('')}
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Propietario</label>
              <select class="form-select" id="rental-propietario">
                <option value="">Seleccionar propietario...</option>
                ${propietarios.map(c => `
                  <option value="${c.id}">${c.name}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Inquilino</label>
              <select class="form-select" id="rental-inquilino">
                <option value="">Seleccionar inquilino...</option>
                ${inquilinos.map(c => `
                  <option value="${c.id}">${c.name}</option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h4 class="form-section__title">Vigencia del Contrato</h4>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Fecha de Inicio</label>
              <input type="date" class="form-input" id="rental-start" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label class="form-label">Fecha de Fin</label>
              <input type="date" class="form-input" id="rental-end">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h4 class="form-section__title">Condiciones Económicas</h4>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Alquiler Mensual</label>
              <input type="number" class="form-input" id="rental-amount" placeholder="0">
            </div>
            <div class="form-group">
              <label class="form-label">Moneda</label>
              <select class="form-select" id="rental-currency">
                <option value="ARS">ARS (Pesos)</option>
                <option value="USD">USD (Dólares)</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Frecuencia de Ajuste</label>
              <select class="form-select" id="rental-frequency">
                ${frequencies.map(f => `
                  <option value="${f.id}" ${f.id === 'trimestral' ? 'selected' : ''}>${f.name}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Porcentaje de Ajuste (%)</label>
              <input type="number" class="form-input" id="rental-percentage" placeholder="15" value="15">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Día de Pago</label>
              <input type="number" class="form-input" id="rental-payment-day" min="1" max="31" placeholder="10" value="10">
            </div>
            <div class="form-group">
              <label class="form-label">Depósito</label>
              <input type="number" class="form-input" id="rental-deposit" placeholder="0">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h4 class="form-section__title">Garantes <span class="required">*</span></h4>

          <div id="guarantors-container">
            <!-- Garante 1 (obligatorio, no se puede eliminar) -->
            <div class="guarantor-item" data-index="0">
              <div class="guarantor-item__header">
                <span class="guarantor-item__title">Garante 1</span>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Nombre Completo <span class="required">*</span></label>
                  <input type="text" class="form-input guarantor-name" placeholder="Nombre completo" required>
                </div>
                <div class="form-group">
                  <label class="form-label">DNI/CUIT <span class="required">*</span></label>
                  <input type="text" class="form-input guarantor-dni" placeholder="XX.XXX.XXX" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Teléfono <span class="required">*</span></label>
                  <input type="tel" class="form-input guarantor-phone" placeholder="+54 9 11 1234-5678" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Email <span class="required">*</span></label>
                  <input type="email" class="form-input guarantor-email" placeholder="email@ejemplo.com" required>
                </div>
              </div>
            </div>
          </div>

          <button type="button" class="btn btn--outline btn--sm" id="add-guarantor" style="margin-top: 0.75rem;">
            <i data-lucide="plus"></i>
            Agregar Garante
          </button>
        </div>

        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-textarea" id="rental-notes" rows="2" placeholder="Notas adicionales sobre el contrato..."></textarea>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-save">Crear Contrato</button>
      </div>
    `;

    this.open(content, 'lg');

    // Auto-select owner when property is selected
    const propertySelect = document.getElementById('rental-property');
    const propietarioSelect = document.getElementById('rental-propietario');

    propertySelect?.addEventListener('change', (e) => {
      const selectedOption = e.target.selectedOptions[0];
      const ownerId = selectedOption?.dataset?.owner;
      if (ownerId && propietarioSelect) {
        propietarioSelect.value = ownerId;
      }
    });

    // Auto-calculate end date (2 years from start by default)
    const startInput = document.getElementById('rental-start');
    const endInput = document.getElementById('rental-end');

    startInput?.addEventListener('change', (e) => {
      const startDate = new Date(e.target.value);
      startDate.setFullYear(startDate.getFullYear() + 2);
      if (endInput) {
        endInput.value = startDate.toISOString().split('T')[0];
      }
    });

    // Trigger initial end date calculation
    if (startInput && startInput.value) {
      startInput.dispatchEvent(new Event('change'));
    }

    // Guarantors dynamic management
    let guarantorCount = 1;
    const guarantorsContainer = document.getElementById('guarantors-container');
    const addGuarantorBtn = document.getElementById('add-guarantor');

    const createGuarantorHTML = (index) => `
      <div class="guarantor-item" data-index="${index}">
        <div class="guarantor-item__header">
          <span class="guarantor-item__title">Garante ${index + 1}</span>
          <button type="button" class="btn btn--ghost btn--sm remove-guarantor" title="Eliminar garante">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nombre Completo <span class="required">*</span></label>
            <input type="text" class="form-input guarantor-name" placeholder="Nombre completo" required>
          </div>
          <div class="form-group">
            <label class="form-label">DNI/CUIT <span class="required">*</span></label>
            <input type="text" class="form-input guarantor-dni" placeholder="XX.XXX.XXX" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Teléfono <span class="required">*</span></label>
            <input type="tel" class="form-input guarantor-phone" placeholder="+54 9 11 1234-5678" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email <span class="required">*</span></label>
            <input type="email" class="form-input guarantor-email" placeholder="email@ejemplo.com" required>
          </div>
        </div>
      </div>
    `;

    const updateGuarantorTitles = () => {
      const items = guarantorsContainer.querySelectorAll('.guarantor-item');
      items.forEach((item, idx) => {
        const title = item.querySelector('.guarantor-item__title');
        if (title) title.textContent = `Garante ${idx + 1}`;
        item.dataset.index = idx;
      });
    };

    addGuarantorBtn?.addEventListener('click', () => {
      const newGuarantor = document.createElement('div');
      newGuarantor.innerHTML = createGuarantorHTML(guarantorCount);
      const guarantorElement = newGuarantor.firstElementChild;
      guarantorsContainer.appendChild(guarantorElement);
      guarantorCount++;
      lucide.createIcons();

      // Focus on the new guarantor's name field
      guarantorElement.querySelector('.guarantor-name')?.focus();
    });

    guarantorsContainer?.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.remove-guarantor');
      if (removeBtn) {
        const item = removeBtn.closest('.guarantor-item');
        if (item) {
          item.remove();
          guarantorCount--;
          updateGuarantorTitles();
        }
      }
    });

    // Validation function for guarantors
    const validateGuarantors = () => {
      const firstGuarantor = guarantorsContainer.querySelector('.guarantor-item');
      if (!firstGuarantor) {
        Toast.show('error', 'Error', 'Debe agregar al menos un garante');
        return false;
      }

      const name = firstGuarantor.querySelector('.guarantor-name')?.value?.trim();
      const dni = firstGuarantor.querySelector('.guarantor-dni')?.value?.trim();
      const phone = firstGuarantor.querySelector('.guarantor-phone')?.value?.trim();
      const email = firstGuarantor.querySelector('.guarantor-email')?.value?.trim();

      if (!name || !dni || !phone || !email) {
        Toast.show('error', 'Campos incompletos', 'Complete todos los campos del primer garante');
        return false;
      }

      return true;
    };

    // Setup modal buttons with validation
    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.close());
    document.getElementById('modal-save')?.addEventListener('click', async () => {
      // Get form values
      const propertyId = document.getElementById('rental-property')?.value;
      const propietarioId = document.getElementById('rental-propietario')?.value;
      const inquilinoId = document.getElementById('rental-inquilino')?.value;
      const startDate = document.getElementById('rental-start')?.value;
      const endDate = document.getElementById('rental-end')?.value;
      const monthlyRent = document.getElementById('rental-amount')?.value;
      const currency = document.getElementById('rental-currency')?.value;
      const adjustmentFrequency = document.getElementById('rental-frequency')?.value;
      const adjustmentPercentage = document.getElementById('rental-percentage')?.value;
      const paymentDay = document.getElementById('rental-payment-day')?.value;
      const depositAmount = document.getElementById('rental-deposit')?.value;
      const notes = document.getElementById('rental-notes')?.value?.trim();

      // Validation
      if (!propertyId || !propietarioId || !inquilinoId) {
        Toast.show('error', 'Campos requeridos', 'Seleccioná propiedad, propietario e inquilino');
        return;
      }

      if (!startDate || !endDate) {
        Toast.show('error', 'Campos requeridos', 'Ingresá las fechas del contrato');
        return;
      }

      // Date range validation - end date must be after start date
      const dateValidation = FormValidation.validateDateRange(startDate, endDate);
      if (!dateValidation.isValid) {
        Toast.show('error', 'Fechas inválidas', dateValidation.error);
        return;
      }

      if (!monthlyRent || parseFloat(monthlyRent) <= 0) {
        Toast.show('error', 'Monto inválido', 'Ingresá el alquiler mensual');
        return;
      }

      // Adjustment percentage validation (0-100)
      if (adjustmentPercentage) {
        const percentageValidation = FormValidation.validatePercentage(adjustmentPercentage, 'El porcentaje de ajuste');
        if (!percentageValidation.isValid) {
          Toast.show('error', 'Porcentaje inválido', percentageValidation.error);
          return;
        }
      }

      if (!validateGuarantors()) {
        return;
      }

      // Get guarantor data
      const firstGuarantor = guarantorsContainer.querySelector('.guarantor-item');
      const guarantorName = firstGuarantor?.querySelector('.guarantor-name')?.value?.trim();
      const guarantorPhone = firstGuarantor?.querySelector('.guarantor-phone')?.value?.trim();

      // Calculate next adjustment date
      const startDateObj = new Date(startDate);
      const monthsToAdd = adjustmentFrequency === 'mensual' ? 1 :
                          adjustmentFrequency === 'bimestral' ? 2 :
                          adjustmentFrequency === 'trimestral' ? 3 :
                          adjustmentFrequency === 'cuatrimestral' ? 4 :
                          adjustmentFrequency === 'semestral' ? 6 : 12;
      startDateObj.setMonth(startDateObj.getMonth() + monthsToAdd);
      const nextAdjustmentDate = startDateObj.toISOString().split('T')[0];

      try {
        const saveBtn = document.getElementById('modal-save');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Creando...';

        await DataStore.createRentalViaAPI({
          propertyId,
          propietarioId,
          inquilinoId,
          startDate,
          endDate,
          monthlyRent: parseFloat(monthlyRent),
          currency: currency || 'ARS',
          adjustmentFrequency: adjustmentFrequency || 'trimestral',
          adjustmentPercentage: parseFloat(adjustmentPercentage) || 15,
          nextAdjustmentDate,
          paymentDay: parseInt(paymentDay) || 10,
          depositAmount: parseFloat(depositAmount) || 0,
          guarantorName,
          guarantorPhone,
          notes: notes || undefined,
          status: 'activo'
        });

        Toast.show('success', 'Contrato de alquiler creado correctamente');
        this.close();

        // Refresh administraciones page if visible
        if (typeof App !== 'undefined' && App.currentPage === 'administraciones') {
          App.navigate('administraciones');
        }
      } catch (error) {
        Toast.show('error', 'Error', error.message);
        const saveBtn = document.getElementById('modal-save');
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = 'Crear Contrato';
        }
      }
    });
  },

  // Edit Rental Contract Modal
  editRental(rentalId) {
    const rental = DataStore.getRentalById(rentalId);
    if (!rental) {
      Toast.show('error', 'Contrato no encontrado');
      return;
    }

    const frequencies = DataStore.adjustmentFrequencies || [
      { id: 'mensual', name: 'Mensual' },
      { id: 'bimestral', name: 'Bimestral' },
      { id: 'trimestral', name: 'Trimestral' },
      { id: 'cuatrimestral', name: 'Cuatrimestral' },
      { id: 'semestral', name: 'Semestral' },
      { id: 'anual', name: 'Anual' }
    ];

    const statuses = [
      { id: 'activo', name: 'Activo' },
      { id: 'vencido', name: 'Vencido' },
      { id: 'rescindido', name: 'Rescindido' },
      { id: 'renovado', name: 'Renovado' }
    ];

    const content = `
      <div class="modal__header">
        <h2 class="modal__title">Editar Contrato</h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body form-modal">
        <div class="form-section">
          <h4 class="form-section__title">Estado del Contrato</h4>
          <div class="form-group">
            <label class="form-label">Estado</label>
            <select class="form-select" id="edit-rental-status">
              ${statuses.map(s => `
                <option value="${s.id}" ${rental.status === s.id ? 'selected' : ''}>${s.name}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="form-section">
          <h4 class="form-section__title">Vigencia</h4>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Fecha de Inicio</label>
              <input type="date" class="form-input" id="edit-rental-start" value="${rental.startDate}">
            </div>
            <div class="form-group">
              <label class="form-label">Fecha de Fin</label>
              <input type="date" class="form-input" id="edit-rental-end" value="${rental.endDate}">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h4 class="form-section__title">Condiciones Económicas</h4>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Alquiler Mensual</label>
              <input type="number" class="form-input" id="edit-rental-amount" value="${rental.monthlyRent}">
            </div>
            <div class="form-group">
              <label class="form-label">Moneda</label>
              <select class="form-select" id="edit-rental-currency">
                <option value="ARS" ${rental.currency === 'ARS' ? 'selected' : ''}>ARS (Pesos)</option>
                <option value="USD" ${rental.currency === 'USD' ? 'selected' : ''}>USD (Dólares)</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Frecuencia de Ajuste</label>
              <select class="form-select" id="edit-rental-frequency">
                ${frequencies.map(f => `
                  <option value="${f.id}" ${rental.adjustmentFrequency === f.id ? 'selected' : ''}>${f.name}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Porcentaje de Ajuste (%)</label>
              <input type="number" class="form-input" id="edit-rental-percentage" value="${rental.adjustmentPercentage}">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Próximo Ajuste</label>
              <input type="date" class="form-input" id="edit-rental-next-adjustment" value="${rental.nextAdjustmentDate}">
            </div>
            <div class="form-group">
              <label class="form-label">Día de Pago</label>
              <input type="number" class="form-input" id="edit-rental-payment-day" min="1" max="31" value="${rental.paymentDay}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Depósito</label>
            <input type="number" class="form-input" id="edit-rental-deposit" value="${rental.depositAmount}">
          </div>
        </div>

        <div class="form-section">
          <h4 class="form-section__title">Garante</h4>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input type="text" class="form-input" id="edit-rental-guarantor-name" value="${rental.guarantor?.name || rental.guarantorName || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input type="tel" class="form-input" id="edit-rental-guarantor-phone" value="${rental.guarantor?.phone || rental.guarantorPhone || ''}">
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-textarea" id="edit-rental-notes" rows="3">${rental.notes || ''}</textarea>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-save">Guardar Cambios</button>
      </div>
    `;

    this.open(content, 'lg');

    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.close());
    document.getElementById('modal-save')?.addEventListener('click', async () => {
      const status = document.getElementById('edit-rental-status')?.value;
      const startDate = document.getElementById('edit-rental-start')?.value;
      const endDate = document.getElementById('edit-rental-end')?.value;
      const monthlyRent = document.getElementById('edit-rental-amount')?.value;
      const currency = document.getElementById('edit-rental-currency')?.value;
      const adjustmentFrequency = document.getElementById('edit-rental-frequency')?.value;
      const adjustmentPercentage = document.getElementById('edit-rental-percentage')?.value;
      const nextAdjustmentDate = document.getElementById('edit-rental-next-adjustment')?.value;
      const paymentDay = document.getElementById('edit-rental-payment-day')?.value;
      const depositAmount = document.getElementById('edit-rental-deposit')?.value;
      const guarantorName = document.getElementById('edit-rental-guarantor-name')?.value?.trim();
      const guarantorPhone = document.getElementById('edit-rental-guarantor-phone')?.value?.trim();
      const notes = document.getElementById('edit-rental-notes')?.value?.trim();

      // Validation - Date range
      if (startDate && endDate) {
        const dateValidation = FormValidation.validateDateRange(startDate, endDate);
        if (!dateValidation.isValid) {
          Toast.show('error', 'Fechas inválidas', dateValidation.error);
          return;
        }
      }

      // Validation - Adjustment percentage (0-100)
      if (adjustmentPercentage) {
        const percentageValidation = FormValidation.validatePercentage(adjustmentPercentage, 'El porcentaje de ajuste');
        if (!percentageValidation.isValid) {
          Toast.show('error', 'Porcentaje inválido', percentageValidation.error);
          return;
        }
      }

      // Validation - Monthly rent
      if (!monthlyRent || parseFloat(monthlyRent) <= 0) {
        Toast.show('error', 'Monto inválido', 'El alquiler mensual debe ser mayor a 0');
        return;
      }

      try {
        const saveBtn = document.getElementById('modal-save');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Guardando...';

        await DataStore.updateRentalViaAPI(rentalId, {
          status,
          startDate,
          endDate,
          monthlyRent: parseFloat(monthlyRent),
          currency,
          adjustmentFrequency,
          adjustmentPercentage: parseFloat(adjustmentPercentage),
          nextAdjustmentDate,
          paymentDay: parseInt(paymentDay),
          depositAmount: parseFloat(depositAmount),
          guarantorName: guarantorName || undefined,
          guarantorPhone: guarantorPhone || undefined,
          notes: notes || undefined
        });

        Toast.show('success', 'Contrato actualizado correctamente');
        this.close();

        // Refresh administraciones page if visible
        if (typeof App !== 'undefined' && App.currentPage === 'administraciones') {
          App.navigate('administraciones');
        }
      } catch (error) {
        Toast.show('error', 'Error', error.message);
        const saveBtn = document.getElementById('modal-save');
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = 'Guardar Cambios';
        }
      }
    });
  },

  // New User Modal
  newUser() {
    const currentUser = DataStore.currentUser;
    const currentRole = (currentUser?.role || 'administrador').toLowerCase();

    // Determine which roles can be created
    let availableRoles = [];
    if (currentRole === 'superadmin') {
      availableRoles = [
        { id: 'superadmin', name: 'Super Admin' },
        { id: 'administrador', name: 'Administrador' },
        { id: 'agente', name: 'Vendedor' }
      ];
    } else if (currentRole === 'administrador' || currentRole === 'admin') {
      // Admin can only create VENDEDOR
      availableRoles = [
        { id: 'agente', name: 'Vendedor' }
      ];
    }

    const content = `
      <div class="modal__header">
        <h2 class="modal__title">Nuevo Usuario</h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body form-modal">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nombre Completo <span class="required">*</span></label>
            <input type="text" class="form-input" id="user-name" placeholder="Nombre y apellido">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Email <span class="required">*</span></label>
            <input type="email" class="form-input" id="user-email" placeholder="email@domum.com.ar">
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input type="tel" class="form-input" id="user-phone" placeholder="+54 9 11 1234-5678">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Rol <span class="required">*</span></label>
            <select class="form-select" id="user-role">
              ${availableRoles.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Estado</label>
            <select class="form-select" id="user-status">
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Contraseña <span class="required">*</span></label>
            <input type="password" class="form-input" id="user-password" placeholder="Mínimo 8 caracteres">
          </div>
          <div class="form-group">
            <label class="form-label">Confirmar Contraseña <span class="required">*</span></label>
            <input type="password" class="form-input" id="user-password-confirm" placeholder="Repetir contraseña">
          </div>
        </div>
        <div class="form-info">
          <i data-lucide="info"></i>
          <span>El usuario recibirá un email con sus credenciales de acceso.</span>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-save">Crear Usuario</button>
      </div>
    `;

    this.open(content, 'md');

    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.close());
    document.getElementById('modal-save')?.addEventListener('click', async () => {
      const name = document.getElementById('user-name')?.value?.trim();
      const email = document.getElementById('user-email')?.value?.trim();
      const phone = document.getElementById('user-phone')?.value?.trim();
      const role = document.getElementById('user-role')?.value;
      const status = document.getElementById('user-status')?.value;
      const password = document.getElementById('user-password')?.value;
      const passwordConfirm = document.getElementById('user-password-confirm')?.value;

      // Validation
      if (!name || !role) {
        Toast.show('error', 'Campos requeridos', 'Completá nombre y rol');
        return;
      }

      // Email validation
      const emailValidation = FormValidation.validateRequiredEmail(email);
      if (!emailValidation.isValid) {
        Toast.show('error', 'Email inválido', emailValidation.error);
        return;
      }

      // Password validation (must have uppercase, lowercase, number, min 8 chars)
      const passwordValidation = FormValidation.validatePassword(password);
      if (!passwordValidation.isValid) {
        Toast.show('error', 'Contraseña inválida', passwordValidation.errors.join('. '));
        return;
      }

      if (password !== passwordConfirm) {
        Toast.show('error', 'Error', 'Las contraseñas no coinciden');
        return;
      }

      // Create user via API
      try {
        const saveBtn = document.getElementById('modal-save');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Creando...';

        await DataStore.createUserViaAPI({
          name,
          email,
          password,
          phone,
          role,
          status
        });

        Toast.show('success', 'Usuario creado correctamente');
        this.close();

        // Refresh users page if visible
        if (typeof App !== 'undefined' && App.currentPage === 'usuarios') {
          App.navigate('usuarios');
        }
      } catch (error) {
        Toast.show('error', 'Error', error.message);
        const saveBtn = document.getElementById('modal-save');
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = 'Crear Usuario';
        }
      }
    });
  },

  // Edit User Modal
  editUser(userId) {
    const user = DataStore.getUserById(userId);
    if (!user) {
      Toast.show('error', 'Usuario no encontrado');
      return;
    }

    const currentUser = DataStore.currentUser;
    const currentRole = (currentUser?.role || 'administrador').toLowerCase();

    // Determine which roles can be assigned
    let availableRoles = [];
    if (currentRole === 'superadmin') {
      availableRoles = [
        { id: 'superadmin', name: 'Super Admin' },
        { id: 'administrador', name: 'Administrador' },
        { id: 'agente', name: 'Vendedor' }
      ];
    } else if (currentRole === 'administrador' || currentRole === 'admin') {
      // Admin cannot change roles (only edit vendedores)
      availableRoles = [
        { id: user.role, name: Utils.getRoleLabel(user.role) }
      ];
    }

    const content = `
      <div class="modal__header">
        <h2 class="modal__title">Editar Usuario</h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body form-modal">
        <div class="edit-user-header">
          <div class="edit-user-avatar">${user.avatar}</div>
          <div class="edit-user-info">
            <span class="edit-user-name">${user.name}</span>
            <span class="edit-user-email">${user.email}</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nombre Completo <span class="required">*</span></label>
            <input type="text" class="form-input" id="edit-user-name" value="${user.name || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Email <span class="required">*</span></label>
            <input type="email" class="form-input" id="edit-user-email" value="${user.email || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input type="tel" class="form-input" id="edit-user-phone" value="${user.phone || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Rol ${currentRole !== 'superadmin' ? '(no editable)' : ''}</label>
            <select class="form-select" id="edit-user-role" ${currentRole !== 'superadmin' ? 'disabled' : ''}>
              ${availableRoles.map(r => `
                <option value="${r.id}" ${user.role === r.id ? 'selected' : ''}>${r.name}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Estado</label>
            <select class="form-select" id="edit-user-status">
              <option value="activo" ${user.status === 'activo' ? 'selected' : ''}>Activo</option>
              <option value="inactivo" ${user.status === 'inactivo' ? 'selected' : ''}>Inactivo</option>
            </select>
          </div>
        </div>

        <div class="form-section">
          <h4 class="form-section__title">Cambiar Contraseña</h4>
          <p class="form-section__desc">Dejá estos campos vacíos para mantener la contraseña actual</p>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nueva Contraseña</label>
              <input type="password" class="form-input" id="edit-user-password" placeholder="Mínimo 8 caracteres">
            </div>
            <div class="form-group">
              <label class="form-label">Confirmar Contraseña</label>
              <input type="password" class="form-input" id="edit-user-password-confirm" placeholder="Repetir contraseña">
            </div>
          </div>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-save">Guardar Cambios</button>
      </div>
    `;

    this.open(content, 'md');

    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.close());
    document.getElementById('modal-save')?.addEventListener('click', async () => {
      const name = document.getElementById('edit-user-name')?.value?.trim();
      const email = document.getElementById('edit-user-email')?.value?.trim();
      const phone = document.getElementById('edit-user-phone')?.value?.trim();
      const role = document.getElementById('edit-user-role')?.value;
      const status = document.getElementById('edit-user-status')?.value;
      const password = document.getElementById('edit-user-password')?.value;
      const passwordConfirm = document.getElementById('edit-user-password-confirm')?.value;

      // Validation
      if (!name) {
        Toast.show('error', 'Campo requerido', 'El nombre es requerido');
        return;
      }

      // Email validation
      const emailValidation = FormValidation.validateRequiredEmail(email);
      if (!emailValidation.isValid) {
        Toast.show('error', 'Email inválido', emailValidation.error);
        return;
      }

      // Password validation if changing (must have uppercase, lowercase, number, min 8 chars)
      if (password) {
        const passwordValidation = FormValidation.validatePassword(password);
        if (!passwordValidation.isValid) {
          Toast.show('error', 'Contraseña inválida', passwordValidation.errors.join('. '));
          return;
        }
        if (password !== passwordConfirm) {
          Toast.show('error', 'Error', 'Las contraseñas no coinciden');
          return;
        }
      }

      // Update user via API
      try {
        const saveBtn = document.getElementById('modal-save');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Guardando...';

        await DataStore.updateUserViaAPI(userId, {
          name,
          phone,
          role: currentRole === 'superadmin' ? role : undefined,
          status
        });

        // Reset password if provided
        if (password) {
          await DataStore.resetUserPasswordViaAPI(userId, password);
        }

        Toast.show('success', 'Usuario actualizado correctamente');
        this.close();

        // Refresh users page if visible
        if (typeof App !== 'undefined' && App.currentPage === 'usuarios') {
          App.navigate('usuarios');
        }
      } catch (error) {
        Toast.show('error', 'Error', error.message);
        const saveBtn = document.getElementById('modal-save');
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = 'Guardar Cambios';
        }
      }
    });
  },

  // Delete User Confirmation
  deleteUser(userId) {
    const user = DataStore.getUserById(userId);
    if (!user) {
      Toast.show('error', 'Usuario no encontrado');
      return;
    }

    this.confirm({
      title: 'Eliminar Usuario',
      message: `¿Estás seguro que deseas eliminar a ${user.name}? Esta acción marcará al usuario como inactivo.`,
      icon: 'trash-2',
      type: 'danger',
      confirmText: 'Eliminar',
      onConfirm: async () => {
        try {
          await DataStore.deleteUserViaAPI(userId);
          Toast.show('success', 'Usuario eliminado correctamente');

          // Refresh users page if visible
          if (typeof App !== 'undefined' && App.currentPage === 'usuarios') {
            App.navigate('usuarios');
          }
        } catch (error) {
          Toast.show('error', 'Error', error.message);
        }
      }
    });
  },

  // Helper to setup common modal buttons
  setupModalButtons(onSave) {
    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.close());
    document.getElementById('modal-save')?.addEventListener('click', () => {
      if (onSave) onSave();
      this.close();
    });
  },

  // Generate Document Modal - Dynamic form based on template
  generateDocument(preselectedType = null) {
    const templates = DataStore.getDocumentTemplates();

    const content = `
      <div class="modal__header">
        <h2 class="modal__title">
          <i data-lucide="sparkles"></i>
          Generar Documento
        </h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body form-modal">
        <!-- Document Type Selector -->
        <div class="doc-type-selector" id="doc-type-selector">
          <label class="form-label">Tipo de Documento</label>
          <div class="doc-type-grid">
            ${templates.map(t => `
              <button type="button" class="doc-type-btn ${preselectedType === t.id ? 'active' : ''}" data-type="${t.id}">
                <i data-lucide="${t.icon}" class="doc-type-btn__icon"></i>
                <span class="doc-type-btn__label">${t.name}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Dynamic Fields Container -->
        <div class="doc-fields" id="doc-fields-container">
          ${preselectedType ? this.renderDocumentFields(preselectedType) : `
            <div class="doc-fields__placeholder">
              <i data-lucide="file-text"></i>
              <p>Seleccioná un tipo de documento para ver los campos requeridos</p>
            </div>
          `}
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-generate" ${!preselectedType ? 'disabled' : ''}>
          <i data-lucide="sparkles"></i>
          Generar Documento
        </button>
      </div>
    `;

    this.open(content, 'lg');

    // Setup type selector
    const typeButtons = this.container.querySelectorAll('.doc-type-btn');
    const fieldsContainer = document.getElementById('doc-fields-container');
    const generateBtn = document.getElementById('modal-generate');

    typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        typeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const typeId = btn.dataset.type;
        fieldsContainer.innerHTML = this.renderDocumentFields(typeId);
        generateBtn.disabled = false;
        lucide.createIcons();
        this.setupFieldListeners();
      });
    });

    // Setup initial field listeners if preselected
    if (preselectedType) {
      this.setupFieldListeners();
    }

    // Close button
    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.close());

    // Generate button
    generateBtn.addEventListener('click', () => {
      const activeType = this.container.querySelector('.doc-type-btn.active');
      if (!activeType) return;

      const templateId = activeType.dataset.type;
      const formData = this.collectFormData();

      // Validate required fields
      const template = DataStore.getDocumentTemplateById(templateId);
      const missingFields = template.fields
        .filter(f => f.required && !formData[f.id])
        .map(f => f.label);

      if (missingFields.length > 0) {
        Toast.show('error', 'Campos requeridos', `Completá: ${missingFields.slice(0, 3).join(', ')}${missingFields.length > 3 ? '...' : ''}`);
        return;
      }

      // Generate document
      const doc = DataStore.generateDocument(templateId, formData);
      if (doc) {
        DataStore.saveGeneratedDocument(doc);
        this.close();
        // Open editor with generated document
        setTimeout(() => this.editDocument(doc.id), 300);
      }
    });
  },

  // Render dynamic fields for a document type
  renderDocumentFields(templateId) {
    const template = DataStore.getDocumentTemplateById(templateId);
    if (!template) return '';

    let html = `<div class="doc-fields__header">
      <h4>${template.name}</h4>
      <p>${template.description}</p>
    </div>`;

    // Group fields into sections
    const fieldGroups = [];
    let currentGroup = [];

    template.fields.forEach((field, index) => {
      currentGroup.push(field);
      // Create new row every 2 fields for side-by-side, or after certain field types
      if (currentGroup.length === 2 || field.type === 'textarea' || field.type === 'multiselect') {
        fieldGroups.push([...currentGroup]);
        currentGroup = [];
      }
    });
    if (currentGroup.length > 0) {
      fieldGroups.push(currentGroup);
    }

    fieldGroups.forEach(group => {
      if (group.length === 1 && (group[0].type === 'textarea' || group[0].type === 'multiselect')) {
        html += `<div class="form-group">${this.renderField(group[0])}</div>`;
      } else if (group.length === 1) {
        html += `<div class="form-row"><div class="form-group">${this.renderField(group[0])}</div></div>`;
      } else {
        html += `<div class="form-row">${group.map(f => `<div class="form-group">${this.renderField(f)}</div>`).join('')}</div>`;
      }
    });

    return html;
  },

  // Render a single field
  renderField(field) {
    const required = field.required ? '<span class="required">*</span>' : '';
    let input = '';

    switch (field.type) {
      case 'text':
        input = `<input type="text" class="form-input" id="field-${field.id}" name="${field.id}"
          placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
        break;

      case 'number':
        input = `<input type="number" class="form-input" id="field-${field.id}" name="${field.id}"
          min="${field.min || ''}" max="${field.max || ''}" value="${field.default || ''}" ${field.required ? 'required' : ''}>`;
        break;

      case 'currency':
        input = `<input type="number" class="form-input" id="field-${field.id}" name="${field.id}"
          placeholder="0" step="0.01" ${field.required ? 'required' : ''}>`;
        break;

      case 'date':
        input = `<input type="date" class="form-input" id="field-${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>`;
        break;

      case 'select':
        let options = '';
        if (field.source === 'properties') {
          options = DataStore.getProperties().map(p =>
            `<option value="${p.id}">${p.title} - ${p.address}</option>`
          ).join('');
        } else if (field.source === 'contacts') {
          let contacts = DataStore.getContacts();
          if (field.filter) {
            contacts = contacts.filter(c => c.type === field.filter);
          }
          options = contacts.map(c =>
            `<option value="${c.id}">${c.name}</option>`
          ).join('');
        } else if (field.options) {
          options = field.options.map(o =>
            `<option value="${o}" ${o === field.default ? 'selected' : ''}>${o}</option>`
          ).join('');
        }
        input = `<select class="form-select" id="field-${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>
          <option value="">Seleccionar...</option>
          ${options}
        </select>`;
        break;

      case 'multiselect':
        if (field.options) {
          input = `<div class="checkbox-group" id="field-${field.id}">
            ${field.options.map(o => `
              <label class="checkbox-item">
                <input type="checkbox" name="${field.id}" value="${o}">
                <span>${o}</span>
              </label>
            `).join('')}
          </div>`;
        }
        break;

      case 'textarea':
        input = `<textarea class="form-textarea" id="field-${field.id}" name="${field.id}"
          rows="3" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}></textarea>`;
        break;

      case 'checkbox':
        input = `<label class="checkbox-single">
          <input type="checkbox" id="field-${field.id}" name="${field.id}">
          <span>${field.label}</span>
        </label>`;
        return input; // Return early, no label needed
    }

    return `<label class="form-label">${field.label}${required}</label>${input}`;
  },

  // Setup field listeners for auto-population
  setupFieldListeners() {
    // Auto-calculate end date when start date changes (for rental contracts)
    const startDate = document.getElementById('field-startDate');
    const endDate = document.getElementById('field-endDate');
    if (startDate && endDate) {
      startDate.addEventListener('change', () => {
        if (startDate.value && !endDate.value) {
          const start = new Date(startDate.value);
          start.setFullYear(start.getFullYear() + 2); // Default 2 years for rental
          endDate.value = start.toISOString().split('T')[0];
        }
      });
    }

    // Auto-calculate saldo when precio and seña change
    const precioTotal = document.getElementById('field-precioTotal');
    const senaAmount = document.getElementById('field-senaAmount');
    const saldoAmount = document.getElementById('field-saldoAmount');
    if (precioTotal && senaAmount && saldoAmount) {
      const calcSaldo = () => {
        const total = parseFloat(precioTotal.value) || 0;
        const sena = parseFloat(senaAmount.value) || 0;
        if (total > 0 && sena > 0) {
          saldoAmount.value = total - sena;
        }
      };
      precioTotal.addEventListener('change', calcSaldo);
      senaAmount.addEventListener('change', calcSaldo);
    }
  },

  // Collect form data
  collectFormData() {
    const data = {};
    const inputs = this.container.querySelectorAll('[name]');

    inputs.forEach(input => {
      if (input.type === 'checkbox') {
        if (input.closest('.checkbox-group')) {
          // Multiselect
          if (!data[input.name]) data[input.name] = [];
          if (input.checked) data[input.name].push(input.value);
        } else {
          // Single checkbox
          data[input.name] = input.checked;
        }
      } else {
        data[input.name] = input.value;
      }
    });

    return data;
  },

  // Edit Document Modal - Full editor with preview
  editDocument(docId) {
    const doc = DataStore.getGeneratedDocumentById(docId);
    if (!doc) {
      Toast.show('error', 'Documento no encontrado');
      return;
    }

    const content = `
      <div class="modal__header">
        <h2 class="modal__title">
          <i data-lucide="edit-3"></i>
          ${doc.templateName}
        </h2>
        <div class="modal__header-actions">
          <span class="badge badge--outline">${doc.status}</span>
          <button class="modal__close" id="modal-close">
            <i data-lucide="x"></i>
          </button>
        </div>
      </div>
      <div class="modal__body doc-editor">
        <div class="doc-editor__toolbar">
          <div class="doc-editor__toolbar-left">
            <button class="btn btn--ghost btn--sm" id="btn-undo" title="Deshacer">
              <i data-lucide="undo-2"></i>
            </button>
            <button class="btn btn--ghost btn--sm" id="btn-redo" title="Rehacer">
              <i data-lucide="redo-2"></i>
            </button>
            <span class="toolbar-divider"></span>
            <button class="btn btn--ghost btn--sm" id="btn-uppercase" title="Mayúsculas">
              <i data-lucide="type"></i>
            </button>
          </div>
          <div class="doc-editor__toolbar-right">
            <span class="doc-editor__date">
              <i data-lucide="calendar"></i>
              ${Utils.formatDate(doc.createdAt)}
            </span>
          </div>
        </div>
        <div class="doc-editor__content">
          <textarea class="doc-editor__textarea" id="doc-content" spellcheck="true">${doc.content}</textarea>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--outline" id="btn-preview">
          <i data-lucide="eye"></i>
          Vista Previa
        </button>
        <button class="btn btn--outline" id="btn-download">
          <i data-lucide="download"></i>
          Descargar
        </button>
        <button class="btn btn--primary" id="modal-save">
          <i data-lucide="save"></i>
          Guardar
        </button>
      </div>
    `;

    this.open(content, 'xl');

    const textarea = document.getElementById('doc-content');
    let history = [doc.content];
    let historyIndex = 0;

    // Undo
    document.getElementById('btn-undo')?.addEventListener('click', () => {
      if (historyIndex > 0) {
        historyIndex--;
        textarea.value = history[historyIndex];
      }
    });

    // Redo
    document.getElementById('btn-redo')?.addEventListener('click', () => {
      if (historyIndex < history.length - 1) {
        historyIndex++;
        textarea.value = history[historyIndex];
      }
    });

    // Track changes for undo/redo
    let debounceTimer;
    textarea.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (textarea.value !== history[historyIndex]) {
          history = history.slice(0, historyIndex + 1);
          history.push(textarea.value);
          historyIndex = history.length - 1;
        }
      }, 500);
    });

    // Uppercase selection
    document.getElementById('btn-uppercase')?.addEventListener('click', () => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start !== end) {
        const selected = textarea.value.substring(start, end);
        const isUpper = selected === selected.toUpperCase();
        const newText = isUpper ? selected.toLowerCase() : selected.toUpperCase();
        textarea.value = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
        textarea.setSelectionRange(start, start + newText.length);
      }
    });

    // Preview
    document.getElementById('btn-preview')?.addEventListener('click', () => {
      this.previewDocument(textarea.value, doc.templateName);
    });

    // Download
    document.getElementById('btn-download')?.addEventListener('click', () => {
      const blob = new Blob([textarea.value], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.templateName.replace(/\s+/g, '_')}_${Utils.formatDate(doc.createdAt, 'short')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Toast.show('success', 'Documento descargado');
    });

    // Save
    document.getElementById('modal-save')?.addEventListener('click', () => {
      doc.content = textarea.value;
      doc.updatedAt = new Date().toISOString();
      DataStore.saveGeneratedDocument(doc);
      Toast.show('success', 'Documento guardado');
      this.close();
    });

    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.close());
  },

  // Preview Document in new modal
  previewDocument(content, title) {
    // Convert plain text to formatted HTML
    const formattedContent = content
      .split('\n')
      .map(line => {
        // Headers (uppercase lines)
        if (line === line.toUpperCase() && line.trim().length > 3 && !line.includes('_')) {
          return `<h3 class="doc-preview__heading">${line}</h3>`;
        }
        // Signature lines
        if (line.includes('_______')) {
          return `<div class="doc-preview__signature">${line}</div>`;
        }
        // Regular paragraphs
        if (line.trim()) {
          return `<p>${line}</p>`;
        }
        return '<br>';
      })
      .join('');

    const previewContent = `
      <div class="modal__header">
        <h2 class="modal__title">
          <i data-lucide="eye"></i>
          Vista Previa: ${title}
        </h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body">
        <div class="doc-preview">
          <div class="doc-preview__paper">
            ${formattedContent}
          </div>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-back">
          <i data-lucide="arrow-left"></i>
          Volver al Editor
        </button>
        <button class="btn btn--primary" id="btn-print">
          <i data-lucide="printer"></i>
          Imprimir
        </button>
      </div>
    `;

    this.open(previewContent, 'xl');

    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-back')?.addEventListener('click', () => this.close());
    document.getElementById('btn-print')?.addEventListener('click', () => {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; padding: 2cm; max-width: 21cm; margin: 0 auto; }
            h3 { text-align: center; margin: 1em 0; font-size: 14pt; }
            p { text-align: justify; margin: 0.5em 0; }
            .doc-preview__signature { font-family: monospace; margin: 2em 0; }
          </style>
        </head>
        <body>${formattedContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    });
  },

  // =============================================
  // TASK MODALS
  // =============================================

  // New Task Modal
  newTask(options = {}) {
    const { leadId, propertyId } = options;
    const leads = DataStore.getLeads();
    const users = DataStore.users.filter(u => u.role === 'agente' || u.role === 'administrador');

    // Get tomorrow's date as default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0];

    const content = `
      <div class="modal__header">
        <h2 class="modal__title">Nueva Tarea</h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body form-modal">
        <div class="form-group">
          <label class="form-label">Título <span class="required">*</span></label>
          <input type="text" class="form-input" id="task-title" placeholder="Ej: Llamar para seguimiento">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Fecha de Vencimiento <span class="required">*</span></label>
            <input type="date" class="form-input" id="task-due-date" value="${defaultDate}">
          </div>
          <div class="form-group">
            <label class="form-label">Prioridad</label>
            <select class="form-select" id="task-priority">
              <option value="baja">Baja</option>
              <option value="media" selected>Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Lead Relacionado</label>
            <select class="form-select" id="task-lead">
              <option value="">Sin lead asociado</option>
              ${leads.map(l => `
                <option value="${l.id}" ${l.id === leadId ? 'selected' : ''}>${l.name}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Asignar a</label>
            <select class="form-select" id="task-assigned">
              ${users.map(u => `
                <option value="${u.id}">${u.name}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Descripción</label>
          <textarea class="form-textarea" id="task-description" rows="3" placeholder="Detalles adicionales de la tarea..."></textarea>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-save">
          <i data-lucide="plus"></i>
          Crear Tarea
        </button>
      </div>
    `;

    this.open(content, 'md');

    // Setup event listeners
    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.close());
    document.getElementById('modal-save')?.addEventListener('click', async () => {
      const title = document.getElementById('task-title')?.value?.trim();
      const dueDate = document.getElementById('task-due-date')?.value;
      const priority = document.getElementById('task-priority')?.value || 'media';
      const leadSelect = document.getElementById('task-lead')?.value || null;
      const assignedToId = document.getElementById('task-assigned')?.value;
      const description = document.getElementById('task-description')?.value?.trim() || null;

      // Validation
      if (!title) {
        Toast.show('error', 'Error', 'El título es requerido');
        return;
      }
      if (!dueDate) {
        Toast.show('error', 'Error', 'La fecha de vencimiento es requerida');
        return;
      }

      const taskData = {
        title,
        dueDate,
        priority,
        leadId: leadSelect || null,
        propertyId: propertyId || null,
        assignedToId,
        description
      };

      const saveBtn = document.getElementById('modal-save');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Creando...';
      lucide.createIcons();

      try {
        await DataStore.createTaskViaAPI(taskData);
        Toast.show('success', 'Tarea creada correctamente');
        this.close();

        // Refresh dashboard if on that page
        if (typeof App !== 'undefined' && App.currentPage === 'dashboard') {
          App.renderPage('dashboard');
        }

        // Refresh lead panel if open
        if (leadId && Panels.isOpen) {
          Panels.lead(leadId);
        }
      } catch (error) {
        Toast.show('error', 'Error', error.message || 'No se pudo crear la tarea');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i data-lucide="plus"></i> Crear Tarea';
        lucide.createIcons();
      }
    });
  },

  // Edit Task Modal
  editTask(taskId) {
    const task = DataStore.getTaskById(taskId);
    if (!task) {
      Toast.show('error', 'Tarea no encontrada');
      return;
    }

    const leads = DataStore.getLeads();
    const users = DataStore.users.filter(u => u.role === 'agente' || u.role === 'administrador');

    const content = `
      <div class="modal__header">
        <h2 class="modal__title">Editar Tarea</h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body form-modal">
        <div class="form-group">
          <label class="form-label">Título <span class="required">*</span></label>
          <input type="text" class="form-input" id="task-title" value="${task.title || ''}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Fecha de Vencimiento <span class="required">*</span></label>
            <input type="date" class="form-input" id="task-due-date" value="${task.dueDate || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Prioridad</label>
            <select class="form-select" id="task-priority">
              <option value="baja" ${task.priority === 'baja' ? 'selected' : ''}>Baja</option>
              <option value="media" ${task.priority === 'media' ? 'selected' : ''}>Media</option>
              <option value="alta" ${task.priority === 'alta' ? 'selected' : ''}>Alta</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Estado</label>
            <select class="form-select" id="task-status">
              <option value="pendiente" ${task.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
              <option value="en_progreso" ${task.status === 'en_progreso' ? 'selected' : ''}>En Progreso</option>
              <option value="completada" ${task.status === 'completada' ? 'selected' : ''}>Completada</option>
              <option value="cancelada" ${task.status === 'cancelada' ? 'selected' : ''}>Cancelada</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Lead Relacionado</label>
            <select class="form-select" id="task-lead">
              <option value="">Sin lead asociado</option>
              ${leads.map(l => `
                <option value="${l.id}" ${task.lead?.id === l.id ? 'selected' : ''}>${l.name}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Asignar a</label>
          <select class="form-select" id="task-assigned">
            ${users.map(u => `
              <option value="${u.id}" ${task.assignedTo?.id === u.id ? 'selected' : ''}>${u.name}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Descripción</label>
          <textarea class="form-textarea" id="task-description" rows="3">${task.description || ''}</textarea>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--ghost btn--danger" id="modal-delete">
          <i data-lucide="trash-2"></i>
          Eliminar
        </button>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
          <button class="btn btn--primary" id="modal-save">Guardar Cambios</button>
        </div>
      </div>
    `;

    this.open(content, 'md');

    // Setup event listeners
    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.close());

    document.getElementById('modal-delete')?.addEventListener('click', async () => {
      if (confirm('¿Estás seguro de eliminar esta tarea?')) {
        try {
          await DataStore.deleteTaskViaAPI(taskId);
          Toast.show('success', 'Tarea eliminada');
          this.close();

          if (typeof App !== 'undefined' && App.currentPage === 'dashboard') {
            App.renderPage('dashboard');
          }
        } catch (error) {
          Toast.show('error', 'Error', error.message || 'No se pudo eliminar la tarea');
        }
      }
    });

    document.getElementById('modal-save')?.addEventListener('click', async () => {
      const title = document.getElementById('task-title')?.value?.trim();
      const dueDate = document.getElementById('task-due-date')?.value;
      const priority = document.getElementById('task-priority')?.value || 'media';
      const status = document.getElementById('task-status')?.value || 'pendiente';
      const leadSelect = document.getElementById('task-lead')?.value || null;
      const assignedToId = document.getElementById('task-assigned')?.value;
      const description = document.getElementById('task-description')?.value?.trim() || null;

      if (!title) {
        Toast.show('error', 'Error', 'El título es requerido');
        return;
      }

      const taskData = {
        title,
        dueDate,
        priority,
        status,
        leadId: leadSelect || null,
        assignedToId,
        description
      };

      const saveBtn = document.getElementById('modal-save');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Guardando...';
      lucide.createIcons();

      try {
        await DataStore.updateTaskViaAPI(taskId, taskData);
        Toast.show('success', 'Tarea actualizada');
        this.close();

        if (typeof App !== 'undefined' && App.currentPage === 'dashboard') {
          App.renderPage('dashboard');
        }
      } catch (error) {
        Toast.show('error', 'Error', error.message || 'No se pudo actualizar la tarea');
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Guardar Cambios';
      }
    });
  },

  // Quick Task Modal (from lead panel)
  quickTask(leadId, suggestedTitle = '') {
    const lead = DataStore.getLeadById(leadId);
    if (!lead) return;

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0];

    const content = `
      <div class="modal__header">
        <h2 class="modal__title">Nueva Tarea para ${lead.name}</h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body form-modal">
        <div class="form-group">
          <label class="form-label">Título <span class="required">*</span></label>
          <input type="text" class="form-input" id="task-title" value="${suggestedTitle}" placeholder="Ej: Llamar para seguimiento">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Fecha</label>
            <input type="date" class="form-input" id="task-due-date" value="${defaultDate}">
          </div>
          <div class="form-group">
            <label class="form-label">Prioridad</label>
            <select class="form-select" id="task-priority">
              <option value="baja">Baja</option>
              <option value="media" selected>Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-textarea" id="task-description" rows="2" placeholder="Notas adicionales..."></textarea>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-save">Crear Tarea</button>
      </div>
    `;

    this.open(content, 'sm');

    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.close());
    document.getElementById('modal-save')?.addEventListener('click', async () => {
      const title = document.getElementById('task-title')?.value?.trim();
      const dueDate = document.getElementById('task-due-date')?.value;
      const priority = document.getElementById('task-priority')?.value || 'media';
      const description = document.getElementById('task-description')?.value?.trim() || null;

      if (!title) {
        Toast.show('error', 'Error', 'El título es requerido');
        return;
      }

      const taskData = {
        title,
        dueDate,
        priority,
        leadId,
        description
      };

      try {
        await DataStore.createTaskViaAPI(taskData);
        Toast.show('success', 'Tarea creada');
        this.close();

        // Refresh lead panel
        if (Panels.isOpen) {
          setTimeout(() => Panels.lead(leadId), 100);
        }
      } catch (error) {
        Toast.show('error', 'Error', error.message || 'No se pudo crear la tarea');
      }
    });
  },

  // =============================================
  // LEAD ACTIVITY MODALS
  // =============================================

  // New Activity Modal
  newActivity(leadId, preselectedType = null) {
    const lead = DataStore.getLeadById(leadId);
    if (!lead) return;

    const activityTypes = DataStore.activityTypes || [
      { id: 'llamada_entrante', name: 'Llamada Entrante', icon: 'phone-incoming' },
      { id: 'llamada_saliente', name: 'Llamada Saliente', icon: 'phone-outgoing' },
      { id: 'whatsapp', name: 'WhatsApp', icon: 'message-circle' },
      { id: 'email', name: 'Email', icon: 'mail' },
      { id: 'visita', name: 'Visita', icon: 'home' },
      { id: 'reunion', name: 'Reunión', icon: 'users' },
      { id: 'nota', name: 'Nota', icon: 'file-text' },
      { id: 'oferta', name: 'Oferta', icon: 'tag' },
      { id: 'seguimiento', name: 'Seguimiento', icon: 'refresh-cw' }
    ];

    const activityOutcomes = DataStore.activityOutcomes || [
      { id: 'exitoso', name: 'Exitoso' },
      { id: 'sin_respuesta', name: 'Sin Respuesta' },
      { id: 'ocupado', name: 'Ocupado' },
      { id: 'rechazado', name: 'Rechazado' },
      { id: 'pendiente', name: 'Pendiente' },
      { id: 'no_aplica', name: 'No Aplica' }
    ];

    const today = new Date().toISOString().split('T')[0];

    const content = `
      <div class="modal__header">
        <h2 class="modal__title">
          <i data-lucide="activity"></i>
          Registrar Actividad
        </h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body form-modal">
        <div class="activity-context">
          <span class="activity-context__label">Lead:</span>
          <span class="activity-context__value">${lead.name}</span>
        </div>

        <!-- Activity Type Selector -->
        <div class="form-group">
          <label class="form-label">Tipo de Actividad <span class="required">*</span></label>
          <div class="activity-type-grid" id="activity-type-grid">
            ${activityTypes.map(t => `
              <button type="button" class="activity-type-btn ${preselectedType === t.id ? 'active' : ''}" data-type="${t.id}">
                <i data-lucide="${t.icon}"></i>
                <span>${t.name}</span>
              </button>
            `).join('')}
          </div>
          <input type="hidden" id="activity-type" value="${preselectedType || ''}">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Fecha <span class="required">*</span></label>
            <input type="date" class="form-input" id="activity-date" value="${today}">
          </div>
          <div class="form-group">
            <label class="form-label">Resultado</label>
            <select class="form-select" id="activity-outcome">
              ${activityOutcomes.map(o => `
                <option value="${o.id}" ${o.id === 'exitoso' ? 'selected' : ''}>${o.name}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="form-row" id="duration-row" style="display: none;">
          <div class="form-group">
            <label class="form-label">Duración (minutos)</label>
            <input type="number" class="form-input" id="activity-duration" min="0" placeholder="0">
          </div>
          <div class="form-group">
            <label class="form-label">Asunto</label>
            <input type="text" class="form-input" id="activity-subject" placeholder="Asunto de la comunicación">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-textarea" id="activity-notes" rows="3" placeholder="Detalles de la actividad..."></textarea>
        </div>

        <div class="form-section">
          <div class="form-group form-checkbox">
            <input type="checkbox" id="activity-followup-required">
            <label for="activity-followup-required">Requiere seguimiento</label>
          </div>
          <div class="form-group" id="followup-date-group" style="display: none;">
            <label class="form-label">Fecha de seguimiento</label>
            <input type="date" class="form-input" id="activity-followup-date">
          </div>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-save">
          <i data-lucide="plus"></i>
          Registrar Actividad
        </button>
      </div>
    `;

    this.open(content, 'md');

    // Activity type selection
    const typeGrid = document.getElementById('activity-type-grid');
    const typeInput = document.getElementById('activity-type');
    const durationRow = document.getElementById('duration-row');

    typeGrid?.addEventListener('click', (e) => {
      const btn = e.target.closest('.activity-type-btn');
      if (!btn) return;

      // Update active state
      typeGrid.querySelectorAll('.activity-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      typeInput.value = btn.dataset.type;

      // Show duration for calls and meetings
      const showDuration = ['llamada_entrante', 'llamada_saliente', 'reunion', 'visita'].includes(btn.dataset.type);
      durationRow.style.display = showDuration ? 'flex' : 'none';
    });

    // Follow-up checkbox
    const followupCheckbox = document.getElementById('activity-followup-required');
    const followupDateGroup = document.getElementById('followup-date-group');

    followupCheckbox?.addEventListener('change', (e) => {
      followupDateGroup.style.display = e.target.checked ? 'block' : 'none';
      if (e.target.checked) {
        // Set default follow-up date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('activity-followup-date').value = tomorrow.toISOString().split('T')[0];
      }
    });

    // Modal buttons
    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.close());
    document.getElementById('modal-save')?.addEventListener('click', async () => {
      const type = document.getElementById('activity-type')?.value;
      const date = document.getElementById('activity-date')?.value;
      const outcome = document.getElementById('activity-outcome')?.value;
      const duration = document.getElementById('activity-duration')?.value;
      const subject = document.getElementById('activity-subject')?.value?.trim();
      const notes = document.getElementById('activity-notes')?.value?.trim();
      const followUpRequired = document.getElementById('activity-followup-required')?.checked;
      const followUpDate = document.getElementById('activity-followup-date')?.value;

      if (!type) {
        Toast.show('error', 'Error', 'Seleccioná un tipo de actividad');
        return;
      }

      if (!date) {
        Toast.show('error', 'Error', 'La fecha es requerida');
        return;
      }

      const activityData = {
        type,
        date,
        outcome: outcome || 'no_aplica',
        duration: duration ? parseInt(duration) : null,
        subject: subject || null,
        notes: notes || null,
        followUpRequired: followUpRequired || false,
        followUpDate: followUpRequired && followUpDate ? followUpDate : null
      };

      try {
        const saveBtn = document.getElementById('modal-save');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Guardando...';

        await DataStore.addLeadActivityViaAPI(leadId, activityData);
        Toast.show('success', 'Actividad registrada');
        this.close();

        // Refresh lead panel
        if (Panels.isOpen) {
          setTimeout(() => Panels.lead(leadId), 100);
        }
      } catch (error) {
        Toast.show('error', 'Error', error.message || 'No se pudo registrar la actividad');
        const saveBtn = document.getElementById('modal-save');
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i data-lucide="plus"></i> Registrar Actividad';
          lucide.createIcons();
        }
      }
    });
  },

  // Quick Activity Modal (simplified version for quick actions)
  quickActivity(leadId, activityType) {
    const lead = DataStore.getLeadById(leadId);
    if (!lead) return;

    const typeLabels = {
      'llamada_entrante': 'Llamada Entrante',
      'llamada_saliente': 'Llamada Saliente',
      'whatsapp': 'WhatsApp',
      'email': 'Email',
      'visita': 'Visita',
      'reunion': 'Reunión',
      'nota': 'Nota'
    };

    const typeIcons = {
      'llamada_entrante': 'phone-incoming',
      'llamada_saliente': 'phone-outgoing',
      'whatsapp': 'message-circle',
      'email': 'mail',
      'visita': 'home',
      'reunion': 'users',
      'nota': 'file-text'
    };

    const showDuration = ['llamada_entrante', 'llamada_saliente', 'reunion', 'visita'].includes(activityType);

    const activityOutcomes = DataStore.activityOutcomes || [
      { id: 'exitoso', name: 'Exitoso' },
      { id: 'sin_respuesta', name: 'Sin Respuesta' },
      { id: 'ocupado', name: 'Ocupado' },
      { id: 'rechazado', name: 'Rechazado' },
      { id: 'pendiente', name: 'Pendiente' },
      { id: 'no_aplica', name: 'No Aplica' }
    ];

    const today = new Date().toISOString().split('T')[0];

    const content = `
      <div class="modal__header">
        <h2 class="modal__title">
          <i data-lucide="${typeIcons[activityType] || 'activity'}"></i>
          ${typeLabels[activityType] || 'Actividad'}
        </h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body form-modal">
        <div class="activity-context">
          <span class="activity-context__label">Lead:</span>
          <span class="activity-context__value">${lead.name}</span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Fecha</label>
            <input type="date" class="form-input" id="quick-activity-date" value="${today}">
          </div>
          <div class="form-group">
            <label class="form-label">Resultado</label>
            <select class="form-select" id="quick-activity-outcome">
              ${activityOutcomes.map(o => `
                <option value="${o.id}" ${o.id === 'exitoso' ? 'selected' : ''}>${o.name}</option>
              `).join('')}
            </select>
          </div>
        </div>

        ${showDuration ? `
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Duración (minutos)</label>
            <input type="number" class="form-input" id="quick-activity-duration" min="0" placeholder="0">
          </div>
          <div class="form-group"></div>
        </div>
        ` : ''}

        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-textarea" id="quick-activity-notes" rows="2" placeholder="¿Qué se habló? ¿Qué resultado hubo?"></textarea>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-save">Guardar</button>
      </div>
    `;

    this.open(content, 'sm');

    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.close());
    document.getElementById('modal-save')?.addEventListener('click', async () => {
      const date = document.getElementById('quick-activity-date')?.value;
      const outcome = document.getElementById('quick-activity-outcome')?.value;
      const duration = document.getElementById('quick-activity-duration')?.value;
      const notes = document.getElementById('quick-activity-notes')?.value?.trim();

      const activityData = {
        type: activityType,
        date: date || today,
        outcome: outcome || 'no_aplica',
        duration: duration ? parseInt(duration) : null,
        notes: notes || null
      };

      try {
        await DataStore.addLeadActivityViaAPI(leadId, activityData);
        Toast.show('success', 'Actividad registrada');
        this.close();

        // Refresh lead panel
        if (Panels.isOpen) {
          setTimeout(() => Panels.lead(leadId), 100);
        }
      } catch (error) {
        Toast.show('error', 'Error', error.message || 'No se pudo registrar');
      }
    });
  },

  // Complete follow-up and optionally schedule a new one
  completeFollowUp(leadId) {
    const lead = DataStore.getLeadById(leadId);
    if (!lead) {
      Toast.show('error', 'Error', 'Lead no encontrado');
      return;
    }

    // Get tomorrow's date as default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    this.modal.innerHTML = `
      <div class="modal__header">
        <h2 class="modal__title">Completar Seguimiento</h2>
        <button class="modal__close" id="modal-close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal__body">
        <p style="margin-bottom: 1.5rem; color: var(--text-secondary);">
          Lead: <strong>${lead.name}</strong>
        </p>

        <div class="form-group">
          <label class="form-label">Resultado del contacto</label>
          <select class="form-input" id="followup-outcome">
            <option value="exitoso">Exitoso - Logré comunicarme</option>
            <option value="sin_respuesta">Sin respuesta</option>
            <option value="ocupado">Ocupado / No disponible</option>
            <option value="rechazado">No interesado</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Notas (opcional)</label>
          <textarea class="form-input" id="followup-notes" rows="2" placeholder="Ej: Quedamos en hablar la próxima semana"></textarea>
        </div>

        <div class="form-group" style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
          <div class="checkbox-group">
            <input type="checkbox" id="schedule-new-followup" checked>
            <label for="schedule-new-followup">Programar nuevo seguimiento</label>
          </div>
        </div>

        <div class="form-group" id="new-followup-date-group">
          <label class="form-label">Fecha del próximo seguimiento</label>
          <input type="date" class="form-input" id="new-followup-date" value="${tomorrowStr}">
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--ghost" id="modal-cancel">Cancelar</button>
        <button class="btn btn--primary" id="modal-save">
          <i data-lucide="check"></i>
          Completar
        </button>
      </div>
    `;

    this.open();
    lucide.createIcons();

    // Toggle new follow-up date visibility
    const scheduleCheckbox = document.getElementById('schedule-new-followup');
    const dateGroup = document.getElementById('new-followup-date-group');

    scheduleCheckbox.addEventListener('change', (e) => {
      dateGroup.style.display = e.target.checked ? 'block' : 'none';
    });

    // Close handlers
    document.getElementById('modal-close').addEventListener('click', () => this.close());
    document.getElementById('modal-cancel').addEventListener('click', () => this.close());

    // Save handler
    document.getElementById('modal-save').addEventListener('click', async () => {
      const outcome = document.getElementById('followup-outcome').value;
      const notes = document.getElementById('followup-notes').value;
      const scheduleNew = document.getElementById('schedule-new-followup').checked;
      const newFollowUpDate = document.getElementById('new-followup-date').value;

      const saveBtn = document.getElementById('modal-save');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Guardando...';
      lucide.createIcons();

      try {
        // Create activity for the completed follow-up
        const activityData = {
          type: 'seguimiento',
          date: new Date().toISOString(),
          outcome: outcome,
          notes: notes || 'Seguimiento completado',
          followUpRequired: scheduleNew,
          followUpDate: scheduleNew && newFollowUpDate ? newFollowUpDate : null
        };

        await DataStore.addLeadActivityViaAPI(leadId, activityData);

        Toast.show('success', 'Seguimiento completado', scheduleNew ? 'Nuevo seguimiento programado' : '');
        this.close();

        // Refresh CRM view
        if (typeof App !== 'undefined' && App.currentPage === 'crm') {
          await DataStore.loadLeadsFromAPI();
          App.views.crm.render();
        }
      } catch (error) {
        Toast.show('error', 'Error', error.message || 'No se pudo guardar');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i data-lucide="check"></i> Completar';
        lucide.createIcons();
      }
    });
  }
};

// Toast Notification System
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
  },

  show(type, title, message = '', duration = 5000) {
    const icons = {
      success: 'circle-check',
      error: 'circle-x',
      warning: 'triangle-alert',
      info: 'info'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <div class="toast__icon">
        <i data-lucide="${icons[type]}"></i>
      </div>
      <div class="toast__content">
        <span class="toast__title">${title}</span>
        ${message ? `<span class="toast__message">${message}</span>` : ''}
      </div>
      <button class="toast__close">
        <i data-lucide="x"></i>
      </button>
    `;

    this.container.appendChild(toast);
    lucide.createIcons();

    // Close button
    toast.querySelector('.toast__close').addEventListener('click', () => {
      this.remove(toast);
    });

    // Auto remove
    if (duration > 0) {
      setTimeout(() => this.remove(toast), duration);
    }
  },

  remove(toast) {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }
};
