#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${1:?registry required}"
SHA="${2:?sha required}"

IMAGE="${REGISTRY}/condo/condo-image:${SHA}"

if docker manifest inspect "$IMAGE" >/dev/null 2>&1; then
    echo "PREBUILT_APPS_IMAGE=$IMAGE" >> "${GITHUB_ENV:?GITHUB_ENV is required}"
    echo "Using CI image: $IMAGE"
else
    echo "CI image not found for ${SHA}, falling back to full werf build"
fi
