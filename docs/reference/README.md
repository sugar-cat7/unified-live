# SDK Reference

Reference documentation for the unified-live SDK.

## Structure

| File           | Contents                                                            |
| -------------- | ------------------------------------------------------------------- |
| `overview.md`  | Project overview, vision, target users, non-functional requirements |
| `glossary.md`  | Glossary of SDK terms                                               |
| `decisions.md` | Architecture decision log (rationale behind each decision)          |

## Policies

- Type definitions follow Zod Schema First (`z.infer<typeof schema>`)
- Record important architecture decisions with rationale in `decisions.md`
- Mark undecided items as `TBD` and record next actions in `decisions.md`
- Type definitions and public API specs live in `docs/plan/unified-live-sdk/`

## Related

- `docs/plan/` - Feature-level specification documents (Spec-Driven Development)
- `docs/plan/unified-live-sdk/01_TYPES.md` - Type definitions and schemas
- `docs/plan/unified-live-sdk/03_CLIENT_API.md` - Public API surface
