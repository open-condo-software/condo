#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${1:?registry required}"
SHA="${2:?sha required}"
MODE="${3:-optional}"

IMAGE="${REGISTRY}/condo/condo-image:${SHA}"

if docker manifest inspect "$IMAGE" >/dev/null 2>&1; then
    echo "PREBUILT_APPS_IMAGE=$IMAGE" >> "${GITHUB_ENV:?GITHUB_ENV is required}"
    echo "Using CI image: $IMAGE"
else
    if [[ "$MODE" == "required" ]]; then
        echo "ERROR: CI image not found for ${SHA}: $IMAGE"
        echo "Normal production deploy requires a successful Condo CI build for this commit."
        exit 1
    fi
    echo "CI image not found for ${SHA}, falling back to full werf build"
fi
