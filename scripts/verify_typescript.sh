#!/usr/bin/env bash
set -euo pipefail

echo "=== AI-Genesis Server Actions Test ==="
echo ""

# First check TypeScript compilation
echo "Step 1: TypeScript Compilation Check"
if ! npx tsc --noEmit 2>&1; then
    echo "[FAIL] TypeScript compilation failed"
    exit 1
fi
echo "[OK] TypeScript compilation passed"
echo ""

# Then run action tests
echo "Step 2: Server Actions Behavior Test"
OUTPUT=$(mktemp)
if npx tsx scripts/verify_actions.ts > "$OUTPUT" 2>&1; then
    TEST_EXIT=0
else
    TEST_EXIT=$?
fi

# Display the output
cat "$OUTPUT"

# Exit with test result
exit $TEST_EXIT
