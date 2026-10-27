---
paths:
  - "frontend/**/*.{ts,tsx,css,json}"
---

# Frontend rules

- Server state only via TanStack Query; query keys `['household', hid, <resource>, params?]`. After a mutation invalidate exactly the affected keys (`stock`, `attention`, product card).
- API calls only through the generated client in `src/api/` (never hand-written fetch types). Never edit `schema.d.ts` / `openapi.json` — regenerate with `pnpm gen:api`.
- Client: `api.GET("/api/v1/…")` from `src/api/client.ts` returns `{ data, error, response }`; read the error code with `problemCode(error)` and translate it via i18n. Response types: `components["schemas"]["X"]` from `src/api/schema` (also for typed MSW handlers: `HttpResponse.json<…>(…)`). The client looks `fetch` up per call — keep it so, or MSW stops intercepting and tests hit the network. (T-005)
- Every user-visible string goes through i18next (`t('stock.actions.markOut')`), files in `src/i18n/ru/`. Plurals via i18next plural keys. No string literals in JSX except punctuation.
- Quantities: format only with `shared/format/quantity.ts` (base unit → «1,25 кг», «≈» for approx). Dates: `shared/format/date.ts` with household timezone.
- UX rules from `docs/07-ui-ux.md`: visible buttons (gestures only as duplicates), tap targets ≥ 44px, base font ≥ 16px, level chips always show text + color, undo toast instead of confirm dialogs (except leaving a household).
- Quick actions use optimistic updates with rollback; on 409 `version_conflict` show the "someone changed it" toast and replace cached data with `current` from the response.
- Offline (MVP): mutations disabled when `navigator.onLine === false`, with a hint; the "after shopping" cart persists locally until sent.
- Components: feature folders `src/features/<feature>/` (one per nav section: stock, expiry, add, shopping, family), shared UI in `src/shared/ui/`. No global store until a real need is agreed.
- Shared components are built on native elements (radio groups, `select`, `input type="date"`, `button role="switch"`): Radix `Dialog`, `Select` and the modal `DropdownMenu` inject a `<style>` element that the prod CSP blocks, and their scroll lock silently fails. A new UI library is tried in the prod build with the CSP of `deploy/Caddyfile` first. (T-008b)
- Every shared component has a sample in `src/shared/ui/accessible.test.tsx` (axe-core via `expectAccessible` from `src/test/a11y.ts`) and appears on the dev-only showcase `/dev/ui` (`src/dev/`); the showcase must never reach production (`pnpm size` and the prod smoke test check the marker). (T-008b)
- Status labels about a product agree with its gender and number via i18next context (`_m/_f/_n/_pl`): «Чай закончился», «Гречка закончилась». Write-off buttons read «−1 стакан», «−½ пачки» (`ActionPill` rejects anything else). (T-008a, T-008b)
- Style «Фарфор» (docs/10-design.md): colours only via Tailwind theme colours mapped from `src/shared/theme/tokens.ts` (`bg-surface`, `text-ink`, `text-muted`, `bg-accent`…); never a literal colour in a component; a new token must pass the contrast test (`tokens.test.ts`). The display face (`font-display`, Triodion) only for the wordmark, the screen title, place names and large empty/first-run titles, ≥ 20px; everything else is Golos Text. Ornament (`shared/ui/ornament/`) only in emblems, the kayma and empty/first-run states — never in product rows, numbers, buttons or level chips. (T-004)
- Navigation is provisional: sections live in `src/app/navigation.ts` (`NAV_ITEMS`); change the list, not the shell. (T-004)
- MSW 3: unhandled requests fail tests (`onUnhandledFrame: "error"` in `src/test/setup.ts`); add handlers per test with `server.use(...)`. (T-004)
- Tests: Vitest + Testing Library + MSW; query elements by role/label (as a user would), not by class or test-id unless unavoidable.
- TypeScript `strict`; no `any`, no non-null `!` without a comment.
