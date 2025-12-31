name: pipeline

on:
  workflow_dispatch:
  schedule:
    - cron: "0 */12 * * *"

jobs:
  run:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install deps
        run: npm install || true

      - name: Fetch gold.json from Worker
        run: node scripts/fetch_gold.js

      - name: Normalize
        run: node scripts/normalize.js

      - name: Update history
        run: node scripts/update_history.js

      # === ДОБАВЛЕНО ===
      - name: Apply stickiness
        run: node scripts/apply_stickiness.js
      # =================

      - name: Score v2
        run: node scripts/score_v2.js

      - name: Export Clash main.yaml
        run: node scripts/export_clash.js

      - name: Commit artifacts
        run: |
          git config user.name "actions"
          git config user.email "actions@github.com"
          git add work/ export/
          git commit -m "update pipeline artifacts" || true
          git push || true
