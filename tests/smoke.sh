#!/usr/bin/env bash
set -euo pipefail

BASE="http://localhost:3001/api/v1"
RED=$(printf '\033[31m'); GRN=$(printf '\033[32m'); YEL=$(printf '\033[33m'); NC=$(printf '\033[0m')

urls=(
  "https://huggingface.co/datasets/mozilla-foundation/common_voice_19_0/resolve/main/transcript/fa/train/train.tar.gz"
  "https://huggingface.co/datasets/mozilla-foundation/common_voice_19_0/resolve/main/transcript/fa/validation/validation.tar.gz"
  "https://huggingface.co/datasets/MahtaFetrat/Mana-TTS/resolve/main/dataset/dataset_part_001.parquet"
  "https://github.com/MahtaFetrat/ManaTTS-Persian-Tacotron2-Model/archive/refs/heads/main.zip"
  "https://github.com/mansourehk/ShEMO/raw/master/female.zip"
  "https://github.com/mansourehk/ShEMO/raw/master/male.zip"
  "https://github.com/mansourehk/ShEMO/raw/master/transcript.zip"
  "http://download.tensorflow.org/data/speech_commands_v0.02.tar.gz"
)

echo "==> Health check"
health=$(curl -sS "${BASE}/health" || true)
if [[ "$health" == *"ok"* ]]; then
  echo "  ${GRN}OK${NC} ${BASE}/health => $health"
else
  echo "  ${RED}FAIL${NC} ${BASE}/health => $health"
  exit 1
fi

pad() { printf "%-8s" "$1"; }
hbar() { printf "%s\n" "--------------------------------------------------------------------------"; }

echo
hbar
printf "%-6s | %-4s | %-7s | %-10s | %s\n" "IDX" "OK" "STATUS" "SIZE(B)" "FILENAME / FINAL URL"
hbar

idx=0
fail_count=0

for raw in "${urls[@]}"; do
  idx=$((idx+1))
  enc=$(python - <<PY
import urllib.parse, sys
print(urllib.parse.quote(sys.argv[1], safe=""))
PY
"$raw")

  # 1) Resolve
  res_json=$(curl -sS "${BASE}/sources/resolve?url=${enc}" || true)
  ok=$(echo "$res_json" | jq -r '.ok' 2>/dev/null || echo "false")
  status=$(echo "$res_json" | jq -r '.status' 2>/dev/null || echo "")
  size=$(echo "$res_json" | jq -r '.sizeBytes // 0' 2>/dev/null || echo "0")
  fname=$(echo "$res_json" | jq -r '.filename // ""' 2>/dev/null || echo "")
  final=$(echo "$res_json" | jq -r '.finalUrl // ""' 2>/dev/null || echo "")

  if [[ "$ok" != "true" ]]; then
    printf "%-6s | ${RED}%-4s${NC} | %-7s | %-10s | %s\n" "$idx" "NO" "${status:-"-"}" "$size" "${fname:-"-"}  $raw"
    fail_count=$((fail_count+1))
    continue
  fi

  # 2) Proxy HEAD (just headers)
  head_status=$(curl -sS -o /dev/null -w "%{http_code}" -I "${BASE}/sources/proxy?url=${enc}" || echo "000")

  if [[ "$head_status" == "200" || "$head_status" == "206" ]]; then
    printf "%-6s | ${GRN}%-4s${NC} | %-7s | %-10s | %s\n" "$idx" "YES" "$status" "$size" "${fname:-"-"}  ${final:-$raw}"
  else
    printf "%-6s | ${YEL}%-4s${NC} | %-7s | %-10s | %s\n" "$idx" "HEAD" "$head_status" "$size" "${fname:-"-"}  ${final:-$raw}"
    # HEAD ممکنه روی بعضی سرورها محدود باشه؛ ولی رزولوشن OK بود.
  fi
done

hbar
if [[ $fail_count -gt 0 ]]; then
  echo "${RED}RESULT:${NC} $fail_count link(s) failed resolve. Fix URLs or set HF_TOKEN for private/limited HF assets."
  exit 2
else
  echo "${GRN}RESULT:${NC} all links resolved successfully. Proxy responds."
fi

echo
echo "Quick manual check:"
echo "  1) Open frontend Download Center."
echo "  2) Click Download on any dataset."
echo "  3) In DevTools → Network, you should ONLY see requests to /api/v1/sources/proxy?... (no direct cross-origin)."
