$node20 = Join-Path $env:APPDATA 'nvm\v20.19.4\node.exe'
$playwrightCli = Join-Path $env:APPDATA 'npm\node_modules\@playwright\cli\playwright-cli.js'

if (-not (Test-Path -LiteralPath $node20 -PathType Leaf)) {
    Write-Error "Не найден Node.js 20.19.4: $node20"
    exit 1
}

if (-not (Test-Path -LiteralPath $playwrightCli -PathType Leaf)) {
    Write-Error "Не найден глобальный @playwright/cli: $playwrightCli"
    exit 1
}

& $node20 $playwrightCli @args
exit $LASTEXITCODE
