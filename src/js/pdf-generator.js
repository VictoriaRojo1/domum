/**
 * DOMUM - Property PDF Generator
 * Generates property brochures matching the DOMUM brand style
 */

/**
 * DOMUM - Document PDF Generator
 * Generates legal documents using html2pdf.js (client-side)
 */
const DocumentPDFGenerator = {
  colors: {
    primary: '#1a4d3e',
    secondary: '#c9a227',
    dark: '#1a1a2e',
    light: '#ffffff',
    gray: '#6b7280',
    lightGray: '#f3f4f6'
  },

  company: {
    name: 'DOMUM',
    slogan: 'NEGOCIOS INMOBILIARIOS',
    website: 'domuminmobiliaria.com.ar'
  },

  /**
   * Generate PDF from document data
   * @param {Object} docData - { content, title, templateName, createdAt, property }
   * @param {boolean} includeSignatures - Include signature lines
   */
  async generate(docData, includeSignatures = true) {
    if (!docData || !docData.content) {
      Toast.show('error', 'Error', 'No se encontró el contenido del documento');
      return false;
    }

    Toast.show('info', 'Generando PDF...', 'Esto puede tardar unos segundos');

    try {
      const htmlContent = this.createHTMLContent(docData, includeSignatures);

      const container = window.document.createElement('div');
      container.id = 'pdf-document-container';
      container.innerHTML = htmlContent;
      window.document.body.appendChild(container);

      await new Promise(resolve => setTimeout(resolve, 500));

      const filename = `${(docData.title || docData.templateName || 'documento').replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, '').replace(/\s+/g, '_')}.pdf`;

      const options = {
        margin: [20, 15, 20, 15],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        }
      };

      await html2pdf().set(options).from(container).save();

      window.document.body.removeChild(container);
      Toast.show('success', 'PDF generado', 'El documento se descargó correctamente');
      return true;

    } catch (error) {
      console.error('Error generating document PDF:', error);
      Toast.show('error', 'Error', 'No se pudo generar el PDF');
      const container = window.document.getElementById('pdf-document-container');
      if (container) window.document.body.removeChild(container);
      return false;
    }
  },

  createHTMLContent(doc, includeSignatures) {
    const createdDate = doc.createdAt
      ? new Date(doc.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

    const contentHtml = doc.content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    return `
      <style>
        #pdf-document-container {
          width: 210mm;
          font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
          color: #1a1a2e;
          line-height: 1.6;
          background: white;
          padding: 0;
        }
        #pdf-document-container * { box-sizing: border-box; margin: 0; padding: 0; }
        .doc-page {
          width: 210mm;
          min-height: 297mm;
          padding: 20mm 15mm;
          background: white;
        }
        .doc-header {
          text-align: center;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 3px solid ${this.colors.primary};
        }
        .doc-logo {
          font-size: 24pt;
          font-weight: 700;
          color: ${this.colors.primary};
          letter-spacing: 3px;
          margin-bottom: 5px;
        }
        .doc-slogan {
          font-size: 8pt;
          color: ${this.colors.gray};
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .doc-title {
          font-size: 18pt;
          font-weight: 700;
          color: ${this.colors.dark};
          margin: 20px 0 10px 0;
          text-align: center;
        }
        .doc-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 25px;
          padding: 12px 15px;
          background: ${this.colors.lightGray};
          border-radius: 6px;
          font-size: 10pt;
        }
        .doc-meta-item {
          text-align: center;
        }
        .doc-meta-label {
          font-size: 8pt;
          color: ${this.colors.gray};
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .doc-meta-value {
          font-size: 10pt;
          font-weight: 600;
          color: ${this.colors.dark};
        }
        .doc-content {
          font-size: 11pt;
          text-align: justify;
          line-height: 1.8;
        }
        .doc-content br {
          display: block;
          margin: 8px 0;
        }
        .signature-section {
          margin-top: 60px;
          display: flex;
          justify-content: space-around;
          page-break-inside: avoid;
        }
        .signature-box {
          text-align: center;
          width: 180px;
        }
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 70px;
          margin-bottom: 8px;
        }
        .signature-label {
          font-size: 9pt;
          color: ${this.colors.gray};
        }
        .doc-footer {
          margin-top: 40px;
          padding-top: 15px;
          border-top: 1px solid #eee;
          text-align: center;
          font-size: 8pt;
          color: ${this.colors.gray};
        }
      </style>

      <div class="doc-page">
        <div class="doc-header">
          <div class="doc-logo">DOMUM</div>
          <div class="doc-slogan">Negocios Inmobiliarios</div>
        </div>

        <h1 class="doc-title">${doc.title || doc.templateName || 'Documento'}</h1>

        <div class="doc-meta">
          <div class="doc-meta-item">
            <div class="doc-meta-label">Fecha de generación</div>
            <div class="doc-meta-value">${createdDate}</div>
          </div>
          <div class="doc-meta-item">
            <div class="doc-meta-label">Tipo de documento</div>
            <div class="doc-meta-value">${doc.templateName || 'General'}</div>
          </div>
          ${doc.property ? `
            <div class="doc-meta-item">
              <div class="doc-meta-label">Propiedad</div>
              <div class="doc-meta-value">${doc.property.title || doc.property.address || ''}</div>
            </div>
          ` : ''}
        </div>

        <div class="doc-content">
          ${contentHtml}
        </div>

        ${includeSignatures ? `
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Firma Parte 1</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Firma Parte 2</div>
            </div>
          </div>
        ` : ''}

        <div class="doc-footer">
          Generado por DOMUM - Sistema de Gestión Inmobiliaria | ${this.company.website}
        </div>
      </div>
    `;
  }
};

const PropertyPDFGenerator = {
  // DOMUM brand colors
  colors: {
    primary: '#1a4d3e',
    secondary: '#c9a227',
    dark: '#1a1a2e',
    light: '#ffffff',
    gray: '#6b7280',
    lightGray: '#f3f4f6'
  },

  company: {
    name: 'DOMUM',
    slogan: 'NEGOCIOS INMOBILIARIOS',
    website: 'domuminmobiliaria.com.ar',
    instagram: 'domum.negociosinmobiliarios',
    phone: '351-2159771'
  },

  async generate(property) {
    if (!property) {
      Toast.show('error', 'Error', 'No se encontró la propiedad');
      return;
    }

    Toast.show('info', 'Generando PDF...', 'Esto puede tardar unos segundos');

    try {
      const images = Components.getPropertyImages(property);
      const htmlContent = this.createHTMLContent(property, images);

      const container = document.createElement('div');
      container.id = 'pdf-container';
      container.innerHTML = htmlContent;
      document.body.appendChild(container);

      await new Promise(resolve => setTimeout(resolve, 800));

      const options = {
        margin: 0,
        filename: `FICHA - ${property.title || property.address}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        }
      };

      await html2pdf().set(options).from(container).save();

      document.body.removeChild(container);
      Toast.show('success', 'PDF generado', 'La ficha se descargó correctamente');

    } catch (error) {
      console.error('Error generating PDF:', error);
      Toast.show('error', 'Error', 'No se pudo generar el PDF');
      const container = document.getElementById('pdf-container');
      if (container) document.body.removeChild(container);
    }
  },

  createHTMLContent(property, images) {
    const isRental = property.operation === 'alquiler' || property.operation === 'alquiler_temporario';
    const priceLabel = isRental
      ? `${Utils.formatCurrency(property.price, property.currency)}/mes`
      : Utils.formatCurrency(property.price, property.currency);
    const location = `${property.neighborhood || ''}${property.city ? ', ' + property.city : ''}`.replace(/^, /, '') || 'Córdoba';
    const typeLabel = Utils.getPropertyTypeLabel ? Utils.getPropertyTypeLabel(property.type) : property.type;
    const operationLabel = Utils.getOperationLabel ? Utils.getOperationLabel(property.operation) : property.operation;

    return `
      <style>
        #pdf-container {
          width: 210mm;
          font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
          color: #1a1a2e;
          line-height: 1.4;
          background: white;
        }
        #pdf-container * { box-sizing: border-box; margin: 0; padding: 0; }
        .pdf-page {
          width: 210mm;
          height: 297mm;
          position: relative;
          overflow: hidden;
          background: white;
          page-break-after: always;
        }
        .pdf-page:last-child { page-break-after: auto; }
      </style>

      <!-- ==================== PAGE 1: COVER ==================== -->
      <div class="pdf-page">
        <!-- Hero Image - Top portion -->
        <div style="width: 100%; height: 165mm; position: relative; overflow: hidden;">
          <img src="${images[0]}"
               style="width: 100%; height: 100%; object-fit: cover;"
               crossorigin="anonymous" />
        </div>

        <!-- Title Overlay Band -->
        <div style="
          width: 100%;
          background: ${this.colors.primary};
          padding: 12mm 15mm;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        ">
          <div>
            <div style="color: white; font-size: 26pt; font-weight: 700; line-height: 1.1; text-transform: uppercase; letter-spacing: 1px;">
              ESPECIFICACIONES
            </div>
            <div style="color: white; font-size: 26pt; font-weight: 700; line-height: 1.1; text-transform: uppercase; letter-spacing: 1px;">
              DE LA PROPIEDAD
            </div>
          </div>
          <div style="text-align: right;">
            <div style="color: white; font-size: 22pt; font-weight: 700; letter-spacing: 3px;">DOMUM</div>
            <div style="color: rgba(255,255,255,0.7); font-size: 7pt; letter-spacing: 2px; text-transform: uppercase;">Negocios Inmobiliarios</div>
          </div>
        </div>

        <!-- Location Bar -->
        <div style="
          width: 100%;
          background: ${this.colors.primary};
          padding: 5mm 15mm;
          border-top: 1px solid rgba(255,255,255,0.2);
        ">
          <div style="color: white; font-size: 11pt; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; text-align: center;">
            ${location.toUpperCase()}
          </div>
        </div>

        <!-- Secondary Image - Bottom portion -->
        <div style="width: 100%; height: 68mm; overflow: hidden;">
          <img src="${images[1] || images[0]}"
               style="width: 100%; height: 100%; object-fit: cover;"
               crossorigin="anonymous" />
        </div>
      </div>

      <!-- ==================== PAGE 2: PROPERTY INFO ==================== -->
      <div class="pdf-page" style="display: flex;">
        <!-- Green Sidebar -->
        <div style="
          width: 14mm;
          height: 297mm;
          background: ${this.colors.primary};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        ">
          <div style="
            transform: rotate(-90deg);
            white-space: nowrap;
            color: rgba(255,255,255,0.5);
            font-size: 8pt;
            letter-spacing: 3px;
            text-transform: uppercase;
          ">DOMUM &bull; AGENCIA INMOBILIARIA</div>
        </div>

        <!-- Main Content -->
        <div style="flex: 1; padding: 15mm 15mm 15mm 10mm;">

          <!-- Property Badge -->
          <div style="text-align: center; margin-bottom: 8mm;">
            <span style="
              display: inline-block;
              background: ${this.colors.primary};
              color: white;
              padding: 2mm 8mm;
              font-size: 9pt;
              font-weight: 600;
              letter-spacing: 2px;
              text-transform: uppercase;
            ">PROPIEDAD</span>
          </div>

          <!-- Main Photo -->
          <div style="width: 100%; height: 75mm; overflow: hidden; margin-bottom: 6mm; border-radius: 1mm;">
            <img src="${images[0]}"
                 style="width: 100%; height: 100%; object-fit: cover;"
                 crossorigin="anonymous" />
          </div>

          <!-- Property Description Box -->
          <div style="
            background: white;
            padding: 6mm;
            margin-bottom: 8mm;
          ">
            <div style="
              display: inline-block;
              background: ${this.colors.primary};
              color: white;
              padding: 2mm 5mm;
              font-size: 12pt;
              font-weight: 700;
              margin-bottom: 4mm;
            ">${priceLabel}</div>

            <h2 style="font-size: 16pt; font-weight: 700; color: ${this.colors.dark}; margin-bottom: 2mm;">
              ${property.title || property.address}
            </h2>

            <p style="font-size: 9pt; color: ${this.colors.gray}; margin-bottom: 4mm;">
              📍 ${property.address}
            </p>

            <!-- Features Row -->
            <div style="display: flex; gap: 3mm; flex-wrap: wrap;">
              ${property.bedrooms ? `
                <div style="background: ${this.colors.lightGray}; padding: 3mm 5mm; border-radius: 1mm; text-align: center; min-width: 18mm;">
                  <div style="font-size: 14pt; font-weight: 700; color: ${this.colors.primary};">${property.bedrooms}</div>
                  <div style="font-size: 6pt; color: ${this.colors.gray}; text-transform: uppercase;">Dormitorios</div>
                </div>
              ` : ''}
              ${property.bathrooms ? `
                <div style="background: ${this.colors.lightGray}; padding: 3mm 5mm; border-radius: 1mm; text-align: center; min-width: 18mm;">
                  <div style="font-size: 14pt; font-weight: 700; color: ${this.colors.primary};">${property.bathrooms}</div>
                  <div style="font-size: 6pt; color: ${this.colors.gray}; text-transform: uppercase;">Baños</div>
                </div>
              ` : ''}
              <div style="background: ${this.colors.lightGray}; padding: 3mm 5mm; border-radius: 1mm; text-align: center; min-width: 18mm;">
                <div style="font-size: 11pt; font-weight: 700; color: ${this.colors.primary};">${typeLabel}</div>
                <div style="font-size: 6pt; color: ${this.colors.gray}; text-transform: uppercase;">Tipo</div>
              </div>
              <div style="background: ${this.colors.lightGray}; padding: 3mm 5mm; border-radius: 1mm; text-align: center; min-width: 18mm;">
                <div style="font-size: 11pt; font-weight: 700; color: ${this.colors.primary};">${operationLabel}</div>
                <div style="font-size: 6pt; color: ${this.colors.gray}; text-transform: uppercase;">Operación</div>
              </div>
            </div>
          </div>

          <!-- Description Text -->
          ${property.description ? `
            <p style="font-size: 9pt; color: #4a4a4a; line-height: 1.7; text-align: justify; margin-bottom: 8mm;">
              ${property.description.substring(0, 500)}${property.description.length > 500 ? '...' : ''}
            </p>
          ` : ''}

          <!-- Second Photo -->
          <div style="width: 100%; height: 65mm; overflow: hidden; border-radius: 1mm;">
            <img src="${images[2] || images[1] || images[0]}"
                 style="width: 100%; height: 100%; object-fit: cover;"
                 crossorigin="anonymous" />
          </div>
        </div>
      </div>

      <!-- ==================== PAGE 3: MORE PHOTOS + TECHNICAL SHEET ==================== -->
      <div class="pdf-page" style="display: flex;">
        <!-- Green Sidebar -->
        <div style="
          width: 14mm;
          height: 297mm;
          background: ${this.colors.primary};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        ">
          <div style="
            transform: rotate(-90deg);
            white-space: nowrap;
            color: rgba(255,255,255,0.5);
            font-size: 8pt;
            letter-spacing: 3px;
            text-transform: uppercase;
          ">DOMUM &bull; AGENCIA INMOBILIARIA</div>
        </div>

        <!-- Main Content -->
        <div style="flex: 1; padding: 0;">

          <!-- Photo Section -->
          ${images.length > 3 ? `
            <div style="padding: 12mm 15mm 8mm 10mm;">
              <div style="text-align: center; margin-bottom: 6mm;">
                <span style="
                  display: inline-block;
                  background: ${this.colors.primary};
                  color: white;
                  padding: 2mm 8mm;
                  font-size: 9pt;
                  font-weight: 600;
                  letter-spacing: 2px;
                  text-transform: uppercase;
                ">PROPIEDAD</span>
              </div>

              <div style="width: 100%; height: 70mm; overflow: hidden; border-radius: 1mm; margin-bottom: 5mm;">
                <img src="${images[3]}"
                     style="width: 100%; height: 100%; object-fit: cover;"
                     crossorigin="anonymous" />
              </div>
            </div>
          ` : '<div style="height: 20mm;"></div>'}

          <!-- FICHA TÉCNICA Section -->
          <div style="
            background: ${this.colors.dark};
            padding: 12mm 15mm;
            margin: 0 0 0 0;
            min-height: ${images.length > 3 ? '160mm' : '240mm'};
          ">
            <div style="text-align: right; margin-bottom: 8mm;">
              <span style="font-size: 20pt; font-weight: 700; color: white;">FICHA</span><br/>
              <span style="font-size: 20pt; font-weight: 700; color: ${this.colors.secondary};">TÉCNICA</span>
            </div>

            <div style="display: flex; gap: 10mm;">
              <!-- Column 1 -->
              <div style="flex: 1;">
                <div style="color: ${this.colors.secondary}; font-size: 10pt; font-weight: 600; margin-bottom: 3mm;">
                  Datos generales de la propiedad
                </div>
                <ul style="color: white; font-size: 9pt; line-height: 2; list-style: none; padding-left: 0;">
                  ${property.area ? `<li style="padding-left: 4mm; position: relative;"><span style="position: absolute; left: 0;">•</span> Superficie: ${property.area} m²</li>` : ''}
                  ${property.bedrooms ? `<li style="padding-left: 4mm; position: relative;"><span style="position: absolute; left: 0;">•</span> Dormitorios: ${property.bedrooms}</li>` : ''}
                  ${property.bathrooms ? `<li style="padding-left: 4mm; position: relative;"><span style="position: absolute; left: 0;">•</span> Baños: ${property.bathrooms}</li>` : ''}
                  <li style="padding-left: 4mm; position: relative;"><span style="position: absolute; left: 0;">•</span> Tipo: ${typeLabel}</li>
                  <li style="padding-left: 4mm; position: relative;"><span style="position: absolute; left: 0;">•</span> Operación: ${operationLabel}</li>
                </ul>

                ${property.amenities && property.amenities.length > 0 ? `
                  <div style="color: ${this.colors.secondary}; font-size: 10pt; font-weight: 600; margin: 6mm 0 3mm 0;">
                    Características
                  </div>
                  <ul style="color: white; font-size: 9pt; line-height: 2; list-style: none; padding-left: 0;">
                    ${property.amenities.slice(0, 6).map(a => `
                      <li style="padding-left: 4mm; position: relative;"><span style="position: absolute; left: 0;">•</span> ${a}</li>
                    `).join('')}
                  </ul>
                ` : ''}
              </div>

              <!-- Column 2 -->
              <div style="flex: 1;">
                <div style="color: ${this.colors.secondary}; font-size: 10pt; font-weight: 600; margin-bottom: 3mm;">
                  Ubicación
                </div>
                <ul style="color: white; font-size: 9pt; line-height: 2; list-style: none; padding-left: 0;">
                  <li style="padding-left: 4mm; position: relative;"><span style="position: absolute; left: 0;">•</span> ${property.address}</li>
                  ${property.neighborhood ? `<li style="padding-left: 4mm; position: relative;"><span style="position: absolute; left: 0;">•</span> ${property.neighborhood}</li>` : ''}
                  <li style="padding-left: 4mm; position: relative;"><span style="position: absolute; left: 0;">•</span> ${property.city || 'Córdoba'}</li>
                </ul>

                <div style="color: ${this.colors.secondary}; font-size: 10pt; font-weight: 600; margin: 6mm 0 3mm 0;">
                  Precio
                </div>
                <ul style="color: white; font-size: 9pt; line-height: 2; list-style: none; padding-left: 0;">
                  <li style="padding-left: 4mm; position: relative;"><span style="position: absolute; left: 0;">•</span> ${priceLabel}</li>
                  <li style="padding-left: 4mm; position: relative;"><span style="position: absolute; left: 0;">•</span> Consultar financiación</li>
                </ul>
              </div>
            </div>

            <!-- Contact in dark section -->
            <div style="margin-top: 15mm; padding-top: 8mm; border-top: 1px solid rgba(255,255,255,0.2);">
              <div style="text-align: center;">
                <div style="color: white; font-size: 14pt; font-weight: 700; margin-bottom: 5mm;">
                  CONECTA CON NOSOTROS
                </div>
                <div style="display: flex; justify-content: center; gap: 10mm; flex-wrap: wrap; margin-bottom: 5mm;">
                  <span style="color: rgba(255,255,255,0.8); font-size: 9pt;">🌐 ${this.company.website}</span>
                  <span style="color: rgba(255,255,255,0.8); font-size: 9pt;">📷 @${this.company.instagram}</span>
                  <span style="color: rgba(255,255,255,0.8); font-size: 9pt;">📱 ${this.company.phone}</span>
                </div>
                <div style="margin-top: 5mm;">
                  <span style="color: white; font-size: 18pt; font-weight: 700; letter-spacing: 3px;">DOMUM</span>
                  <div style="color: rgba(255,255,255,0.6); font-size: 7pt; letter-spacing: 2px;">NEGOCIOS INMOBILIARIOS</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  }
};
