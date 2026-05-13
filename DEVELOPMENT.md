# Development Guide - Street Golf

Complete reference for developers working on the Street Golf React + Vite application.

## Project Overview

Street Golf is a **Progressive Web App (PWA)** for tracking street golf scores. It's built as a **single-page application (SPA)** with client-side routing and offline-first architecture.

**Key Characteristics:**
- Modern React 19 with TypeScript
- Vite for lightning-fast builds
- Tailwind CSS for styling
- Motion for animations
- 100% localStorage persistence
- No backend required

---

## Quick Commands

```bash
# Development
npm run dev                 # Start dev server on :3000

# Production
npm run build               # Create optimized build
npm run preview             # Preview production build locally

# Quality
npm run lint                # Check TypeScript

# Utilities
npm install                 # Install dependencies
npm update                  # Update all packages
rm -rf node_modules && npm install  # Full reinstall
```

---

## Architecture

### Application State

All state lives in `App.tsx` using React hooks:

```typescript
// Active tab/screen
const [activeTab, setActiveTab] = useState('home')

// Current round being played
const [currentRound, setCurrentRound] = useState<Round | null>(null)

// List of completed rounds
const [history, setHistory] = useState<Round[]>([])

// Which hole is selected
const [currentHoleIdx, setCurrentHoleIdx] = useState<number | null>(null)

// Temporary stroke input
const [tempScore, setTempScore] = useState<number>(4)
```

### State Persistence

```typescript
// Load from localStorage on mount
useEffect(() => {
  const saved = localStorage.getItem('currentRound')
  if (saved) setCurrentRound(JSON.parse(saved))
}, [])

// Auto-save when round changes
useEffect(() => {
  if (currentRound) {
    localStorage.setItem('currentRound', JSON.stringify(currentRound))
  }
}, [currentRound])
```

### Component Hierarchy

```
App (main container, state management)
├── AnimatePresence (Motion provider)
│   ├── Home Screen
│   ├── Map Screen
│   │   └── MapView Component
│   │       ├── Map Handler (Polylines)
│   │       └── Markers (Tee & Pin)
│   ├── Scorecard Screen
│   │   └── Scorecard Component
│   └── History Screen
├── Lightbox (Image viewer)
└── Navigation Bar
    ├── Nav Buttons (active state)
    └── Screen Router
```

---

## Key Components

### App.tsx (~400 lines)

**Responsibilities:**
- Screen/tab routing
- State management
- Event handlers for scoring
- localStorage integration
- APIs Provider wrapper

**Important Functions:**
- `startNewRound()` - Initialize game
- `handleSaveScore()` - Save hole score and advance
- `finishRound()` - End game and save to history

### MapView.tsx (~150 lines)

**Responsibilities:**
- Render Google Map with satellite view
- Display tee & pin markers
- Draw fairway lines (tee to pin)
- Draw walk paths (pin to next tee)
- Handle marker clicks

**Key Details:**
- Uses @vis.gl/react-google-maps
- MapHandler component manages polylines
- Markers have custom styling
- Current hole highlighted with glow effect

### Scorecard.tsx (~80 lines)

**Responsibilities:**
- Display round summary statistics
- Show hole-by-hole breakdown
- Calculate scores vs par
- Color-code performance

**Calculations:**
```typescript
const totalPar = holes.reduce((acc, h) => acc + h.par, 0)
const totalStrokes = Object.values(round.scores).reduce((acc, s) => acc + s.strokes, 0)
const diff = totalStrokes - totalPar
```

---

## Type Definitions

### Hole Interface
```typescript
interface Hole {
  number: number                // 1-9
  name: string                  // Display name
  teeLocation: LatLng           // Starting point
  pinLocation: LatLng           // Ending point
  teeDescription: string        // Where to start
  pinDescription: string        // Where to end
  teeImage?: string             // Photo of tee area
  pinImage?: string             // Photo of pin area
  par: number                   // Par (3-5)
  description: string           // Gameplay notes
}
```

### Round Interface
```typescript
interface Round {
  id: string                    // Unique ID
  date: string                  // ISO timestamp
  scores: Record<number, Score> // Hole # → Score
  isCompleted: boolean          // Finished or in progress
}
```

### Score Interface
```typescript
interface Score {
  strokes: number               // Required
  putts?: number                // Optional
  notes?: string                // Optional
}
```

---

## Course Data

**File:** `src/constants/course.ts`

Contains array of 9 holes with full data. Easy to edit:

```typescript
export const STREET_GOLF_COURSE: Hole[] = [
  {
    number: 1,
    name: "The Southbridge Opener",
    teeLocation: { lat: 42.13841, lng: -87.81881 },
    // ...
  },
  // 8 more holes...
]
```

**To Add Coordinates:**
1. Click map in app
2. Check browser console: `STREET GOLF COORDS: { lat: X, lng: Y }`
3. Copy into course.ts

---

## Styling System

### Tailwind CSS 4

Using `@tailwindcss/vite` plugin for zero-config:

```typescript
// vite.config.ts
plugins: [react(), tailwindcss()],
```

### Custom Colors

Defined in `src/index.css`:

```css
@theme {
  --color-lime: #BFFF00;        /* Primary accent */
  --color-navy: #0A192F;        /* Secondary */
  --color-dark: #010409;        /* Background */
}
```

### Using in Components

```tsx
// Tailwind utility classes
<div className="bg-dark text-lime border-2 border-navy">

// Custom color variables
<div className="bg-lime text-dark">

// Responsive
<div className="px-4 md:px-8 lg:px-12">
```

### Important Classes

```css
.italic-font-fix { font-family: inherit; }
.glow-lime { box-shadow: 0 0 20px rgba(191,255,0,0.3); }
```

---

## Animation with Motion

### Common Patterns

**Page Transition:**
```tsx
<motion.div
  initial={{ opacity: 0, x: 100 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -100 }}
>
  Page content
</motion.div>
```

**Element Entrance:**
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ delay: 0.1, duration: 0.3 }}
>
  Card
</motion.div>
```

**Conditional Animation:**
```tsx
<AnimatePresence>
  {isExpanded && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
    >
      Expandable content
    </motion.div>
  )}
</AnimatePresence>
```

---

## Icons with Lucide React

### Importing
```tsx
import { MapIcon, Trophy, Play, ChevronRight } from 'lucide-react'
```

### Using
```tsx
<MapIcon size={24} strokeWidth={2} className="text-lime" />
```

### Styling
```tsx
// Size: 12, 16, 20, 24, 32, 48, etc.
// Stroke width: 1, 1.5, 2, 2.5, 3
// Colors: Tailwind classes or custom
<Icon size={24} strokeWidth={3} className="text-lime drop-shadow-lg" />
```

---

## Google Maps Integration

### Setup

```typescript
// In App.tsx
import { APIProvider } from '@vis.gl/react-google-maps'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

return (
  <APIProvider apiKey={API_KEY}>
    <MapView holes={STREET_GOLF_COURSE} />
  </APIProvider>
)
```

### Map Component

```typescript
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'

<Map
  defaultCenter={{ lat: 42.13, lng: -87.82 }}
  defaultZoom={17}
  mapTypeId="satellite"
  disableDefaultUI={true}
>
  <AdvancedMarker position={{ lat: 42.13, lng: -87.82 }}>
    <Pin background="#BFFF00" glyph="1" />
  </AdvancedMarker>
</Map>
```

### Markers

```typescript
// Tee marker (white background)
<AdvancedMarker position={teeLocation}>
  <div className="bg-white border-lime text-sm font-bold">T1</div>
</AdvancedMarker>

// Pin marker (using Pin component)
<AdvancedMarker position={pinLocation}>
  <Pin background="#BFFF00" glyphColor="#010409" glyph="1" />
</AdvancedMarker>
```

### Polylines (Course paths)

```typescript
new google.maps.Polyline({
  path: [hole.teeLocation, hole.pinLocation],
  geodesic: true,
  strokeColor: '#BFFF00',
  strokeOpacity: 0.3,
  strokeWeight: 2,
  map: map
})
```

---

## Environment Configuration

### .env File
```env
# Maps API Key - gets loaded as VITE_GOOGLE_MAPS_API_KEY
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAVHLglxnboeHJQ5cJ0x1CQEe8BeCrkzlI

# Alternative naming
GOOGLE_MAPS_PLATFORM_KEY=AIzaSyAVHLglxnboeHJQ5cJ0x1CQEe8BeCrkzlI
```

### Accessing in Code
```typescript
// Vite env vars
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// Or via process.env (for compatibility)
const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY
```

### Vite Config
```typescript
define: {
  'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(env.GOOGLE_MAPS_PLATFORM_KEY || '')
}
```

---

## Event Handling

### Scoring

```typescript
const handleSaveScore = () => {
  // Validate input
  if (!currentRound || currentHoleIdx === null) return
  
  const strokes = tempScore
  const holeNum = STREET_GOLF_COURSE[currentHoleIdx].number
  
  // Update scores
  const newScores = {
    ...currentRound.scores,
    [holeNum]: { strokes, putts, notes }
  }
  
  // Update round
  setCurrentRound({ ...currentRound, scores: newScores })
  
  // Advance to next hole or finish
  if (currentHoleIdx < 8) {
    setCurrentHoleIdx(currentHoleIdx + 1)
  } else {
    finishRound()
  }
}
```

### Navigation

```typescript
// Switch screens
<button onClick={() => setActiveTab('map')}>
  View Map
</button>

// Change hole
<button onClick={() => setCurrentHoleIdx(idx)}>
  Hole {STREET_GOLF_COURSE[idx].number}
</button>
```

---

## Testing

### Manual Testing Checklist

- [ ] Can start new round
- [ ] Can save scores for all 9 holes
- [ ] Scores persist on page reload
- [ ] Previous rounds saved to history
- [ ] Map displays all holes
- [ ] Markers clickable and navigable
- [ ] Can't save without stroke count
- [ ] Par calculations correct
- [ ] UI responsive on mobile
- [ ] Animations smooth

### Browser Console Testing

```javascript
// Check round state
JSON.parse(localStorage.getItem('currentRound'))

// Check history
JSON.parse(localStorage.getItem('roundHistory'))

// Check total score
const round = JSON.parse(localStorage.getItem('currentRound'))
Object.values(round.scores).reduce((a, s) => a + s.strokes, 0)
```

---

## Performance Optimization

### Build Analysis

```bash
npm run build
# Check dist/ folder size
ls -lh dist/
```

### Runtime Performance

```typescript
// Use React.memo for expensive components
export default React.memo(MapView)

// Optimize re-renders
const handleSaveScore = useCallback(() => { ... }, [dependencies])

// Lazy load heavy components if needed (future)
const MapView = lazy(() => import('./components/MapView'))
```

### Lighthouse Audit

1. `npm run build && npm run preview`
2. Open DevTools → Lighthouse
3. Run audit
4. Check metrics:
   - FCP (First Contentful Paint): <1s
   - LCP (Largest Contentful Paint): <2.5s
   - CLS (Cumulative Layout Shift): <0.1
   - TTI (Time to Interactive): <3.5s

---

## Debugging Tips

### Common Issues

**Problem:** Round not saving
```javascript
// Check localStorage access
console.log(localStorage.getItem('currentRound'))

// Force save
localStorage.setItem('currentRound', JSON.stringify(currentRound))
```

**Problem:** Map not rendering
```javascript
// Check API key
console.log(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)

// Check console for auth errors
// Check Network tab for failed requests
```

**Problem:** HMR not working
```bash
# Check firewall/port
lsof -i :3000

# Restart dev server
npm run dev
```

### React DevTools

```javascript
// In browser console, React DevTools shows:
// - Component tree
// - Props of each component
// - State of hooks
// - Performance profiling
```

---

## Future Extensibility

### Adding Features

**New Screen:**
1. Create `src/components/NewScreen.tsx`
2. Add type to `activeTab` union
3. Add case in AnimatePresence
4. Add nav button

**New Data Field:**
1. Add to `Hole` interface in `types.ts`
2. Update all hole objects in `course.ts`
3. Display in `Scorecard` or `MapView`

**New Animation:**
1. Wrap in `<motion.div>`
2. Set `initial`, `animate`, `exit` props
3. Wrap in `<AnimatePresence>` if conditional

---

## Deployment Checklist

- [ ] All environment variables in `.env`
- [ ] `npm run build` succeeds
- [ ] `npm run lint` shows no errors
- [ ] Tested on mobile device
- [ ] localStorage clearing doesn't break app
- [ ] Offline mode tested
- [ ] All 9 holes have proper data
- [ ] Images loading correctly
- [ ] API key active and tested
- [ ] README updated with instructions

---

## Resources

- React: https://react.dev/
- Vite: https://vitejs.dev/
- Tailwind: https://tailwindcss.com/
- Motion: https://motion.dev/
- Lucide Icons: https://lucide.dev/
- Google Maps: https://developers.google.com/maps/documentation/javascript

---

**Happy developing! 🚀⛳**
