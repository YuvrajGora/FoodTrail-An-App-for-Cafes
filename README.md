# FoodTrail — Mobile App Starter

FoodTrail is a personal Delhi-NCR restaurant discovery list and food journal. This starter contains:

- Expo Router screen structure for Home, Discover, Bucket List, Map, Journal, Place Details, Add Visit and Profile.
- A 132-entry seed catalogue exported from the FoodTrail tracker. Each place retains its verification state and source notes.
- Local device persistence for saved places and visit logs (AsyncStorage).
- Supabase/Postgres schema with owner-scoped Row Level Security for profiles, saved places, visits and visit photos.
- An Antigravity implementation brief for the next build pass.

## Important scope note

This is a working **front-end starter/prototype**, not a released production app. It currently persists saved places and visits on the device. Supabase login/sync, photo uploads, a live Google map, and production testing still need to be connected. Catalogue entries marked `Pending verification` are not confirmed businesses/branches and must not be shown as verified recommendations.

## Recommended setup

1. Install Node.js LTS and Git.
2. Create a fresh Expo Router app. During the SDK 58 transition, the Expo Router docs indicate SDK 57 when using Expo Go on a physical phone; use the SDK 58 template only if you are using a compatible development build:

   ```bash
   npx create-expo-app@latest FoodTrail --template default@sdk-57
   ```

3. Copy the contents of this starter into the generated `FoodTrail` folder, merging `app/`, `src/`, `supabase/`, and the root helper files.
4. From the project folder, install the app-compatible storage package:

   ```bash
   npx expo install @react-native-async-storage/async-storage expo-sqlite
npm install @supabase/supabase-js react-native-url-polyfill
   ```

   The default Expo Router template includes Expo Router and the Expo icon package. If it does not, run:

   ```bash
   npx expo install expo-router @expo/vector-icons react-native-safe-area-context react-native-screens expo-linking expo-constants
   ```

5. Start the app:

   ```bash
   npx expo start
   ```

6. Install Expo Go on an Android phone and scan the QR code. Android is the first target; iOS remains supported by the shared Expo codebase.

## Supabase setup (next backend milestone)

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. Import `supabase/seed.sql` to load the current 132-entry catalogue.
4. Add environment variables to a local `.env` file (never commit real keys):

   ```env
   EXPO_PUBLIC_SUPABASE_URL=YOUR_PROJECT_URL
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   ```

5. Do not put a Supabase service-role key in a mobile app. The schema allows app users to read the shared place catalogue and only their own profile, saved places, visits and photos.

## Data status

The seed includes 132 candidate entries; 58 rows are marked `Verified` after source checks, and 74 remain pending branch verification. The remaining candidates are intentionally retained as `Pending verification`. A verified status records a name/branch match to the source shown in the tracker; it does not promise that today's menu, prices or opening status will never change.

## Git workflow

Use small, reviewable commits. Before each commit:

```bash
git status
git diff --check
git diff
```

Stage only intended files and use conventional commit messages such as:

- `feat: add FoodTrail home and discovery screens`
- `feat: add local bucket list and visit journal`
- `feat: add Supabase schema and row-level security`
- `fix: validate visit rating and spend inputs`

Do not commit `.env`, credentials, build output or generated secrets.
