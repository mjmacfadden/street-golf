# Street Golf - React + Vite Setup Guide

Complete guide to running, developing, and deploying the Street Golf PWA.

## Quick Start (5 minutes)

### 1. Install & Run
```bash
cd street-golf
npm install
npm run dev
```

Visit `http://localhost:3000` - app opens with HMR enabled!

### 2. Update API Key (if needed)
Edit `.env`:
```env
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 3. Start Playing
- Click **"START ROUND"** on home screen
- Tap holes on the map
- Enter your strokes with +/- buttons
- View history anytime

---

## Architecture Overview

### Tech Stack Breakdown

#### React 19
- **Why**: Industry standard for UI, excellent dev experience
- **Used for**: Components, state management, rendering
- **Key files**: `src/App.tsx`, `src/components/`

#### Vite 6
- **Why**: 10-100x faster than webpack, instant HMR
- **Used for**: Dev server, production bundling
- **Config**: `vite.config.ts`

#### Tailwind CSS 4
- **Why**: Rapid styling with @tailwindcss/vite zero-config
- **Used for**: All UI styling, responsive design
- **Config**: `src/index.css` @theme block

#### Motion (Framer Motion)
- **Why**: Smooth, performant animations
- **Used for**: Page transitions, button interactions
- **Example**: Home screen fade-in, hole card slides

#### Lucide React
- **Why**: 1000+ consistent, customizable icons
- **Used for**: Navigation, UI elements
- **Icons**: Map, Trophy, Play, ChevronLeft, etc.

#### @vis.gl/react-google-maps
- **Why**: Modern React wrapper for Google Maps API
- **Used for**: Interactive course map, markers, polylines
- **Features**: Satellite view, marker clustering, custom styling

#### TypeScript
- **Why**: Type safety, better IDE support, fewer bugs
- **Coverage**: 100% of application code
- **Check**: `npm run lint`

---

## File Organization

```
src/
├── App.tsx
│   └── Main component with routing logic
│   └── Tabs: home, map, scorecard, history
│   └── State: activeTab, currentRound, history
│   └── ~400 lines, highly commented

├── components/
│   ├── MapView.tsx
│   │   ├── Maps handler with polylines
│   │   ├── Tee & pin markers
│   │   ├── Fairway and walk path visualization
│   │   └── ~100 lines
│   │
│   └── Scorecard.tsx
│       ├── Round summary display
│       ├── Hole-by-hole breakdown
│       ├── Score calculations
│       └── ~70 lines

├── constants/
│   └── course.ts
│       └── 9 hole data array (EASY TO EDIT)
│       └── Tee/pin locations, par, descriptions, images

├── types.ts
│   ├── Hole interface (course data)
│   ├── Round interface (current game state)
│   └── Score interface (per-hole scores)

├── main.tsx
│   └── React entry point
│   └── Creates root DOM element

└── index.css
    ├── @tailwindcss/vite import
    ├── Custom @theme colors
    ├── Custom scrollbar styling
    └── Google fonts import
```

---

## Key Concepts

### State Management

All state in `App.tsx` using React hooks:

```typescript
const [activeTab, setActiveTab] = useState<'home' | 'map' | 'scorecard' | 'history'>('home')
const [currentRound, setCurrentRound] = useState<Round | null>(null)
const [history, setHistory] = useState<Round[]>([])
const [currentHoleIdx, setCurrentHoleIdx] = useState<number | null>(null)
```

- **Simple & performant** for MVP
- **No Redux/Zustand needed** (yet)
- **localStorage** auto-syncs on updates

### Data Flow

```
User Input
    ↓
Event Handler (handleSaveScore)
    ↓
Update State (setCurrentRound)
    ↓
Component Re-renders
    ↓
localStorage Updated (useEffect)
```

### Navigation

All screens in one `AnimatePresence` block:

```tsx
<AnimatePresence mode="wait">
  {activeTab === 'home' && <Home />}
  {activeTab === 'map' && <Map />}
  {activeTab === 'scorecard' && <Scorecard />}
  {activeTab === 'history' && <History />}
</AnimatePresence>
```

Bottom nav switches tabs, Motion animates transitions.

---

## Customization Examples

### Change Course

Edit `src/constants/course.ts`:

```typescript
const STREET_GOLF_COURSE: Hole[] = [
  {
    number: 1,
    name: "Your Hole Name",
    teeLocation: { lat: 42.12345, lng: -87.12345 },
    teeDescription: "Starting at the mailbox",
    par: 3,
    // ... more fields
  },
  // Add more holes...
]
```

Get coordinates: Click map in `MapView` (logs to console):
```
STREET GOLF COORDS: { lat: 42.123456, lng: -87.123456 }
```

### Change Colors

Edit `src/index.css`:

```css
@theme {
  --color-lime: #00FF00;        /* Change to your color */
  --color-navy: #1a1a2e;
  --color-dark: #000000;
}
```

Instantly updates entire app!

### Add New Screen

1. Create component `src/components/NewScreen.tsx`
2. Add tab type in `App.tsx`: `'home' | 'map' | 'newscreen'`
3. Add screen case in AnimatePresence
4. Add nav button in bottom nav

### Add Animation

Use Motion's `<motion>` component:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

---

## Development Workflow

### Local Development

```bash
npm run dev
```

- Opens `http://localhost:3000`
- File changes auto-reload (HMR)
- Source maps enabled for debugging
- React DevTools available

### Terminal Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview build locally
npm run preview

# Check TypeScript
npm run lint

# Install new package
npm install package-name

# Update all packages
npm update
```

### Debugging

#### Browser Console
```javascript
// View current round
console.log(JSON.parse(localStorage.getItem('currentRound')))

// View history
console.log(JSON.parse(localStorage.getItem('roundHistory')))

// Clear all data
localStorage.clear()

// Test coordinates
// Logged automatically when you click the map
```

#### React DevTools Extension
- Install: [Chrome](https://chrome.google.com/webstore/) or [Firefox](https://addons.mozilla.org/)
- View component tree
- Inspect props/state
- Profile performance

#### VS Code
- Install ESLint extension
- Install Tailwind CSS IntelliSense
- Get autocomplete & error checking

---

## Building & Deployment

### Production Build

```bash
npm run build
```

Creates `/dist` folder with:
- Minified JS (~150KB gzipped)
- Optimized CSS
- Hashed assets for cache busting
- Ready for any static host

### Deploy to Netlify

```bash
npm run build
# Visit netlify.com → Drop dist folder
# Or connect GitHub for auto-deploys
```

### Deploy to Vercel

```bash
# Push to GitHub
# Visit vercel.com → Connect repo
# Auto-builds and deploys on push
```

### Deploy to GitHub Pages

1. Update `vite.config.ts`:
```typescript
export default {
  base: '/street-golf/'
}
```

2. Build: `npm run build`

3. Deploy `dist/` to `gh-pages` branch

### Self-Hosted

Copy `dist/` contents to your web server:
- Apache: Put in `public_html/`
- nginx: Configure root directory
- Node.js: Serve with express static middleware

---

## Environment Variables

### .env File

```env
# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAVHLglxnboeHJQ5cJ0x1CQEe8BeCrkzlI

# Alternative naming
GOOGLE_MAPS_PLATFORM_KEY=AIzaSyAVHLglxnboeHJQ5cJ0x1CQEe8BeCrkzlI
```

### Variable Naming
- `VITE_` prefix = exposed to client (visible in browser)
- Regular name = only server-side (if using backend)

### Security
- **Never** commit real API keys to Git
- Add `.env` to `.gitignore`
- Use `.env.example` for documentation

---

## Performance Tips

### Development
- Use Vite's dev server (faster than webpack)
- React DevTools for component profiling
- Check bundle size: `npm run build` → see `/dist` size

### Production
- Vite tree-shakes unused code automatically
- CSS is inline-critical and defer non-critical
- Images optimized by build process
- Minification and compression enabled

### Optimization Opportunities
- Code-split route components (when multi-page)
- Lazy load images with IntersectionObserver
- Memoize expensive components with `React.memo`
- Profile with Lighthouse or WebPageTest

---

## Common Issues & Solutions

### "Cannot find module 'motion'"
```bash
npm install motion
```

### "Google Maps API not loading"
- Check .env has valid API key
- Check API key has Maps JavaScript API enabled
- Check browser console for specific errors

### "Port 3000 already in use"
```bash
npm run dev -- --port 3001
```

### "Build fails with TypeScript error"
```bash
npm run lint  # Check errors
npx tsc --noEmit  # Full type check
```

### "localStorage not persisting"
- Check if private/incognito mode
- Clear browser cache
- Check storage quota (DevTools → Application)

---

## Next Steps & Enhancements

### MVP Complete ✅
- [x] Interactive map
- [x] Score tracking
- [x] History persistence
- [x] PWA ready
- [x] Beautiful UI

### Phase 2 Candidates
- [ ] Fairway accuracy tracking
- [ ] Weather integration
- [ ] Friend leaderboard
- [ ] Custom courses
- [ ] Video tutorials per hole
- [ ] Stats dashboard
- [ ] Social sharing
- [ ] Notification reminders

### Backend Integration (Future)
- [ ] Firebase/Supabase for sync
- [ ] User accounts & cloud sync
- [ ] Multiplayer mode
- [ ] Course database
- [ ] Leaderboards

---

## Resources

- **Official Docs**: https://vitejs.dev/, https://react.dev/
- **Tailwind Docs**: https://tailwindcss.com/
- **Motion Docs**: https://motion.dev/
- **Google Maps**: https://developers.google.com/maps
- **TypeScript**: https://www.typescriptlang.org/docs/

---

## Support

Having issues? Try:
1. Check browser console for errors
2. Clear cache: DevTools → Application → Clear storage
3. Reinstall: `rm -rf node_modules && npm install`
4. Check `.env` file has correct API key

---

**Happy coding! 🎉⛳**
