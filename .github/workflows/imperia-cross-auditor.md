---
on:
  workflow_dispatch:
  pull_request:
    paths:
      - "data/**"
      - "src/**"
      - "app/**"
      - ".github/workflows/**"
permissions:
  contents: read
  issues: read
  pull-requests: read
  copilot-requests: write
network: defaults
engine: claude
tools:
  github:
    toolsets: [default]
safe-outputs:
  create-issue:
  add-comment:
---

# IMPERIA 360 — Independent Cross-Audit

Act as an adversarial final reviewer of catalog and application changes.

Check:
- no duplicate IDs;
- no accidental product merges;
- real variants remain distinct;
- no unsupported prices;
- exact presentation/unit consistency;
- source and consultation date present;
- source stock is not represented as owned inventory;
- historical 692/792 counts are not silently inflated into active inventory;
- catalog UI reads from the single master source;
- search, category filters, product detail, price display and availability labels are consistent;
- tests and build remain valid.

Do not rewrite or approve questionable data. Report evidence-backed findings. If a PR contains unsafe catalog changes, comment with exact file/record and required correction; otherwise leave a concise validation report.
