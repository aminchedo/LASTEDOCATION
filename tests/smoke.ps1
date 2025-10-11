# PowerShell smoke test for proxy system
# Prerequisites: Node 18+, proxy running on http://localhost:3001

$ErrorActionPreference = "Stop"

$BASE = "http://localhost:3001/api/v1"
$urls = @(
  "https://huggingface.co/datasets/mozilla-foundation/common_voice_19_0/resolve/main/transcript/fa/train/train.tar.gz",
  "https://huggingface.co/datasets/mozilla-foundation/common_voice_19_0/resolve/main/transcript/fa/validation/validation.tar.gz",
  "https://huggingface.co/datasets/MahtaFetrat/Mana-TTS/resolve/main/dataset/dataset_part_001.parquet",
  "https://github.com/MahtaFetrat/ManaTTS-Persian-Tacotron2-Model/archive/refs/heads/main.zip",
  "https://github.com/mansourehk/ShEMO/raw/master/female.zip",
  "https://github.com/mansourehk/ShEMO/raw/master/male.zip",
  "https://github.com/mansourehk/ShEMO/raw/master/transcript.zip",
  "http://download.tensorflow.org/data/speech_commands_v0.02.tar.gz"
)

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    } else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-Host "==> Health check" -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$BASE/health" -Method Get
    if ($health.ok) {
        Write-ColorOutput Green "  OK $BASE/health => $($health | ConvertTo-Json -Compress)"
    } else {
        Write-ColorOutput Red "  FAIL $BASE/health => $($health | ConvertTo-Json -Compress)"
        exit 1
    }
} catch {
    Write-ColorOutput Red "  FAIL $BASE/health => $($_.Exception.Message)"
    exit 1
}

Write-Host ""
Write-Host "--------------------------------------------------------------------------" -ForegroundColor Gray
Write-Host ("{0,-6} | {1,-4} | {2,-7} | {3,-10} | {4}" -f "IDX", "OK", "STATUS", "SIZE(B)", "FILENAME / FINAL URL") -ForegroundColor Gray
Write-Host "--------------------------------------------------------------------------" -ForegroundColor Gray

$idx = 0
$fail_count = 0

foreach ($raw in $urls) {
    $idx++
    $enc = [System.Web.HttpUtility]::UrlEncode($raw)
    
    # 1) Resolve
    try {
        $res_json = Invoke-RestMethod -Uri "$BASE/sources/resolve?url=$enc" -Method Get
        $ok = $res_json.ok
        $status = $res_json.status
        $size = if ($res_json.sizeBytes) { $res_json.sizeBytes } else { 0 }
        $fname = if ($res_json.filename) { $res_json.filename } else { "" }
        $final = if ($res_json.finalUrl) { $res_json.finalUrl } else { "" }
        
        if ($ok -ne $true) {
            Write-Host ("{0,-6} | {1,-4} | {2,-7} | {3,-10} | {4}" -f $idx, "NO", $status, $size, "$fname  $raw") -ForegroundColor Red
            $fail_count++
            continue
        }
        
        # 2) Proxy HEAD (just headers)
        try {
            $head_response = Invoke-WebRequest -Uri "$BASE/sources/proxy?url=$enc" -Method Head -ErrorAction SilentlyContinue
            $head_status = $head_response.StatusCode
            
            if ($head_status -eq 200 -or $head_status -eq 206) {
                Write-Host ("{0,-6} | {1,-4} | {2,-7} | {3,-10} | {4}" -f $idx, "YES", $status, $size, "$fname  $final") -ForegroundColor Green
            } else {
                Write-Host ("{0,-6} | {1,-4} | {2,-7} | {3,-10} | {4}" -f $idx, "HEAD", $head_status, $size, "$fname  $final") -ForegroundColor Yellow
            }
        } catch {
            Write-Host ("{0,-6} | {1,-4} | {2,-7} | {3,-10} | {4}" -f $idx, "HEAD", "ERR", $size, "$fname  $final") -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host ("{0,-6} | {1,-4} | {2,-7} | {3,-10} | {4}" -f $idx, "NO", "ERR", "0", $raw) -ForegroundColor Red
        $fail_count++
    }
}

Write-Host "--------------------------------------------------------------------------" -ForegroundColor Gray

if ($fail_count -gt 0) {
    Write-ColorOutput Red "RESULT: $fail_count link(s) failed resolve. Fix URLs or set HF_TOKEN for private/limited HF assets."
    exit 2
} else {
    Write-ColorOutput Green "RESULT: all links resolved successfully. Proxy responds."
}

Write-Host ""
Write-Host "Quick manual check:" -ForegroundColor Cyan
Write-Host "  1) Open frontend Download Center." -ForegroundColor White
Write-Host "  2) Click Download on any dataset." -ForegroundColor White
Write-Host "  3) In DevTools → Network, you should ONLY see requests to /api/v1/sources/proxy?... (no direct cross-origin)." -ForegroundColor White
