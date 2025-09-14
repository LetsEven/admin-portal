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
- `src/pages/MenuManagement.tsx` - Menu management interface
- `src/components/Sidebar.tsx` - Navigation sidebar
- `src/components/MobileMenuPreview.tsx` - Mobile menu preview component

### Recent Features Implemented
- Dynamic dashboard data based on selected branch/location
- Enhanced email preview with comprehensive content and redeem functionality
- Interactive order detail modals with customer information and channel tracking
- Redesigned pricing modal with glassmorphism effects
- Simplified Dine package management without problematic animations
- Refresh functionality for recent activity section
- Optimized WebP logo assets

## Development Notes

### Tech Stack
- Next.js 14 with TypeScript
- React 18 with Hooks
- Tailwind CSS for styling
- Lucide React for icons
- Recharts for data visualization
- React Beautiful DND for drag & drop

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