#!/bin/bash
set -e

echo "▶ Dumping database to JSON..."
source backend/.venv/bin/activate && python3 scripts/dump_to_json.py
echo "✓ Database dumped"

echo ""
echo "▶ Staging data files..."
git add frontend/public/data
CHANGED=$(git diff --cached --name-only | wc -l | tr -d ' ')
echo "  $CHANGED file(s) staged"

echo ""
echo "▶ Committing..."
if git diff --cached --quiet; then
  echo "  (nothing to commit, data unchanged)"
else
  git commit -m "Update data $(date '+%Y-%m-%d')"
  echo "✓ Committed"
fi

echo ""
echo "▶ Pushing to main (triggers GitHub Actions)..."
if git push origin main 2>/dev/null; then
  echo "✓ Pushed to main"
else
  echo "  (already up to date)"
fi

echo ""
echo "Done! GitHub Actions will deploy in a minute or two."
echo "  https://github.com/cjbaxt/cultural-dispatch/actions"
