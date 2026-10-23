#!/bin/sh
# Usage: scripts/native.sh ios|android dev|prod
# Puts that variant's generated native folder in place. The other variant's folder is parked as
# <platform>-<variant> with its Pods and build cache, so switching back doesn't rebuild from scratch.
# Prebuild only runs the first time a variant is built, or after `rm -rf ios-dev ios-prod ios`.
set -e
cd "$(dirname "$0")/.."
p=$1 v=$2
cur=$(cat "$p/.variant" 2>/dev/null || true)
[ "$cur" = "$v" ] && exit 0
if [ -n "$cur" ]; then mv "$p" "$p-$cur"; else rm -rf "$p"; fi # no marker: made before this script, regenerate
if [ -d "$p-$v" ]; then
  mv "$p-$v" "$p"
else
  [ "$v" = dev ] && export APP_VARIANT=development
  EXPO_NO_GIT_STATUS=1 npx expo prebuild -p "$p"
  echo "$v" > "$p/.variant"
fi
