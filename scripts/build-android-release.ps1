param(
    [string]$DestinationDir,
    [string]$ApkName = "rpgorganizer.apk",
    [switch]$SkipWebBuild
)

$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $projectDir "android"
$javaHome = "C:\Program Files\Android\Android Studio\jbr"
$keystoreProperties = Join-Path $androidDir "keystore.properties"
$sourceApk = Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk"

if (-not $DestinationDir) {
    $phoneDir = -join ([char[]](0x0422, 0x0435, 0x043B, 0x0435, 0x0444, 0x043E, 0x043D))
    $DestinationDir = Join-Path (Join-Path "D:\!PashaDrive" $phoneDir) "MyAndroidProgs"
}

$targetApk = Join-Path $DestinationDir $ApkName

function Invoke-ExternalCommand {
    param(
        [string]$Name,
        [scriptblock]$Command
    )

    Write-Host ""
    Write-Host "== $Name =="
    & $Command

    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE"
    }
}

if (-not (Test-Path -LiteralPath $keystoreProperties)) {
    throw "Missing $keystoreProperties. Create it from android\keystore.properties.example and fill signing data from Android Studio."
}

if (-not (Test-Path -LiteralPath (Join-Path $javaHome "bin\java.exe"))) {
    throw "Java 17 from Android Studio was not found: $javaHome"
}

$env:JAVA_HOME = $javaHome
$env:Path = (Join-Path $javaHome "bin") + ";" + $env:Path

$npxCommand = Get-Command "npx.cmd" -ErrorAction SilentlyContinue
if ($npxCommand) {
    $npx = $npxCommand.Source
} else {
    $npx = "npx"
}

if (-not $SkipWebBuild) {
    Invoke-ExternalCommand "Angular prod build" { & $npx ng build --prod }
}

Invoke-ExternalCommand "Capacitor sync" { & $npx cap sync android }

Push-Location $androidDir
try {
    Invoke-ExternalCommand "Gradle signed APK" { & ".\gradlew.bat" assembleRelease }
} finally {
    Pop-Location
}

if (-not (Test-Path -LiteralPath $sourceApk)) {
    throw "Gradle finished, but APK was not found: $sourceApk"
}

New-Item -ItemType Directory -Force -Path $DestinationDir | Out-Null
Copy-Item -LiteralPath $sourceApk -Destination $targetApk -Force

Write-Host ""
Write-Host "APK is ready: $targetApk"
