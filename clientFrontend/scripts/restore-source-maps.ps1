param(
  [string]$BuildDirectory = (Join-Path $PSScriptRoot "..\build"),
  [string]$SourceDirectory = (Join-Path $PSScriptRoot "..\src")
)

$ErrorActionPreference = "Stop"
$buildPath = [IO.Path]::GetFullPath($BuildDirectory)
$sourcePath = [IO.Path]::GetFullPath($SourceDirectory)
$encoding = [Text.UTF8Encoding]::new($false)

if (-not (Test-Path -LiteralPath $buildPath)) {
  throw "Build directory was not found: $buildPath"
}

[IO.Directory]::CreateDirectory($sourcePath) | Out-Null
$restored = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$maps = Get-ChildItem -LiteralPath (Join-Path $buildPath "static") -Recurse -File -Filter "*.map"

foreach ($map in $maps) {
  $data = Get-Content -LiteralPath $map.FullName -Raw | ConvertFrom-Json
  for ($index = 0; $index -lt $data.sources.Count; $index += 1) {
    $relative = [string]$data.sources[$index]
    $content = [string]$data.sourcesContent[$index]

    if (-not $content -or $relative -match "node_modules|webpack|<anonymous>" -or $relative -match "(^|[\\/])\.\.([\\/]|$)") {
      continue
    }
    if ($relative -notmatch "\.(js|jsx|css)$") {
      continue
    }

    $destination = [IO.Path]::GetFullPath((Join-Path $sourcePath $relative))
    if (-not $destination.StartsWith($sourcePath, [StringComparison]::OrdinalIgnoreCase)) {
      throw "Unsafe source-map path: $relative"
    }

    [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($destination)) | Out-Null
    [IO.File]::WriteAllText($destination, $content, $encoding)
    $restored.Add($relative) | Out-Null
  }
}

Write-Output "Restored $($restored.Count) source files into $sourcePath"
