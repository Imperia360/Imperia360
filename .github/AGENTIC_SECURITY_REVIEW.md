# Agentic workflow security review

Date: 2026-09-24

The GitHub Agentic Workflows compiler reported restricted secrets while compiling the three Imperia 360 agent workflows:
- CODEX_API_KEY
- OPENAI_API_KEY

Review decision:
- These secrets are expected authentication credentials for the selected OpenAI/Codex agent engine.
- The workflows are configured with read-oriented repository permissions and safe outputs limited to issue creation.
- The agent instructions explicitly prohibit direct modification of data/products.json.
- Catalog publication remains behind the existing reconciliation and validation pipeline.
- No secret values are stored in the repository or embedded in catalog data.

Compilation is therefore approved for these expected engine credentials. Any new secret, action, redirect, permission escalation, or direct catalog write introduced later requires a new review.
