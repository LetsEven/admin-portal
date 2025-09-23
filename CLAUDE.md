# Claude Configuration for Xquisito Admin Portal

## Project Commands

### Development
```bash
npm run dev          # Start development server at localhost:3000
npm run build        # Build production version
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

### Git Operations
```bash
git status           # Check git status
git add .            # Stage all changes
git commit -m "..."  # Commit with message
git push origin main # Push to main branch
```

## Project Structure

### Key Components
- `src/pages/Dashboard.tsx` - Main dashboard with dynamic branch data and order management
- `src/pages/RewardsManagement.tsx` - Rewards/Scala management with email preview and pricing modal
- `src/pages/PromotionsManagement.tsx` - Dine package management with simplified toggles
- `src/pages/MenuManagement.tsx` - Menu management interface with customizable restaurant header
- `app/pepper/page.tsx` - AI chat interface with dynamic positioning and video integration
- `src/components/Sidebar.tsx` - Navigation sidebar with SparklesIcon for AI section
- `src/components/MobileMenuPreview.tsx` - Mobile menu preview component
- `src/components/RestaurantHeader.tsx` - LinkedIn-style restaurant profile header with banner and logo
- `src/components/ImageCropModal.tsx` - Advanced image cropping modal with dynamic zoom system

### Recent Features Implemented
- Dynamic dashboard data based on selected branch/location
- Enhanced email preview with comprehensive content and redeem functionality
- Interactive order detail modals with customer information and channel tracking
- Redesigned pricing modal with glassmorphism effects
- Simplified Dine package management without problematic animations
- Refresh functionality for recent activity section
- Optimized WebP logo assets
- **Restaurant Header System**: Customizable profile header with banner and circular logo upload
- **Advanced Image Cropping**: Modal with -300% to 300% zoom range and react-easy-crop integration
- **LocalStorage Persistence**: Restaurant data persistence with SSR-safe hydration
- **Canvas Image Processing**: PNG output with transparent backgrounds
- **Pepper AI Chat Interface**: Complete chat system with dynamic positioning and animations
- **Video Integration**: Animated Pepper logo using WebM video with loop functionality
- **Dynamic UI Positioning**: Sidebar-responsive layout with customizable pixel-perfect positioning
- **SparklesIcon Integration**: Updated sidebar icon for AI section to match modern AI branding

## Development Notes

### Tech Stack
- Next.js 14 with TypeScript
- React 18 with Hooks
- Tailwind CSS for styling
- Lucide React for icons
- Recharts for data visualization
- React Beautiful DND for drag & drop
- react-easy-crop for image cropping
- Canvas API for image processing

### Styling Conventions
- Use Tailwind CSS classes
- Green theme color: `#173E44` or standard Tailwind green variants
- Glassmorphism effects with `backdrop-blur` and transparency
- Mobile-responsive design with appropriate breakpoints

### Git Configuration
- Repository: https://github.com/XquisitoAI/admin-portal.git
- User: XquisitoAI <contacto@xquisito.ai>
- Main branch: main

## Testing & Quality
Always run these commands before committing:
- `npm run lint` - Check code quality
- `npm run type-check` - Verify TypeScript types
- `npm run build` - Ensure production build works

## Image Cropping System

### Key Features
- Dynamic zoom range: -300% to 300% visual representation
- Circular crop shape with 140px radius for logo optimization
- react-easy-crop integration with percentage-based zoom mapping
- Canvas processing with PNG output to preserve transparency
- Direct modal access when no logo exists (bypasses file picker)

### Zoom Calculation Formula
```typescript
const zoomToPercent = (zoomValue: number) => {
  const midZoom = (minZoom + maxZoom) / 2;
  if (zoomValue <= midZoom) {
    return ((zoomValue - minZoom) / (midZoom - minZoom)) * 300 - 300;
  } else {
    return ((zoomValue - midZoom) / (maxZoom - midZoom)) * 300;
  }
};
```

### SSR Hydration Pattern
```typescript
const [isHydrated, setIsHydrated] = useState(false);
useEffect(() => {
  if (typeof window !== 'undefined') {
    // Safe localStorage access after hydration
    setIsHydrated(true);
  }
}, []);
```

## Pepper AI Chat System

### Key Features
- **Dynamic Positioning**: Empty state centers input bar, conversation state moves it to bottom
- **Sidebar Integration**: Smooth animations when sidebar expands/contracts
- **Video Integration**: Animated Pepper logo with WebM video loops
- **Responsive Layout**: Adapts to different screen sizes and sidebar states
- **Customizable Spacing**: Pixel-perfect control over all UI elements

### Positioning System
All major elements use inline styles for precise control:

```typescript
// Input bar positioning
style={{
  bottom: messages.length === 0 ? '350px' : '40px',           // Vertical position
  left: sidebarExpanded ? 'calc(54% + 100px)' : '54%',       // Horizontal position
  transform: 'translateX(-50%)'                               // Center alignment
}}

// Header positioning
style={{
  paddingTop: '60px',                                         // Distance from top
  paddingBottom: '32px',                                      // Space below header
  transform: sidebarExpanded ? 'translateX(30px)' : 'translateX(0)' // Sidebar animation
}}

// Message area spacing
style={{
  paddingTop: '100px',                                        // Messages start position
  paddingBottom: '80px',                                      // Space for input bar
  gap: '50px'                                                 // Space between messages
}}
```

### Video Implementation
```typescript
<video
  src="/video-icon-pepper.webm"
  autoPlay
  loop
  muted
  playsInline
  className="w-full h-full object-cover rounded-full"
/>
```

### Sidebar Detection
```typescript
useEffect(() => {
  const sidebar = document.querySelector('.hidden.md\\:flex .group');
  if (sidebar) {
    const handleMouseEnter = () => setSidebarExpanded(true);
    const handleMouseLeave = () => setSidebarExpanded(false);

    sidebar.addEventListener('mouseenter', handleMouseEnter);
    sidebar.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      sidebar.removeEventListener('mouseenter', handleMouseEnter);
      sidebar.removeEventListener('mouseleave', handleMouseLeave);
    };
  }
}, []);
```