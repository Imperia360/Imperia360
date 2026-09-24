---
on:
  schedule: weekly
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

engine: gemini
---

# IMPERIA 360 — Auditor adversarial de catálogo

Realiza una revisión independiente de calidad del catálogo.

Busca:
- duplicados semánticos;
- variantes que no deben fusionarse;
- diferencias de presentación;
- diferencias de marca;
- referencias incompatibles;
- precios sin evidencia;
- fuentes débiles;
- campos comerciales faltantes;
- candidatos que deberían permanecer en NEEDS_REVIEW.

Compara los resultados con las reglas maestras.
No modificar data/products.json.
No inventar equivalencias.
Crear una issue con los hallazgos y evidencia.
