# Milpa Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-15

## Active Technologies

- Frontend: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui [web:17][web:20]
- Data viz: D3.js y React Flow para mapas de narrativas y grafos de tensiones [file:1]
- Estado cliente: Zustand para state management ligero [web:22]
- Backend: API Routes de Next.js + Firebase Admin SDK (Firestore, Auth, Storage) [file:1][web:17]
- IA: Vercel AI SDK con Gemini 1.5 Flash para entrevistas RTI, extracción de narrativas y embeddings semánticos [file:1][web:29]
- Infraestructura: Deploy en Vercel, CI básico con GitHub Actions para tests y lint [web:17][web:20]

## Project Structure

```text
/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx                 # Dashboard principal (proyecto activo)
│  ├─ interviews/
│  │  └─ page.tsx             # Listado y carga de entrevistas
│  ├─ narratives/
│  │  └─ page.tsx             # Lista, filtros y edición de narrativas
│  ├─ clustering/
│  │  └─ page.tsx             # Mapa semántico + controles UMAP/HDBSCAN
│  ├─ projects/
│  │  └─ page.tsx             # Gestión de proyectos
│  ├─ settings/
│  │  └─ page.tsx             # Configuración (API keys, privacidad)
│  └─ api/
│     ├─ interviews/
│     │  └─ route.ts          # CRUD entrevistas + extracción de narrativas
│     ├─ narratives/
│     │  └─ route.ts          # CRUD narrativas + tagging + anonimización
│     └─ clustering/
│        └─ route.ts          # Rebuild de mapas y clusters
├─ lib/
│  ├─ firebase.ts              # Inicialización Firestore/Auth/Storage
│  ├─ ai/
│  │  ├─ rti-interviewer.ts    # Lógica del agente de entrevista (Cardus)
│  │  ├─ narrative-engine.ts   # Chunking historias + embeddings
│  │  └─ clustering.ts         # UMAP/HDBSCAN helpers
│  └─ analytics.ts             # Cálculo de métricas agregadas
├─ components/
│  ├─ charts/
│  │  ├─ NarrativesMap.tsx     # Scatterplot 2D interactivo
│  │  └─ ClustersSummary.tsx
│  ├─ interviews/
│  │  └─ RtiInterviewWidget.tsx
│  └─ layout/
│     └─ Sidebar.tsx
├─ tests/
│  ├─ components/
│  └─ e2e/
├─ .specify/
│  ├─ memory/
│  │  └─ constitution.md
│  └─ specs/
│     ├─ rti-interviews.plan.md
│     ├─ narratives-engine.plan.md
│     └─ clustering-dashboard.plan.md
└─ package.json
```

## Commands

- `pnpm dev` – Arranca la app Next.js en desarrollo [web:17]
- `pnpm test` – Ejecuta la suite de tests unitarios (Vitest)
- `pnpm lint` – Lint de TypeScript/ESLint
- `pnpm build` – Build de producción
- `pnpm start` – Servir build de producción
- `pnpm test:e2e` – Pruebas E2E con Playwright

_Comandos de Spec‑Kit/OpenCode:_ [web:17][web:20][web:30]

- `/speckit.specify` – Añadir o actualizar especificaciones de features
- `/speckit.plan` – Generar/actualizar planes técnicos a partir de specs
- `/speckit.tasks` – Descomponer en tareas implementables
- `/speckit.implement` – Aplicar tareas guiadas por el plan

## Code Style

- TypeScript/React:
  - Components funcionales con hooks; sin clases.
  - Server components por defecto; `"use client"` solo cuando haya estado local/efectos.
  - Props tipadas explícitamente, evitar `any`.
  - Importaciones absolutas desde `@/` para `app`, `lib`, `components`.

- Next.js:
  - App Router (`app/`) y `route.ts` para APIs.
  - Lógica de dominio en `lib/`, UI en `components`.
  - Manejo de errores con `error.tsx` y `not-found.tsx` donde aplique.

- Styling:
  - Tailwind CSS como sistema principal.
  - shadcn/ui para inputs, tablas, dialogs y componentes complejos consistentes.

- Tests:
  - Components clave con tests unitarios mínimos.
  - Flujos RTI y clustering con al menos un E2E “happy path” y uno con fallo de red.

## Recent Changes

1. **RTI Interview Flow v1 – 2026-02-14**  
   - Nuevo widget `RtiInterviewWidget` con soporte voz/texto, recordatorios de anonimato y follow‑ups orientados a historias concretas (inicio–nudo–desenlace).[file:1]

2. **Narrative Engine & Embeddings v1 – 2026-02-13**  
   - API de extracción de narrativas desde entrevistas crudas, almacenamiento en Firestore y generación de embeddings para clustering posterior.[file:1][web:29]

3. **Clustering Dashboard v1 – 2026-02-12**  
   - Página `/clustering` con mapa 2D de narrativas, sliders para `n_neighbors`, `min_dist`, `min_cluster_size` y `threshold`, y generación automática de nombres/resúmenes de clusters con IA.[file:1]

<!-- MANUAL ADDITIONS START -->

<!-- MANUAL ADDITIONS END -->
```
