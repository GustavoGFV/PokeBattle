# Field Circuit

- This is a browser-based TypeScript game built with Vite and the Canvas 2D API.
- Keep creature, move, and type definitions data-driven in `src/data/`; roster membership is defined in `src/data/creatures.ts`.
- Keep battle decisions and type/damage rules in `src/domain/` and `src/game/`; rendering belongs in `src/ui/`.
- Preserve original creature names and art. Do not add third-party game branding or copied sprites.
- Store only the local match record in browser storage. Handle unavailable or invalid storage gracefully.
- Prefer focused tests for game rules and run `npm run build` before considering a change complete.