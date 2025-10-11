# Simple TTS Audio Downloader
# Downloads TTS audio files with proper UTF-8 encoding

param(
    [string]$BaseUrl = "http://localhost:3001",
    [string]$OutputDir = "audio/downloaded"
)

# Ensure output directory exists
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Test texts (using ASCII-safe Persian text)
$testTexts = @(
    "Hello, how are you?",
    "This is a test message",
    "Technology is advancing",
    "Education is important",
    "Family is valuable"
)

Write-Host "Starting TTS Audio Download..." -ForegroundColor Green
Write-Host "Output Directory: $OutputDir" -ForegroundColor Yellow
Write-Host "Backend URL: $BaseUrl" -ForegroundColor Yellow

$successCount = 0
$errorCount = 0

foreach ($text in $testTexts) {
    try {
        Write-Host "Generating TTS for: $text" -ForegroundColor Cyan
        
        # Create JSON payload
        $jsonPayload = @{
            text = $text
            language = "en"
            voice = "persian_female"
            speed = 1.0
            pitch = 1.0
            format = "wav"
            sampleRate = 16000
        } | ConvertTo-Json
        
        # Convert to UTF-8 byte array
        $utf8Bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonPayload)
        
        # Send TTS request
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/tts" -Method Post -Body $utf8Bytes -ContentType 'application/json; charset=utf-8'
        
        if ($response.error -eq $false -and $response.data.audio) {
            # Decode base64 audio data
            $audioBytes = [System.Convert]::FromBase64String($response.data.audio)
            
            # Generate filename
            $filename = "tts_$($successCount + 1).wav"
            $filepath = Join-Path $OutputDir $filename
            
            # Save audio file
            [System.IO.File]::WriteAllBytes($filepath, $audioBytes)
            
            Write-Host "Downloaded: $filename ($($response.data.duration)s, $($audioBytes.Length) bytes)" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "TTS generation failed for: $text" -ForegroundColor Red
            $errorCount++
        }
        
        # Add delay between requests
        Start-Sleep -Milliseconds 500
        
    } catch {
        Write-Host "Error processing: $text - $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host "Download Summary:" -ForegroundColor Yellow
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Failed: $errorCount" -ForegroundColor Red

if ($successCount -gt 0) {
    Write-Host "TTS audio download completed successfully!" -ForegroundColor Green
    Write-Host "Files saved to: $OutputDir" -ForegroundColor Yellow
} else {
    Write-Host "No files were downloaded. Check backend status." -ForegroundColor Red
}
