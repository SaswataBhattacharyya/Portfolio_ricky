# Webberick Redesign Integration

This branch integrates the approved public homepage from `ashucodesbio/webberick-redesign` into the complete original application.

## Intentionally unchanged
- `src/App.tsx`: **original BrandIntro loading animation stays enabled**.
- `src/components/brand/BrandIntro.tsx` and `src/hooks/useAppReady.ts`: unchanged.
- `src/pages/AdminHub.tsx`, `src/pages/AdminLogin.tsx`, `src/components/Navigation.tsx`, `src/components/AdminEntryAnimation.tsx`: unchanged.
- `backend/`, production/deployment scripts, original project registry, assets, dependencies, and lockfile: unchanged.

## Homepage admin entry
The new wordmark uses the same triple-click-within-700ms interaction as the original Navigation component. It invokes the existing `AdminEntryAnimation` component before navigating to `/admin/login`. Service pages continue to use the original Navigation unchanged.

## Contact and portfolio
The redesigned homepage form exposes the original Django-required fields and only sends genuine user-provided values. Its project preview images load from the existing checked-in `public/template-previews/` assets. Original media, admin, and web-development routes are preserved.

## Validation
CI runs `npm ci`, `npm run build`, `npm run test`, a focused ESLint check covering all added/changed TypeScript files, and `python backend/manage.py check`. The existing full-repository `npm run lint` has 5 pre-existing errors in unrelated files (including AdminHub); those files remain untouched as requested. These existing lint errors must be handled separately before global lint can be used as a blocking check.

## Deployment
This PR does not change the production deployment scripts. Merge only after CI and browser verification of the loading animation, admin logo gesture, admin dashboard, and form delivery.
