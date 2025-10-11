# Persian TTS Audio Downloader
# Downloads TTS audio files with proper UTF-8 encoding for Persian characters

param(
    [string]$BaseUrl = "http://localhost:3001",
    [string]$OutputDir = "audio/downloaded",
    [int]$MaxFiles = 10
)

# Ensure output directory exists
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Persian text samples for TTS generation
$persianTexts = @(
    "سلام، چطور هستید؟",
    "امروز هوا خوب است",
    "کتاب خواندن مفید است",
    "فناوری پیشرفت کرده",
    "آموزش مهم است",
    "خانواده ارزشمند است",
    "کار کردن ضروری است",
    "سلامت مهم‌تر از ثروت است",
    "علم و دانش ارزشمند است",
    "دوستی و محبت مهم است",
    "این یک تست صوتی است",
    "کیفیت صدا خوب است",
    "تشخیص گفتار کار می‌کند",
    "مدل فارسی آموزش دیده",
    "دقت تشخیص بالا است"
)

Write-Host "🎤 Starting Persian TTS Audio Download..." -ForegroundColor Green
Write-Host "📁 Output Directory: $OutputDir" -ForegroundColor Yellow
Write-Host "🔗 Backend URL: $BaseUrl" -ForegroundColor Yellow

$successCount = 0
$errorCount = 0
$downloadedFiles = @()

foreach ($text in $persianTexts[0..($MaxFiles-1)]) {
    try {
        Write-Host "`n🔊 Generating TTS for: $text" -ForegroundColor Cyan
        
        # Create JSON payload with Persian text
        $jsonPayload = @{
            text = $text
            language = "fa"
            voice = "persian_female"
            speed = 1.0
            pitch = 1.0
            format = "wav"
            sampleRate = 16000
        } | ConvertTo-Json -Depth 3
        
        # Convert to UTF-8 byte array to handle Persian characters
        $utf8Bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonPayload)
        
        # Send TTS request with proper encoding
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/tts" -Method Post -Body $utf8Bytes -ContentType 'application/json; charset=utf-8'
        
        if ($response.error -eq $false -and $response.data.audio) {
            # Decode base64 audio data
            $audioBytes = [System.Convert]::FromBase64String($response.data.audio)
            
            # Generate filename based on text content
            $safeText = $text -replace '[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]', ''
            $safeText = $safeText -replace '\s+', '_'
            $filename = "tts_$($successCount + 1)_$safeText.wav"
            $filepath = Join-Path $OutputDir $filename
            
            # Save audio file
            [System.IO.File]::WriteAllBytes($filepath, $audioBytes)
            
            # Create metadata file
            $metadata = @{
                filename = $filename
                text = $text
                duration = $response.data.duration
                voice = $response.data.voice
                language = $response.data.language
                format = $response.data.format
                sampleRate = $response.data.sampleRate
                processingTime = $response.processingTime
                generatedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                fileSize = $audioBytes.Length
            } | ConvertTo-Json -Depth 3
            
            $metadataPath = $filepath -replace '\.wav$', '.json'
            [System.IO.File]::WriteAllText($metadataPath, $metadata, [System.Text.Encoding]::UTF8)
            
            $downloadedFiles += @{
                filename = $filename
                text = $text
                duration = $response.data.duration
                fileSize = $audioBytes.Length
                processingTime = $response.processingTime
            }
            
            Write-Host "✅ Downloaded: $filename ($($response.data.duration)s, $($audioBytes.Length) bytes)" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "❌ TTS generation failed for: $text" -ForegroundColor Red
            $errorCount++
        }
        
        # Add delay between requests
        Start-Sleep -Milliseconds 500
        
    } catch {
        Write-Host "❌ Error processing: $text - $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

# Generate summary report
$summary = @{
    generatedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    totalRequests = $persianTexts.Count
    successfulDownloads = $successCount
    failedDownloads = $errorCount
    outputDirectory = $OutputDir
    backendUrl = $BaseUrl
    files = $downloadedFiles
    totalDuration = ($downloadedFiles | Measure-Object -Property duration -Sum).Sum
    totalSize = ($downloadedFiles | Measure-Object -Property fileSize -Sum).Sum
} | ConvertTo-Json -Depth 3

$summaryPath = Join-Path $OutputDir "download_summary.json"
[System.IO.File]::WriteAllText($summaryPath, $summary, [System.Text.Encoding]::UTF8)

# Generate checksums
$checksums = @()
foreach ($file in $downloadedFiles) {
    $filepath = Join-Path $OutputDir $file.filename
    if (Test-Path $filepath) {
        $hash = Get-FileHash -Path $filepath -Algorithm SHA256
        $checksums += "$($hash.Hash)  $($file.filename)"
    }
}

$checksumsPath = Join-Path $OutputDir "checksums.txt"
$checksums | Out-File -FilePath $checksumsPath -Encoding UTF8

Write-Host "`n📊 Download Summary:" -ForegroundColor Yellow
Write-Host "✅ Successful: $successCount" -ForegroundColor Green
Write-Host "❌ Failed: $errorCount" -ForegroundColor Red
Write-Host "⏱️  Total Duration: $($summary.totalDuration)s" -ForegroundColor Cyan
Write-Host "📁 Total Size: $($summary.totalSize) bytes" -ForegroundColor Cyan
Write-Host "📄 Summary saved to: $summaryPath" -ForegroundColor Yellow
Write-Host "🔐 Checksums saved to: $checksumsPath" -ForegroundColor Yellow

if ($successCount -gt 0) {
    Write-Host "`n🎉 TTS audio download completed successfully!" -ForegroundColor Green
    Write-Host "📁 Files saved to: $OutputDir" -ForegroundColor Yellow
} else {
    Write-Host "`n⚠️  No files were downloaded. Check backend status." -ForegroundColor Red
}

# Test backend connectivity
Write-Host "`n🔍 Testing backend connectivity..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
    Write-Host "✅ Backend is healthy" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is not responding: $($_.Exception.Message)" -ForegroundColor Red
}

# Test TTS service status
try {
    $ttsStatus = Invoke-RestMethod -Uri "$BaseUrl/api/tts/status" -Method Get
    Write-Host "✅ TTS service is available" -ForegroundColor Green
} catch {
    Write-Host "❌ TTS service is not available: $($_.Exception.Message)" -ForegroundColor Red
}
