# Utleiometer (React + TypeScript + Firebase)

Utleiometer is a web app for students who want to:
- register housing listings
- read and write reviews
- explore housing in both list and map views

## Requirements
- Node.js 20+
- npm 10+

## Getting Started
```bash
npm install
npm run dev
```

The app normally starts at `http://localhost:5173`.

## Useful Scripts
```bash
npm run dev      # Start local development server
npm run build    # Typecheck + production build
npm run preview  # Preview production build
```

## Tech Stack
- React 19
- TypeScript
- Vite
- Firebase Auth
- Firestore
- React Router
- Leaflet/OpenStreetMap (map)

## App Routes
- `/` Home (map view)
- `/boliger` Housing overview
- `/legg-inn-bolig` Add listing
- `/housing/:id` Housing details
- `/housing/:id/review` Write review
- `/review/:id` Write review (alternative route)
- `/logg-inn` Login
- `/registrer` Registration
- `/profil` Profile (protected route)

## Firebase Setup
Firebase is initialized in:
- `src/firebase.ts`

This project version currently uses a hardcoded `firebaseConfig` in code.

## Firestore Data (Quick Overview)
Main collections used in the app:
- `listings`
- `reviews`
- `users`

Example fields in `listings`:
- `address`, `postalCode`, `poststed`, `city`, `price`, `notes`, `imageUrl`
- `latitude`, `longitude`, `geoVerified` (map)

## Map Logic (Home Page)
The map on the home page:
- shows listings with coordinates
- geocodes missing coordinates with strict validation
- validates combinations of street/house number/postal code/city to reduce false matches

## Common Issues
1. New listings do not appear on the map immediately
- Hard refresh (`Cmd+Shift+R` / `Ctrl+F5`)
- Check that address, postal code, and city are correctly entered

2. Build fails
- Run `npm install` again
- Run `npm run build` and inspect the first TypeScript error

3. Firebase errors (read/write)
- Verify the correct Firebase project is being used
- Check Firestore and Auth rules

## Project Structure (Excerpt)
```text
src/
  components/
  homelistfiles/
  pages/
  services/
  style/
  firebase.ts
```

## Team
Developed by Group 16.
