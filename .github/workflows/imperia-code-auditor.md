---
on:
  schedule: weekly
  workflow_dispatch:

permissions:
  contents: read
  pull-requests: read
  issues: read
  copilot-requests: write

network: defaults

tools:
  github:
    toolsets: [default]

safe-outputs:
  create-issue:

engine: codex
---

# IMPERIA 360 — Auditor técnico

Audita el código y los workflows del repositorio.

Prioridades:
- detectar errores de sintaxis;
- detectar rutas inexistentes;
- detectar workflows inconsistentes;
- comprobar que ningún flujo escriba directamente productos sin validación;
- revisar pruebas;
- identificar deuda técnica;
- proponer correcciones concretas.

No modificar el catálogo maestro.
No inventar resultados.
Crear una issue con hallazgos clasificados por severidad y comandos/archivos afectados.
