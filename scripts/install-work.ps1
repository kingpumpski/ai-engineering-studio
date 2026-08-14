$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$InstallDir = Join-Path $HOME '.work-agent'
$BinDir = Join-Path $HOME 'bin'
New-Item -ItemType Directory -Force -Path $InstallDir, $BinDir | Out-Null

foreach ($file in @('work.mjs','work-mcp.mjs','project-context.mjs','work-task.mjs')) {
  Copy-Item (Join-Path $Root "scripts/$file") (Join-Path $InstallDir $file) -Force
}
if (Test-Path (Join-Path $InstallDir 'config')) { Remove-Item (Join-Path $InstallDir 'config') -Recurse -Force }
Copy-Item (Join-Path $Root 'config') (Join-Path $InstallDir 'config') -Recurse -Force

$Cmd = Join-Path $BinDir 'work.cmd'
@"
@echo off
if "%1"=="task" (
  shift
  node "%USERPROFILE%\.work-agent\work-task.mjs" %*
) else (
  node "%USERPROFILE%\.work-agent\work.mjs" %*
)
"@ | Set-Content -Path $Cmd -Encoding ASCII
$McpCmd = Join-Path $BinDir 'work-mcp.cmd'
@"
@echo off
node "%USERPROFILE%\.work-agent\work-mcp.mjs" %*
"@ | Set-Content -Path $McpCmd -Encoding ASCII

$UserPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if (-not (($UserPath -split ';') -contains $BinDir)) {
  $NewPath = if ([string]::IsNullOrWhiteSpace($UserPath)) { $BinDir } else { "$UserPath;$BinDir" }
  [Environment]::SetEnvironmentVariable('Path', $NewPath, 'User')
}

Write-Host "work installed at $Cmd"
Write-Host "work-mcp installed at $McpCmd"
Write-Host "Open a new terminal, then run: work status"
