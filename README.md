# Xquisito Admin Portal

Portal de administración para la gestión de restaurantes Xquisito. Aplicación Next.js con TypeScript que permite administrar sucursales, menús, promociones, recompensas y análisis de datos.

## 🚀 Características

### Dashboard Dinámico
- **Datos por sucursal**: Métricas específicas que cambian según la ubicación seleccionada
- **Gestión de pedidos**: Vista detallada de pedidos con información del cliente y canal
- **Actividad reciente**: Lista actualizable de actividades con botón de refresh
- **Análisis en tiempo real**: Gráficos y estadísticas interactivas

### Gestión de Scala (Recompensas)
- **Vista previa de email**: Contenido completo con funcionalidad de canje
- **Modal de precios**: Diseño glassmorphism con efectos visuales modernos
- **Gestión de campañas**: Control completo de promociones y recompensas

### Gestión de Dine (Promociones)  
- **Administración simplificada**: Toggles sin animaciones problemáticas
- **Drag & drop**: Reordenamiento intuitivo de elementos
- **Vista móvil optimizada**: Interfaz responsive para todos los dispositivos

### Gestión de Menú
- **Header personalizable**: Sección tipo LinkedIn con banner, logo circular y nombre editable
- **Sistema de recorte avanzado**: Modal con zoom dinámico -300% a 300% para logos
- **Editor visual**: Interfaz intuitiva para modificar menús con persistencia localStorage
- **Vista previa móvil**: Simulación en tiempo real de la aplicación móvil
- **Organización por categorías**: Estructura clara y fácil navegación

### Pepper AI Chat
- **Interfaz de chat inteligente**: Sistema de conversación con IA integrado
- **Posicionamiento dinámico**: La UI se adapta automáticamente al estado de conversación
- **Animaciones fluidas**: Transiciones suaves cuando se expande/contrae el sidebar
- **Video integración**: Logo animado de Pepper con video WebM en loop infinito
- **Control granular**: Posicionamiento pixel-perfect de todos los elementos UI
- **Responsive design**: Adaptación automática a diferentes tamaños de pantalla

## 🛠️ Tecnologías

- **Framework**: Next.js 14 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Íconos**: Lucide React  
- **Gráficos**: Recharts
- **Drag & Drop**: React Beautiful DND
- **Recorte de imágenes**: react-easy-crop
- **Estado**: React Hooks (useState, useEffect, useCallback)
- **Canvas API**: Para procesamiento de imágenes

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/XquisitoAI/admin-portal.git
cd admin-portal

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 🔧 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción  
npm run start        # Servidor de producción
npm run lint         # Verificar código con ESLint
npm run type-check   # Verificar tipos de TypeScript
```

## 📁 Estructura del Proyecto

```
src/
├── pages/                    # Páginas principales
│   ├── Dashboard.tsx         # Dashboard con datos dinámicos
│   ├── RewardsManagement.tsx # Gestión de recompensas/Scala
│   ├── PromotionsManagement.tsx # Gestión de promociones/Dine
│   ├── MenuManagement.tsx    # Gestión de menús
│   └── Settings.tsx          # Configuraciones
├── components/               # Componentes reutilizables
│   ├── Sidebar.tsx          # Barra lateral con SparklesIcon para IA
│   ├── MobileMenuPreview.tsx # Vista previa móvil
│   ├── RestaurantHeader.tsx # Header personalizable para menús
│   ├── ImageCropModal.tsx   # Modal de recorte con zoom avanzado
│   └── Layout.tsx           # Layout con detección de sidebar
└── app/                     # App Router de Next.js
    ├── pepper/              # Chat de IA
    │   └── page.tsx         # Interfaz de Pepper con video y posicionamiento dinámico
    ├── layout.tsx           # Layout principal
    └── page.tsx             # Página de inicio
```

## 🎨 Guía de Estilos

### Colores
- **Verde principal**: `#173E44`
- **Verde Tailwind**: `green-400`, `green-500`, `green-600`
- **Glassmorphism**: `backdrop-blur-sm` con transparencias

### Componentes
- **Modales**: Efectos glassmorphism con `backdrop-blur`
- **Botones**: Esquinas redondeadas con hover effects
- **Tarjetas**: Sombras sutiles y bordes suaves
- **Responsive**: Mobile-first approach

## 🔄 Funcionalidades Principales

### Dashboard Interactivo
- Cambio de datos según sucursal seleccionada
- Modales detallados para cada pedido
- Información de canal (Tap Order & Pay, Pick N Go)
- Botón de actualización para actividad reciente

### Email Marketing
- Vista previa completa con scroll
- Botón de canje funcional con alertas
- Contenido realista con testimonios y promociones
- Diseño optimizado para móvil y desktop

### Gestión Simplificada
- Toggles sin animaciones complejas
- Cambios de estado inmediatos
- Interfaz limpia y moderna
- Feedback visual claro

### Sistema Pepper AI
- **Detección de sidebar**: JavaScript detecta expansión/contracción automáticamente
- **Posicionamiento dinámico**: Elementos se mueven con transiciones de 300ms
- **Video loops**: Logo animado con `/video-icon-pepper.webm` en reproducción continua
- **Control granular**: Todos los elementos posicionables via inline styles con píxeles exactos
- **Estados adaptativos**: Interfaz diferente para conversación vacía vs activa
- **Responsive width**: Barras se contraen automáticamente cuando se expande el sidebar

## 🚀 Deploy

El proyecto está configurado para deploy automático. Para deploy manual:

```bash
# Build del proyecto
npm run build

# Iniciar en producción
npm start
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Comandos Git

```bash
git status                    # Estado actual
git add .                    # Añadir todos los cambios
git commit -m "mensaje"      # Commit con mensaje
git push origin main         # Push a main branch
```

## 📄 Licencia

Proyecto privado de Xquisito AI - Todos los derechos reservados.

---

Desarrollado con ❤️ para **Xquisito** | Contacto: contacto@xquisito.ai
