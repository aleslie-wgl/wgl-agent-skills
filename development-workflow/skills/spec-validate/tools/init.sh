#!/bin/bash
# Initialization script for spec-validate skill
# Copies the validation script template to your project's scripts directory

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
TARGET_DIR="$PROJECT_ROOT/scripts"
TARGET_FILE="$TARGET_DIR/validate-code-quality.ts"

echo "========================================"
echo "spec-validate Skill Initialization"
echo "========================================"

# Check if target directory exists
if [ ! -d "$TARGET_DIR" ]; then
  echo "Creating scripts directory: $TARGET_DIR"
  mkdir -p "$TARGET_DIR"
fi

# Copy template to project
echo "Copying validation script template..."
cp "$SCRIPT_DIR/validate-code-quality.template.ts" "$TARGET_FILE"

echo ""
echo "✅ Validation script installed: $TARGET_FILE"
echo ""
echo "This script auto-detects your project configuration:"
echo "  - TypeScript (tsc)"
echo "  - ESLint"
echo "  - Prettier"
echo "  - Test commands (npm test, yarn test, pnpm test)"
echo "  - Build commands"
echo "  - Package manager (npm, yarn, pnpm)"
echo ""
echo "Usage:"
echo "  npx tsx scripts/validate-code-quality.ts"
echo "  npx tsx scripts/validate-code-quality.ts --skip-tests"
echo "  npx tsx scripts/validate-code-quality.ts --cwd=apps/my-app"
echo ""
echo "For help:"
echo "  npx tsx scripts/validate-code-quality.ts --help"
echo ""
echo "========================================"
