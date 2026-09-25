---
on:
  schedule: daily
  workflow_dispatch:

permissions:
  contents: read
  issues: read
  pull-requests: read
  copilot-requests: write

network: defaults

tools:
  github:
    toolsets: [default]

safe-outputs:
  create-issue:

engine: copilot
model: gpt-5-mini
---

# IMPERIA 360 — Orquestador de calidad

Lee `AI_OPERATING_ORDERS.md`, `AI_FLEET.md`, `AI_FLEET_TASKS.md` y `docs/reconciliation-rules.md`.

Audita el repositorio y genera un informe diario para el responsable del proyecto.

Debes verificar:
1. Estado del catálogo maestro.
2. Estado de Exa, evidencia y reconciliación.
3. Duplicados y campos faltantes.
4. Fuentes activas y cobertura.
5. Errores de CI/workflows.
6. Candidatos nuevos frente a productos existentes.
7. Casos que requieren revisión humana.
8. Riesgos que puedan introducir datos inventados o duplicados.

No modifiques `data/products.json`.
No inventes datos.
No declares una IA activa si no existen evidencias de ejecución.
Crea una issue con el informe, cifras verificables, bloqueos y las siguientes acciones técnicas.
