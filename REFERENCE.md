# Mobile app reference (read-only)

The RVA Now **mobile app** lives in a separate project:

```
../rva-now/apps/mobile/
```

That codebase is **not a dependency** of this website. Use it only when you need to:

- Match a screen layout or visual design
- Confirm feature behavior (filters, feed logic, submit flow)
- Compare copy, colors, or section structure

When porting a feature from mobile to web:

1. Read the mobile screen/component for intent
2. Implement it here with web-native patterns (HTML, CSS, Next.js routes)
3. Keep types and helpers inside `src/` — never import across projects

## Feature parity checklist

| Mobile tab/screen | Web route | Status |
|-------------------|-----------|--------|
| Discover (Home) | `/` | Done |
| Map | `/map` | Done |
| Feed | `/feed` | Done |
| You | `/you` | Done |
| Event detail | `/event/[id]` | Done |
| Submit listing | `/submit` | Done |
| Auth / magic link | — | Not yet |
| Ticket purchase | — | Partial (external ticket links) |
| Onboarding | — | Not yet |
| Search | — | Not yet |
