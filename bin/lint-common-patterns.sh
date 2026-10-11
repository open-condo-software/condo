#!/usr/bin/env bash
set -e

IGNORE_DIRS="--ignore-dir=node_modules --ignore-dir=.git --ignore-dir=dist --ignore-dir=build"

echo "1. Checking for setFakeClientMode in test files..."
if git grep -nw "setFakeClientMode" -- "*.test.js" $IGNORE_DIRS; then
    echo "Error: Found setFakeClientMode usage in test files. Use it only in .spec.js files!"
    exit 1
fi

echo "All checks passed!"
exit 0
