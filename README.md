# Webberick — Portfolio

Creative designer & developer portfolio: animations, web experiences, and AI-powered products.

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- framer-motion
- React Router (SPA)

## Scripts

```sh
npm run dev        # start the dev server
npm run build      # production build
npm run lint       # eslint
npm run test       # vitest
npm run templates  # start the template cards dev server
```

## Notes

- `public/templates.json` drives the template cards.
- The brand intro (`src/components/brand/`) plays once on initial load; timing constants
  live at the top of `BrandIntro.tsx`.