# Street Golf Images

Images folder for tee box and pin location photos.

## Folder Structure

```
images/
├── tee/           # Tee box photos
│   ├── hole-1.jpg
│   ├── hole-2.jpg
│   └── ...
└── pin/           # Pin location photos
    ├── hole-1.jpg
    ├── hole-2.jpg
    └── ...
```

## How to Use

1. **Add Images:**
   - Place tee box photos in `public/images/tee/`
   - Place pin photos in `public/images/pin/`
   - Use format: `hole-1.jpg`, `hole-2.jpg`, etc.

2. **Reference in Course Data:**
   
   Edit `src/constants/course.ts`:
   
   ```typescript
   {
     number: 1,
     name: "The Southbridge Opener",
     teeLocation: { lat: 42.12060, lng: -87.78430 },
     teeImage: "/images/tee/hole-1.jpg",        // ← Reference here
     pinLocation: { lat: 42.13781, lng: -87.82069 },
     pinImage: "/images/pin/hole-1.jpg",        // ← Reference here
     // ... rest of hole data
   }
   ```

3. **View in App:**
   - Click on tee/pin card while playing
   - Photo opens in lightbox modal
   - Tap anywhere to close

## Supported Formats

- `.jpg` / `.jpeg`
- `.png`
- `.webp`
- `.svg`

## Best Practices

- **Size:** Keep images under 500KB each
- **Dimensions:** Square (1:1) or landscape (4:3) works best
- **Naming:** Use `hole-1.jpg`, `hole-2.jpg`, etc. for consistency
- **Format:** JPG for photos, PNG for graphics

## Optimization

Images are automatically optimized by Vite during build. For best performance:
- Compress before uploading
- Use appropriate format (JPG for photos, PNG for graphics)
- Aim for 200-300KB per image

---

**Note:** Images are served from `public/` folder and are static assets. They'll be cached by the browser and available offline once loaded.
