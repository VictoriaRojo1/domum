# DOMUM - Sistema de Gestión Inmobiliaria

Prototipo interactivo navegable de un sistema de gestión inmobiliaria, construido con HTML, CSS y JavaScript vanilla.

## Características

- **10 Pantallas completas**: Login, Dashboard, Propiedades, CRM, Contactos, Calendario, Administraciones, Documentos IA, Caja, Informes
- **16 Modales**: Confirmación, Upload, Selector de usuarios, y modales de creación para propiedades, leads, contactos, transacciones, eventos y documentos
- **3 Paneles de detalle**: Propiedad, Lead, Transacción
- **Sistema de toasts**: Notificaciones de éxito, error, advertencia e información
- **Datos mock realistas**: Propiedades, contactos, leads, transacciones y eventos con datos argentinos
- **Design system completo**: Variables CSS, componentes reutilizables, responsive

## Estructura del Proyecto

```
src/
├── index.html          # Punto de entrada de la aplicación
├── css/
│   ├── variables.css   # Variables del design system
│   ├── styles.css      # Estilos globales y layouts
│   └── components.css  # Estilos de modales, toasts y paneles
├── js/
│   ├── data.js         # Carga y gestión de datos mock
│   ├── utils.js        # Funciones utilitarias
│   ├── components.js   # Componentes UI reutilizables
│   ├── pages.js        # Templates de las páginas
│   ├── modals.js       # Sistema de modales y toasts
│   ├── panels.js       # Paneles de detalle
│   └── app.js          # Router y lógica principal
└── data/
    ├── properties.json   # 12 propiedades
    ├── contacts.json     # 20 contactos
    ├── leads.json        # 15 leads en diferentes etapas
    ├── transactions.json # 20 transacciones
    ├── events.json       # 12 eventos de calendario
    └── users.json        # 4 usuarios
```

## Cómo ejecutar

### Opción 1: Servidor local simple

```bash
# Con Python 3
cd src
python -m http.server 8080

# Con Node.js (si tienes http-server instalado)
cd src
npx http-server -p 8080
```

Luego abrir `http://localhost:8080` en el navegador.

### Opción 2: Live Server (VS Code)

1. Instalar la extensión "Live Server" en VS Code
2. Click derecho en `src/index.html`
3. Seleccionar "Open with Live Server"

### Opción 3: Abrir directamente

Algunos navegadores permiten abrir el archivo `index.html` directamente, pero los archivos JSON podrían no cargarse por restricciones de CORS.

## Credenciales de acceso

- **Email**: admin@domum.com.ar
- **Contraseña**: demo123

(Cualquier valor funciona en este prototipo)

## Navegación

### Páginas principales

| Página | Descripción |
|--------|-------------|
| Dashboard | Resumen general con métricas, pipeline, eventos y transacciones |
| Propiedades | Grid de propiedades con filtros y vista lista/grid |
| CRM | Pipeline de leads con drag & drop entre etapas |
| Contactos | Tabla de contactos con búsqueda y filtros |
| Calendario | Vista mensual con eventos y panel lateral |
| Administraciones | Gestión de consorcios y edificios |
| Documentos IA | Gestión de documentos con asistente IA |
| Caja | Movimientos financieros con filtros y resumen |
| Informes | Reportes y métricas de rendimiento |

### Interacciones disponibles

- **Click en tarjetas** de propiedades, leads o transacciones: Abre panel de detalle
- **Drag & drop** en CRM: Mueve leads entre etapas del pipeline
- **Botón "Nuevo"** en header: Abre modal de creación según la página actual
- **Tabs y filtros**: Filtran contenido en cada página
- **Búsqueda**: Filtra contenido en tiempo real

## Tecnologías utilizadas

- HTML5 semántico
- CSS3 con custom properties (variables)
- JavaScript ES6+ vanilla (sin frameworks)
- Lucide Icons
- Google Fonts (Inter)

## Diseño

El diseño está basado en el archivo `inmobiliaria.pen` creado con Pencil, siguiendo un estilo dark theme moderno con:

- **Colores principales**: Cyan (#00D4FF), Purple (#A855F7), Green (#00FF88)
- **Fondos**: Negro azulado (#0A0E14 a #12161E)
- **Tipografía**: Inter con pesos 400, 500, 600, 700
- **Espaciado**: Sistema de 4px (4, 8, 12, 16, 20, 24, 32, 48)
- **Border radius**: 4, 8, 12, 16px y pill

## Próximos pasos

Este prototipo es una base para desarrollo. Las siguientes features requerirían backend:

- [ ] Autenticación real con JWT
- [ ] CRUD completo de propiedades, contactos, leads
- [ ] Persistencia de datos en base de datos
- [ ] Upload real de imágenes y documentos
- [ ] Generación de documentos con IA
- [ ] Notificaciones en tiempo real

---

Desarrollado para **DOMUM Inmobiliaria** - domuminmobiliaria.com.ar
