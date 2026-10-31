# Google Antigravity — FoodTrail implementation brief

You are implementing FoodTrail, a personal premium mobile food-discovery and restaurant-visit journal app.

## Working rules
- Use the provided Expo Router + React Native + TypeScript starter. Android-first; keep iOS compatibility.
- Preserve the warm editorial visual system in `src/theme/colors.ts`: warm paper background, dark ink, forest-green accent, restrained terracotta detail. Make the interface feel like a polished editorial travel/food journal, not a generic admin dashboard.
- Use the existing `src/data/places.json` catalogue as candidate data. Never promote `Pending verification` rows as confirmed venues. Do not invent exact addresses, prices, restaurant links or ratings.
- Continue implementing in small milestones. Before edits, inspect the project and `git status`. Do not overwrite unrelated user changes.
- After each coherent milestone, run relevant checks (`npx tsc --noEmit`, Expo start / platform checks where possible, and `git diff --check`), review the diff, then create one conventional commit. Never commit `.env`, keys or tokens.

## Milestone 1 — make the starter run cleanly
- Fix any TypeScript/Expo Router errors without changing the product direction.
- Ensure Home, Discover, Bucket List, Map, Journal, Place Details, Add Visit and Profile routes all work.
- Improve accessibility labels, keyboard handling, empty/loading states and responsive layouts.
- Verify local save/unsave and multiple visit entries persist after app restart.

## Milestone 2 — product behaviour
- Add robust search and filters for locality, cuisine/category, verification state and budget range.
- Add edit/delete visit flows; validate date, spend and rating.
- Support a separate visit record every time a place is visited. Do not store a single visit date on the place itself as the source of truth.
- Allow a user to record personal share separately from total bill, companions, order items, notes and visit photos.

## Milestone 3 — Supabase backend
- Use `supabase/schema.sql` and `supabase/seed.sql` as the initial schema/import.
- Add Supabase Auth (email OTP or magic link) and owner-scoped RLS.
- Sync saved places and visit records only after authentication; keep a safe guest/local mode until then.
- Implement photo uploads to the private `foodtrail-visit-photos` bucket with paths `{user_id}/{visit_id}/{filename}`.
- Never use the service-role key on-device. Only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` may be exposed to the app.

## Milestone 4 — Maps and data quality
- Integrate Google Maps/Places only after the user supplies/configures API credentials and billing/quotas.
- Show a map marker only when a branch has a source-backed address or coordinates.
- Keep uncertain venue rows clearly labelled `To verify`; provide a way to flag incorrect branches.
- Add CSV/XLSX import/export and a simple review queue for catalogue verification.

## Milestone 5 — release readiness
- Add tests for storage, search filters, visit validation and RLS assumptions.
- Check Android device layout and iOS layout.
- Add app icon, splash, privacy policy and production environment setup only after app identity/credentials are supplied.
- Produce a build/release checklist; do not claim an app is published until an actual store release happens.
