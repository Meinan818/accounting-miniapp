param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $Goals = @('test')
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$runtime = Join-Path $projectRoot '.workbuddy/memory/backend-foundation/apache-maven-3.9.11/bin/mvn.cmd'
if (!(Test-Path -LiteralPath $runtime)) {
    $runtime = (Get-Command mvn.cmd -ErrorAction Stop).Source
}
$cache = Join-Path $projectRoot '.cache/backend'
$repository = Join-Path $projectRoot '.workbuddy/memory/backend-foundation/maven-repository'
$temporary = Join-Path $cache 'tmp'
New-Item -ItemType Directory -Path $temporary -Force | Out-Null
$previousTemp = $env:TEMP
$previousTmp = $env:TMP
Push-Location $PSScriptRoot
try {
    $env:TEMP = $temporary
    $env:TMP = $temporary
    & $runtime "-Dmaven.repo.local=$repository" "-Djava.io.tmpdir=$temporary" @Goals
    $result = $LASTEXITCODE
} finally {
    Pop-Location
    $env:TEMP = $previousTemp
    $env:TMP = $previousTmp
}
exit $result
