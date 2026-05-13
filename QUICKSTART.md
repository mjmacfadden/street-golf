# 🚀 Quick Start - Street Golf React + Vite

Get playing in 2 minutes!

## 1️⃣ Install & Launch

```bash
cd /Users/mmacfadden/Documents/GitHub/Street\ Golf
npm install
npm run dev
```

**Opens:** `http://localhost:3000`

That's it! The app is running with your Google Maps API key already configured.

---

## 2️⃣ Start Playing

1. Click **"START ROUND"** on home screen
2. **Map** tab shows all 9 holes
3. Click a hole to select it
4. Use **+/−** buttons to enter your stroke count
5. Tap **SAVE** to move to next hole
6. **Score** tab shows your progress
7. **History** tab saves all your rounds

---

## 3️⃣ Customize the Course

Edit `src/constants/course.ts`:

```typescript
{
  number: 1,
  name: "Your Hole Name",
  teeLocation: { lat: 42.13841, lng: -87.81881 },
  pinLocation: { lat: 42.13781, lng: -87.82069 },
  par: 3,
  description: "Your description..."
}
```

**Get Coordinates:** Click the map in the app → check browser console

---

## 4️⃣ Build for Production

```bash
npm run build
```

Creates `/dist` folder ready to deploy:
- **Netlify:** Drag `dist/` folder
- **Vercel:** Connect GitHub repo
- **Any host:** Copy `dist/` contents

---

## 📚 Documentation

- **[README.md](README.md)** - Full feature guide
- **[SETUP.md](SETUP.md)** - Complete setup reference  
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Dev reference

---

## 🆘 Troubleshooting

**Maps not showing?**
- Check `.env` has valid API key
- Open DevTools Console for errors

**Port 3000 in use?**
```bash
npm run dev -- --port 3001
```

**Need to reset?**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 🎯 Key Files to Know

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app, state, routing |
| `src/constants/course.ts` | **9 holes - EDIT THIS** |
| `src/components/MapView.tsx` | Google Maps |
| `src/index.css` | Tailwind + custom colors |
| `.env` | API key (already set) |
| `package.json` | Dependencies |

---

## 💡 Pro Tips

**Change Colors:** Edit `src/index.css` @theme block
```css
--color-lime: #BFFF00;  ← Change these
--color-navy: #0A192F;
--color-dark: #010409;
```

**Add More Holes:** Just add objects to `src/constants/course.ts` array

**Deploy Live:** `npm run build`, then upload `dist/` folder

---

## ⛳ Ready to Play!

```bash
npm run dev
# Navigate to http://localhost:3000
# Click "START ROUND"
# Conquer the neighborhood!
```

---

**Questions?** Check [DEVELOPMENT.md](DEVELOPMENT.md) for detailed reference.

**Questions about features?** See [README.md](README.md).

**Issues?** Check browser console for errors.

**Want to customize?** See [SETUP.md](SETUP.md) section "Customize the Course".

---

**Have fun! 🎉⛳**
