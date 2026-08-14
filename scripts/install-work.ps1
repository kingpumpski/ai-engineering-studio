$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$InstallDir = Join-Path $HOME '.work-agent'
$BinDir = Join-Path $HOME 'bin'

New-Item -ItemType Directory -Force -Path $InstallDir, $BinDir | Out-Null
Copy-Item (Join-Path $Root 'scripts/work.mjs') (Join-Path $InstallDir 'work.mjs') -Force
if (Test-Path (Join-Path $InstallDir 'config')) { Remove-Item (Join-Path $InstallDir 'config') -Recurse -Force }
Copy-Item (Join-Path $Root 'config') (Join-Path $InstallDir 'config') -Recurse -Force

$Cmd = Join-Path $BinDir 'work.cmd'
@"
@echo off
node "%USERPROFILE%\.work-agent\work.mjs" %*
"@ | Set-Content -Path $Cmd -Encoding ASCII

$UserPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if (-not (($UserPath -split ';') -contains $BinDir)) {
  $NewPath = if ([string]::IsNullOrWhiteSpace($UserPath)) { $BinDir } else { "$UserPath;$BinDir" }
  [Environment]::SetEnvironmentVariable('Path', $NewPath, 'User')
}

Write-Host "work installed at $Cmd"
Write-Host "Open a new terminal, then run: work status"
