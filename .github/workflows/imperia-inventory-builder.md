---
on:
  workflow_dispatch:
  schedule:
    - cron: "0 3 * * 1-5"
permissions:
  contents: read
  issues: read
  pull-requests: read
  copilot-requests: write
network: defaults
engine: copilot
model: gpt-5-mini
tools:
  github:
    toolsets: [default]
safe-outputs:
  create-pull-request:
  create-issue:
---

# IMPERIA 360 — Inventory Builder

Build the single master inventory without inventing commercial data.

Inspect `data/catalog-control.json`, `data/catalog-sources.json`, `data/catalog-audit.json`, `data/reconciliation-review.json`, `data/inventory-base.json`, the current product data, and relevant source evidence available in the repository.

Priorities:
1. Reconcile the 12 duplicate IDs.
2. Review the 173 possible duplicates semantically. Do not merge variants that differ by brand, reference, size, measurement, presentation, or unit of sale.
3. Reconcile the historical 692-row source against the master. Do not count historical rows as active until verified.
4. Treat the reported 792 historical count as unrecovered unless documentary evidence is found.
5. Add new products only when a real source/reference can be verified.
6. Preserve source URL, consultation date, original reference, exact presentation and unit.
7. Never invent prices. Public verified price -> record it with its source and unit. No public price -> quote_only/not_found.
8. Never present supplier stock as IMPERIA 360 owned stock.
9. Keep incomplete records in draft/review.
10. Produce a reviewable pull request with evidence and tests, or an issue if evidence is insufficient.

Before any merge, run existing catalog validation and report every unresolved ambiguity.
