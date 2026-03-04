# Domain Specification

Consolidate project-specific domain knowledge here.

## Structure

| File | Contents |
| --- | --- |
| `overview.md` | Project overview, vision, target users, non-functional requirements |
| `entities.md` | Domain entities, aggregates, relationships, rules |
| `usecases.md` | Use case list, priorities (MVP/Phase2/Phase3) |
| `glossary.md` | Glossary (ubiquitous language) |
| `decisions.md` | Specification decision log (rationale behind each decision) |

## Creation & Update Flow

1. Initial specification: `/domain-spec-kickoff`
2. Specification evolution during implementation: `/domain-doc-evolution`
3. When a specification change occurs, update `docs/domain` first before modifying code

## Policies

- This directory serves as the Single Source of Truth for domain knowledge
- Entity definitions follow Zod Schema First (see `docs/web-frontend/typescript.md`)
- Record important specification decisions with rationale in `decisions.md`
- Mark undecided items as `TBD` and record next actions in `usecases.md` or `decisions.md`

## Related

- `docs/plan/` - Feature-level specification documents (Spec-Driven Development)
