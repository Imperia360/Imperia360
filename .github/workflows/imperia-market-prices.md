---
on:
  workflow_dispatch:
  schedule:
    - cron: "30 3 * * 1-5"
permissions:
  contents: read
  issues: read
  pull-requests: read
  copilot-requests: write
network: defaults
engine: gemini
tools:
  github:
    toolsets: [default]
safe-outputs:
  create-pull-request:
  create-issue:
---

# IMPERIA 360 — Market Price Verification

Independently audit and expand the commercial evidence for the master inventory.

Use the source policy in `data/catalog-sources.json`. Prioritize manufacturers, importers, wholesalers/distributors and specialist suppliers; use retail as reference evidence.

For every candidate:
- verify the exact product and reference;
- verify brand, size, measurement and presentation;
- verify price and currency when publicly displayed;
- record the source URL and consultation date;
- distinguish unit, package, box, roll, kit, pair, kilogram, metre, etc.;
- if no public price is verifiable, use quote_only/not_found;
- never infer a price from another variant;
- never fabricate stock;
- flag conflicting prices rather than averaging them into an invented value.

Specifically cross-check Corbeta, Mundial de Tornillos, Homecenter as reference-only, and other suppliers already listed in the source registry.

Create a reviewable PR only for evidence-backed additions/corrections. Otherwise create an issue containing the exact evidence gap and candidate source.
