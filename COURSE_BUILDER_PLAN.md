# Course Builder Implementation Plan

**Last Updated:** May 15, 2026  
**Status:** Planning Phase - Ready to implement  
**Priority:** Phase 1 MVP (9-14 hours estimated)

---

## Overview

Implementation plan for adding a fully-functional, Firebase-backed Course Builder to Street Golf. Users will be able to create custom street golf courses by walking around, capturing GPS locations for tee and pin positions, uploading photos, and publishing courses for playback.

---

## Key Decision: GPS Location Capture (NOT Map Pinning)

### Why GPS is Better
- ✅ Users are outside creating courses (natural outdoor use case)
- ✅ Eliminates need for fiddly map dragging on mobile
- ✅ Faster workflow: tap button → instant GPS capture
- ✅ More intuitive UX
- ✅ Simpler implementation (no map modal needed)

### Challenges & Mitigations
- ⚠️ GPS accuracy varies (±5-15m typical, up to 50m in cities/indoors)
  - *Mitigation:* Show accuracy to user, allow retry if poor signal
- ⚠️ Takes ~5-10 seconds to acquire lock
  - *Mitigation:* Loading state with clear feedback
- ⚠️ Users must grant location permission
  - *Mitigation:* Browser native permission prompt, clear messaging

---

## Data Storage Strategy: Dual Storage Model

### Logged-Out Users (localStorage)
- **Rounds**: Stored locally on device
- **Score History**: Persists between app sessions
- **No Sign-In Friction**: Try the app immediately
- **Why**: Lower barrier to entry, test drive the app

### Logged-In Users (Firestore)
- **Rounds**: Synced to Firebase
- **Score History**: Cloud backup, multi-device access
- **Course Builder**: ONLY available when logged in
- **Why**: Enables course attribution, prevents anonymous courses in DB

### Storage Routing
```typescript
// Example: saveRound(round)
if (currentUser?.uid) {
  // Save to Firestore
  await db.collection('users')
    .doc(currentUser.uid)
    .collection('rounds')
    .add(round);
} else {
  // Save to localStorage
  const rounds = JSON.parse(localStorage.getItem('roundHistory') || '[]');
  rounds.push(round);
  localStorage.setItem('roundHistory', JSON.stringify(rounds));
}
```

### Feature Matrix
| Feature | Logged Out | Logged In |
|---------|-----------|----------|
| Play rounds | ✅ (local) | ✅ (cloud) |
| Score history | ✅ (local) | ✅ (cloud) |
| View courses | Pre-made only | Pre-made + custom |
| **Build courses** | ❌ Blocked | ✅ Allowed |
| Multi-device sync | ❌ No | ✅ Yes |

---

## Authentication & Access Control

### Builder Page Gating
The Course Builder tab MUST require authentication:
- **If logged out**: Show auth modal instead of builder form
  - Message: "Sign in to build and share courses"
  - CTA: "Sign Up" / "Log In"
- **If logged in**: Show full builder form
- **Implementation**: Check `currentUser?.uid` before rendering builder content

### Why Gating is Essential
- Courses must belong to a user (database consistency)
- Can't mix local builder state with cloud course library
- Prevents orphaned courses in Firestore
- Users need ownership/attribution

---

## Database Schema (Firestore)

### Collection: `courses/{userId}/{courseId}`

```typescript
{
  id: string (auto-generated)
  userId: string (creator)
  courseName: string
  courseCity: string
  courseAddress: string
  createdAt: timestamp
  updatedAt: timestamp
  isPublished: boolean
  
  holes: [
    {
      number: number
      name: string
      par: number
      
      teeLocation: {
        lat: number
        lng: number
        accuracy: number (meters)
      }
      pinLocation: {
        lat: number
        lng: number
        accuracy: number (meters)
      }
      
      teeDescription: string
      pinDescription: string
      
      teeImageUrl: string (Firebase Storage URL)
      pinImageUrl: string (Firebase Storage URL)
      
      tip: string (optional)
      hazard: boolean
    }
  ]
}
```

### Firestore Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /courses/{userId}/{courseId=**} {
      // Only creator can read/write their own courses
      allow read, write: if request.auth.uid == userId;
      // Public courses can be read by anyone
      allow read: if resource.data.isPublished == true;
    }
  }
}
```

### Firebase Storage Structure
```
courses/
  {userId}/
    {courseId}/
      holes/
        {holeNumber}/
          tee.jpg
          pin.jpg
```

---

## Implementation: Phase 1 MVP (9-14 hours)

### 1. Firebase Setup (2-3 hours)
- [ ] Create Firebase project (or use existing)
- [ ] Initialize Firestore database
- [ ] Set up Firebase Storage
- [ ] Configure Firebase Authentication (email/password or Google Sign-In)
- [ ] Create `.env` file with Firebase config
- [ ] Install Firebase packages: `npm install firebase`
- [ ] Create `src/config/firebase.ts` with initialization code
- [ ] Test Firebase connection

**Files to create:**
- `src/config/firebase.ts` - Firebase initialization
- `.env.local` - Firebase credentials (ignored by git)
- Update `package.json` if needed

---

### 2. Authentication Setup (2-3 hours)
- [ ] Create Auth context (`src/context/AuthContext.tsx`)
- [ ] Implement Firebase Auth provider
- [ ] Add login/signup page or modal
- [ ] Add logout functionality
- [ ] Protect Course Builder (redirect if not authenticated)
- [ ] Store `currentUser.uid` in global state
- [ ] Test auth flow (signup → login → logout)

**Components to create/modify:**
- `src/context/AuthContext.tsx` (new)
- `src/components/LoginModal.tsx` or `LoginPage.tsx` (new)
- `src/App.tsx` - Add auth check, protect routes

---

### 3. GPS Location Capture (1-2 hours)
- [ ] Create geolocation utility (`src/utils/geolocation.ts`)
- [ ] Implement `captureGPSLocation()` function
  - Use `navigator.geolocation.getCurrentPosition()`
  - Handle permissions (granted, denied, error)
  - Set timeout: 30 seconds
  - Return: `{ lat, lng, accuracy }`
- [ ] Add GPS capture to CourseBuilder component
  - Update "Drop Tee Location" button handler
  - Update "Drop Pin Location" button handler
- [ ] Add UI states:
  - "📍 Drop Tee Location" (default)
  - "📍 Acquiring GPS..." (loading)
  - "✓ Tee Location (40.71, -74.00) ±12m" (success)
  - "✗ Couldn't capture (tap to retry)" (error)
- [ ] Show accuracy warning if > 30 meters
- [ ] Add retry button if GPS fails

**Files to create/modify:**
- `src/utils/geolocation.ts` (new)
- `src/components/CourseBuilder.tsx` - Add capture handlers
- `src/components/CourseBuilder.tsx` - Update button UI/states

---

### 4. Image Upload to Firebase Storage (2-3 hours)
- [ ] Add image input handlers to "Add Photo Tee" / "Add Photo Pin" buttons
- [ ] Implement image upload function
  - Get file from input
  - Validate file type (JPG, PNG only)
  - Validate file size (< 10MB)
  - Show loading state
  - Upload to Firebase Storage
  - Get download URL
  - Store URL in state
- [ ] Add image preview in form (optional but nice)
- [ ] Handle upload errors gracefully
- [ ] Add upload progress indicator (optional)

**Files to create/modify:**
- `src/utils/imageUpload.ts` (new)
- `src/components/CourseBuilder.tsx` - Add image handlers

---

### 5. Course Submission to Firestore (2-3 hours)
- [ ] Create validation function to check all required fields:
  - Course name ✓
  - City ✓
  - At least 1 hole
  - All holes have: name, par, tee location, pin location, both images
  - Optional: descriptions
- [ ] Create `publishCourse()` function
  - Get current user ID
  - Generate course ID
  - Create course object with all hole data
  - Upload to Firestore: `courses/{userId}/{courseId}`
  - Handle errors (network, permissions, etc.)
  - Show success message
  - Clear form and reset state
- [ ] Add error handling with user-friendly messages
- [ ] Add loading state during submission

**Files to create/modify:**
- `src/utils/courseSubmission.ts` (new)
- `src/components/CourseBuilder.tsx` - Add publish handler

---

### 6. Course Selector Integration (1-2 hours)
- [ ] Create function to fetch user's courses from Firestore
- [ ] Call on app load (in `useEffect`)
- [ ] Update course selector dropdown to include:
  - Pre-made courses (Street Golf, Glenbrook)
  - User's own created courses
- [ ] Allow selecting a user-created course to play a round
- [ ] Test: Create course → Select it → Play round

**Files to create/modify:**
- `src/App.tsx` - Add fetch courses on load
- `src/App.tsx` - Update course selector dropdown

---

## Implementation: Phase 2 UX Polish (10-14 hours)
*Do these AFTER MVP is working*

### Core Enhancements
- [ ] **Empty States** (1 hour)
  - "No rounds yet. Start playing!" on History tab
  - "No courses available. Build one!" on Map tab
  - Better visual feedback than blank screens

- [ ] **Score Editing Mid-Round** (2-3 hours)
  - Tap a hole in Scorecard to edit the score
  - Show current score with edit option
  - Confirmation dialog to prevent accidents
  - Update round data and history
  - Very common in golf apps, users expect it

- [ ] **Undo Last Shot** (1-2 hours)
  - Add undo button during scoring
  - Revert last stroke with one tap
  - Quality of life feature
  - Add satisfying Framer Motion animation

- [ ] **Course Preview** (1-2 hours)
  - Before starting a round, show all holes summary
  - Display: Hole # | Par | Description
  - Builds confidence, prevents surprises
  - Add to course selector

### Data & Analytics
- [ ] **Statistics Dashboard** (2-3 hours)
  - Best round score
  - Average score per hole
  - Total rounds played
  - Par vs actual comparison
  - Trending line chart (optional)
  - Drives user engagement/retention

- [ ] **Pause/Resume Round** (1-2 hours)
  - Save incomplete rounds to localStorage
  - "Continue previous round?" prompt on app load
  - Handles real-world interruptions
  - Clear button to discard saved round

### Image & Media
- [ ] **Image Compression on Upload** (2-3 hours)
  - Install `browser-image-compression` or similar
  - Compress before upload: max 1200px, 80% quality
  - Reduces Firebase Storage costs
  - Faster uploads
  
- [ ] **Image Preview in Builder** (1 hour)
  - Show thumbnail after selecting tee/pin photo
  - Allow replace/retry if user doesn't like it
  - Better UX feedback

### Course Management
- [ ] **Course Editing** (2-3 hours)
  - Load saved course into builder form
  - Handle image updates/replacements
  - Save changes back to Firestore
  - Clear unsaved changes warning

- [ ] **Course Deletion** (1-2 hours)
  - Add delete button to user's course list
  - Confirmation modal: "Really delete [Course Name]?"
  - Delete from Firestore + Firebase Storage

### Polish & Settings
- [ ] **Settings Page** (2-3 hours)
  - Sound effects on/off
  - Units preference (feet/meters, yards)
  - Clear localStorage button
  - About/Help section
  - Account management (email, password reset)

- [ ] **First-Time User Tour** (1-2 hours)
  - Highlight tabs on first app load
  - Tooltips: "Tap + to add a stroke"
  - Walkthrough onboarding
  - Don't show again checkbox

- [ ] **Notifications** (1-2 hours)
  - "Nice birdie!" badges for under-par holes
  - "New personal best!" alerts
  - Encourages engagement

- [ ] **Better Error Handling** (1-2 hours)
  - Network retry logic
  - User-friendly error messages
  - Log errors to console/analytics
  - Retry buttons instead of silent failures

---

## Implementation: Phase 3 Advanced (Optional)
*Consider these for v2.0 and beyond*

- [ ] **Dark mode toggle** (1-2 hours)
  - Currently dark-only; add light mode option
  - Use Tailwind dark: prefix
  - Persist preference to localStorage

- [ ] **Social features** (4-6 hours)
  - Share courses with friends (unique link)
  - Rate/review user-created courses
  - Comment on courses
  - Like/favorite courses

- [ ] **Advanced analytics** (3-4 hours)
  - Course difficulty rating
  - Average score by hole
  - Win rate against friends
  - Performance trends over time

- [ ] **Mobile app** (ongoing)
  - React Native or Flutter version
  - App Store/Play Store distribution
  - Native geolocation integration
  - Push notifications

---

## Testing Checklist

### Before MVP Release
- [ ] Test on real device (iPhone/Android)
- [ ] GPS capture works outdoors
- [ ] Image upload completes
- [ ] Course submission succeeds
- [ ] Can select and play created course
- [ ] Auth login/logout works

### Edge Cases
- [ ] No GPS signal available
- [ ] Permission denied
- [ ] Network failure during upload
- [ ] Large image files
- [ ] Multiple images uploading
- [ ] Rapid clicks on buttons

---

## What's Already Done ✅

- React/TypeScript setup
- Tailwind CSS styling
- Google Maps integration
- Scorecard component
- Round/score data structure
- Component architecture
- Course data structure (types)

---

## What Needs to Be Done 🔧

### New Files to Create
- `src/config/firebase.ts` - Firebase initialization
- `src/context/AuthContext.tsx` - Auth state management
- `src/components/LoginModal.tsx` - Login UI
- `src/utils/geolocation.ts` - GPS capture utility
- `src/utils/imageUpload.ts` - Image upload utility
- `src/utils/courseSubmission.ts` - Firestore submission

### Files to Modify
- `package.json` - Add Firebase dependency
- `src/App.tsx` - Add auth, fetch courses
- `src/components/CourseBuilder.tsx` - GPS capture, image upload, publish
- `.env.local` (create) - Firebase config

---

## Time Estimates Summary

| Phase | Task | Hours | Priority |
|-------|------|-------|----------|
| **1** | Firebase Setup | 2-3 | 🔴 Do First |
| **1** | Authentication | 2-3 | 🔴 Do First |
| **1** | GPS Capture | 1-2 | 🔴 Do First |
| **1** | Image Upload | 2-3 | 🔴 Do First |
| **1** | Firestore Submit | 2-3 | 🔴 Do First |
| **1** | Integration | 1-2 | 🔴 Do First |
| | **Phase 1 Total** | **9-14** | MVP Done! |
| **2** | Empty States | 1 | 🟡 High Value |
| **2** | Score Editing | 2-3 | 🟡 Essential UX |
| **2** | Undo Last Shot | 1-2 | 🟡 QoL |
| **2** | Course Preview | 1-2 | 🟡 QoL |
| **2** | Statistics Dashboard | 2-3 | 🟡 Engagement |
| **2** | Pause/Resume Round | 1-2 | 🟡 QoL |
| **2** | Image Compression | 2-3 | 🟡 Performance |
| **2** | Image Preview | 1 | 🟡 QoL |
| **2** | Course Editing | 2-3 | 🟡 CRUD |
| **2** | Course Deletion | 1-2 | 🟡 CRUD |
| **2** | Settings Page | 2-3 | 🟡 Polish |
| **2** | First-Time Tour | 1-2 | 🟡 Onboarding |
| **2** | Notifications | 1-2 | 🟡 Engagement |
| **2** | Error Handling | 1-2 | 🟡 Polish |
| | **Phase 2 Total** | **~22-33** | Polish & Growth |
| **3** | Dark Mode | 1-2 | 🔵 Nice |
| **3** | Social Features | 4-6 | 🔵 Advanced |
| **3** | Advanced Analytics | 3-4 | 🔵 Advanced |
| **3** | Mobile App | TBD | 🔵 Future |

---

## Recommended Work Order

### Day 1 Evening (3-4 hours)
1. Firebase project setup
2. Authentication implementation + builder page gating
3. GPS capture utility + CourseBuilder integration

### Day 2 (4-5 hours)
1. Image upload implementation
2. Course validation
3. Firestore submission + auth-based data storage

### Day 3 (2-3 hours)
1. Course selector integration
2. End-to-end testing
3. Bug fixes & deploy to GitHub Pages

### Post-MVP Phase 2 (Sprint-based, 2-3 weeks)
1. **Week 1**: Empty states, score editing, undo shot, course preview
2. **Week 2**: Stats dashboard, pause/resume, image compression
3. **Week 3**: Settings, onboarding tour, course management (edit/delete)
4. **Polish pass**: Error handling, animations, notifications

---

## Difficulty Assessment

**Overall: MODERATE (Doable, not trivial)**

### By Component
- Firebase: Easy ✅ (You've used it before)
- GPS Capture: Easy ✅ (Browser API is simple)
- Image Upload: Medium 👍 (Straightforward, some edge cases)
- Firestore: Easy ✅ (Good schema = easy implementation)
- Auth: Medium 👍 (Familiar from past experience)
- React State: Easy ✅ (You clearly know React)

### Potential Gotchas
- Image compression library learning curve
- Firestore security rules syntax
- GPS permission handling (different per platform)
- Real device testing (emulator can be flakey)
- Storage URL handling

---

## Dependencies to Install

```bash
npm install firebase
npm install browser-image-compression  # Optional, for Phase 2
```

---

## Environment Variables (.env.local)

```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

---

## Next Steps When Ready

1. Create Firebase project (firebase.google.com)
2. Get Firebase credentials
3. Start with `src/config/firebase.ts`
4. Build auth layer
5. Add GPS capture
6. Wire up image upload
7. Test on real device!

---

## Notes

- GPS works best outdoors in open areas
- Accuracy typically ±5-15m (worse in cities/under trees)
- Image uploads should use compression to keep bundle size down
- Security rules are critical to prevent unauthorized access
- Consider adding analytics to track course creation success rate

---

**Ready to implement when you are! Just pick it up where this doc left off. 🚀**
