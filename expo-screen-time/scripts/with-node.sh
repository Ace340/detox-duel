#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
# Copyright 2018-present 650 Industries. All rights reserved.
#
# Stub script that delegates to the shared with-node.sh
# This script is maintained at scripts/shared/with-node.sh
#
# USAGE:
# ./with-node.sh command

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"

# Find the shared script relative to project root
# Navigate up to the project root, then to scripts/shared/
SHARED_SCRIPT="$(cd "${SCRIPT_DIR}/../../scripts/shared" && pwd -P)/with-node.sh"

# Execute the shared script with all arguments
if [[ -f "$SHARED_SCRIPT" ]]; then
  exec "$SHARED_SCRIPT" "$@"
else
  echo "[ERROR] Shared script not found at: ${SHARED_SCRIPT}" >&2
  exit 1
fi