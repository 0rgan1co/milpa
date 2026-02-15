<!-- Sync Impact Report
  Version change: N/A → 1.0.0
  Modified principles: N/A (initial creation)
  Added sections: Core Principles (5), Next.js 15 Standards, Development Workflow, Governance
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ no changes needed (uses generic constitution reference)
    - .specify/templates/spec-template.md ✅ no changes needed
    - .specify/templates/tasks-template.md ✅ no changes needed
  Follow-up TODOs: None
-->

# Milpa Constitution

## Core Principles

### I. Modular Architecture

Code MUST be organized into self-contained, single-responsibility modules.
Each component, hook, utility, and service MUST have a clear, singular purpose.

- One concern per file. No monolithic files mixing data fetching, business logic,
  and presentation.
- Feature-based directory structure MUST be used to co-locate related components,
  types, and utilities.
- Shared code MUST live in explicit shared modules (`lib/`, `components/ui/`,
  `utils/`) and MUST NOT contain business logic specific to a single feature.
- Circular dependencies between modules are prohibited.

### II. Next.js 15 Best Practices

The application MUST follow Next.js 15 conventions and leverage the platform's
built-in capabilities before reaching for third-party solutions.

- App Router MUST be used exclusively. Pages Router is prohibited.
- Server Components MUST be the default. Client Components (`'use client'`)
  MUST only be used when browser APIs or interactivity (state, effects, event
  handlers) are required.
- Server Actions MUST be used for data mutations. API Routes MUST only be used
  for webhooks, third-party integrations, or non-form-based endpoints.
- The Metadata API MUST be used for SEO and social sharing metadata.
- Dynamic and static rendering MUST be leveraged appropriately: prefer static
  rendering and ISR where content allows; use dynamic rendering only when
  request-time data is required.
- Image optimization MUST use `next/image`. Font loading MUST use `next/font`.
- Route groups, parallel routes, and intercepting routes MUST be used when they
  simplify layout composition -- not as premature abstractions.

### III. Type Safety

TypeScript strict mode MUST be enabled. The type system is the first line of
defense against runtime errors.

- `any` types are prohibited except with an explicit inline justification comment
  explaining why a safer type is not feasible.
- All component props, API responses, function parameters, and data models MUST
  have explicit type definitions.
- Zod (or equivalent) MUST be used for runtime validation at trust boundaries:
  form inputs, API responses, URL search params, and external data.
- Type assertions (`as`) MUST be minimized and justified when used.
- Utility types (`Pick`, `Omit`, `Partial`, `Required`) MUST be preferred over
  duplicating type definitions.

### IV. Code Clarity

All code MUST be self-documenting. A developer unfamiliar with the codebase MUST
be able to understand a module's purpose within 30 seconds of reading it.

- Variables, functions, and components MUST use descriptive names. No
  abbreviations in public APIs (e.g., `getUserProfile` not `getUsrProf`).
- Functions MUST be short and focused -- ideally under 30 lines. If a function
  exceeds this, it SHOULD be decomposed.
- Comments MUST explain "why", never "what". If code needs a "what" comment, the
  code itself MUST be refactored for clarity.
- Magic numbers and strings MUST be extracted into named constants.
- Conditional logic MUST prefer early returns over deeply nested if/else blocks.

### V. Simplicity

Start with the simplest solution that works. Complexity MUST be earned through
demonstrated need, never through speculation.

- YAGNI: features, abstractions, and infrastructure MUST NOT be built until there
  is a concrete, immediate requirement.
- Dependencies MUST be justified. Prefer built-in Next.js features and Web
  Platform APIs over third-party libraries.
- No premature optimization. Measure first, optimize where data indicates
  actual bottlenecks.
- Prefer flat structures over deep nesting in both code and directory layout.
- If two approaches have similar cost, choose the one that is easier to delete.

## Next.js 15 Standards

The following standards apply specifically to Next.js 15 development in Milpa:

- **Routing**: File-based routing via the `app/` directory. Route segments MUST
  use lowercase kebab-case (e.g., `app/user-profile/page.tsx`).
- **Data Fetching**: Use `fetch` with Next.js caching semantics in Server
  Components. Avoid client-side data fetching libraries unless real-time updates
  are required.
- **Error Handling**: Every route segment MUST have an `error.tsx` boundary.
  The root layout MUST have a `global-error.tsx`.
- **Loading States**: Route segments with async data MUST provide `loading.tsx`
  or use `<Suspense>` boundaries.
- **Styling**: Tailwind CSS or CSS Modules MUST be used. Global CSS MUST be
  limited to resets and CSS custom properties. Inline styles are prohibited
  except for truly dynamic values.
- **State Management**: URL search params and React Server Components MUST be
  the primary state mechanisms. Client-side state libraries MUST only be
  introduced when URL + server state is insufficient.
- **Environment Variables**: Secrets MUST use server-only env vars (no
  `NEXT_PUBLIC_` prefix). Client-exposed env vars MUST be explicitly justified.

## Development Workflow

Quality gates and development practices for the Milpa project:

- **Linting**: ESLint with `next/core-web-vitals` and `next/typescript`
  configurations MUST pass with zero warnings before merge.
- **Formatting**: Prettier MUST be configured and enforced. No style debates
  in code review.
- **Commit Messages**: MUST follow Conventional Commits format
  (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- **Branch Strategy**: Feature branches from `main`. Branch names MUST follow
  the spec-kit convention (`NNN-feature-name`).
- **Code Review**: Every change MUST be reviewed. Reviews MUST verify
  constitution compliance, not just functional correctness.
- **Testing**: Tests are encouraged but not mandatory for every change. When
  written, tests MUST be meaningful (test behavior, not implementation details).

## Governance

This constitution is the governing document for all development decisions in
the Milpa project. It supersedes ad-hoc conventions, personal preferences,
and inherited patterns.

- All code contributions MUST comply with these principles. Non-compliance
  MUST be flagged during code review.
- Amendments to this constitution MUST be documented with a version bump,
  rationale, and migration plan for existing code that conflicts.
- Complexity that deviates from these principles MUST be justified in writing
  (in the plan's Complexity Tracking table) and approved before implementation.
- When principles conflict, priority order is: Simplicity > Code Clarity >
  Modular Architecture > Next.js 15 Best Practices > Type Safety.

**Version**: 1.0.0 | **Ratified**: 2026-02-14 | **Last Amended**: 2026-02-14
