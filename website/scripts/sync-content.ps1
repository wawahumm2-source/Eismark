$ErrorActionPreference = "Stop"

$websiteRoot = Split-Path -Parent $PSScriptRoot
$projectRoot = Split-Path -Parent $websiteRoot
$source = Join-Path $projectRoot "outputs"
$destination = Join-Path $websiteRoot "content\archive"

New-Item -ItemType Directory -Force -Path $destination | Out-Null
Copy-Item -Path (Join-Path $source "*.md") -Destination $destination -Force

Get-ChildItem -File $destination | Select-Object Name, Length, LastWriteTime
