# BrainBricks One-Click Deployment Script
$ROOT = Get-Location
$ADB = "C:\Users\Beknur\AppData\Local\Android\Sdk\platform-tools\adb.exe"

Write-Host "🚀 Starting Production Build..." -ForegroundColor Cyan
cd "$ROOT\prototype_2\client"
npx vite build
npx cap sync

Write-Host "📦 Assembling Android APK..." -ForegroundColor Cyan
cd android
.\gradlew assembleDebug

Write-Host "📲 Deploying to Device..." -ForegroundColor Cyan
cd "$ROOT"
& $ADB uninstall com.brainbricks.app
& $ADB install -r "$ROOT\prototype_2\client\android\app\build\outputs\apk\debug\app-debug.apk"

Write-Host "🏁 Launching BrainBricks..." -ForegroundColor Cyan
& $ADB shell monkey -p com.brainbricks.app -c android.intent.category.LAUNCHER 1

Write-Host "✅ Deployment Complete!" -ForegroundColor Green
