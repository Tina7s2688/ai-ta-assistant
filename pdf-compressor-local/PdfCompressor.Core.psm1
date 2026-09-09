Set-StrictMode -Version Latest

function Get-CompressionProfile {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [ValidateSet('clear', 'balanced', 'small')]
    [string] $Level
  )

  switch ($Level) {
    'clear' { return [pscustomobject]@{ Name = '清晰'; PdfSettings = '/prepress'; Description = '優先保留圖片與文字清晰度。' } }
    'balanced' { return [pscustomobject]@{ Name = '平衡'; PdfSettings = '/ebook'; Description = '兼顧閱讀品質與檔案大小。' } }
    'small' { return [pscustomobject]@{ Name = '最小'; PdfSettings = '/screen'; Description = '儘量縮小檔案，圖片可能略為模糊。' } }
  }
}

function Get-AvailableOutputPath {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string] $InputPath
  )

  $fullInputPath = [System.IO.Path]::GetFullPath($InputPath)
  $directory = [System.IO.Path]::GetDirectoryName($fullInputPath)
  $baseName = [System.IO.Path]::GetFileNameWithoutExtension($fullInputPath)
  $extension = [System.IO.Path]::GetExtension($fullInputPath)
  $candidate = Join-Path $directory ($baseName + '-compressed' + $extension)
  $suffix = 2

  while (Test-Path -LiteralPath $candidate) {
    $candidate = Join-Path $directory ($baseName + '-compressed-' + $suffix + $extension)
    $suffix++
  }

  return $candidate
}

function Get-PdfCompressionFailureMessage {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [ValidateSet('engineMissing', 'passwordProtected', 'invalidPdf', 'compressionFailed')]
    [string] $Kind
  )

  switch ($Kind) {
    'engineMissing' { return '找不到 Ghostscript。請先依 README 安裝，再重新開啟工具。' }
    'passwordProtected' { return '這份 PDF 受密碼保護；請先解除保護後再壓縮。' }
    'invalidPdf' { return '這不是可處理的 PDF，或檔案已損壞。' }
    'compressionFailed' { return '壓縮失敗；原始 PDF 未被修改。請確認檔案可正常開啟後再試一次。' }
  }
}

function Test-PdfInput {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [string] $Path
  )

  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $false }
  if ([System.IO.Path]::GetExtension($Path) -ine '.pdf') { return $false }

  $stream = [System.IO.File]::OpenRead($Path)
  try {
    if ($stream.Length -lt 5) { return $false }
    $header = New-Object byte[] 5
    [void] $stream.Read($header, 0, 5)
    return ([System.Text.Encoding]::ASCII.GetString($header) -eq '%PDF-')
  } finally {
    $stream.Dispose()
  }
}

function Get-GhostscriptArguments {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)] [string] $InputPath,
    [Parameter(Mandatory)] [string] $OutputPath,
    [Parameter(Mandatory)] [ValidateSet('clear', 'balanced', 'small')] [string] $Level
  )

  $profile = Get-CompressionProfile -Level $Level
  return @(
    '-dSAFER', '-dBATCH', '-dNOPAUSE', '-dQUIET', '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4', "-dPDFSETTINGS=$($profile.PdfSettings)",
    "-sOutputFile=$OutputPath", $InputPath
  )
}

function Get-SizeSummary {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)] [long] $InputBytes,
    [Parameter(Mandatory)] [long] $OutputBytes
  )

  if ($InputBytes -le 0) { return '大小無法比較' }
  $percent = [math]::Abs(($OutputBytes - $InputBytes) / $InputBytes * 100)
  if ($OutputBytes -lt $InputBytes) { return ('節省 {0:N1}%' -f $percent) }
  if ($OutputBytes -gt $InputBytes) { return ('增加 {0:N1}%' -f $percent) }
  return '大小不變'
}

function Find-GhostscriptExecutable {
  [CmdletBinding()]
  param()

  foreach ($commandName in @('gswin64c.exe', 'gswin32c.exe', 'gswin64c', 'gswin32c')) {
    $command = Get-Command $commandName -ErrorAction SilentlyContinue
    if ($command -and (Test-Path -LiteralPath $command.Source -PathType Leaf)) { return $command.Source }
  }

  foreach ($root in @($env:ProgramFiles, ${env:ProgramFiles(x86)}) | Where-Object { $_ }) {
    $ghostscriptRoot = Join-Path $root 'gs'
    if (-not (Test-Path -LiteralPath $ghostscriptRoot -PathType Container)) { continue }
    $candidate = Get-ChildItem -LiteralPath $ghostscriptRoot -Filter 'gswin64c.exe' -Recurse -File -ErrorAction SilentlyContinue |
      Sort-Object FullName -Descending | Select-Object -First 1
    if ($candidate) { return $candidate.FullName }
  }

  return $null
}

function Invoke-PdfCompression {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)] [string] $InputPath,
    [Parameter(Mandatory)] [ValidateSet('clear', 'balanced', 'small')] [string] $Level,
    [string] $OutputPath,
    [string] $GhostscriptPath = (Find-GhostscriptExecutable)
  )

  if (-not (Test-PdfInput -Path $InputPath)) { throw (Get-PdfCompressionFailureMessage -Kind 'invalidPdf') }
  if (-not $GhostscriptPath -or -not (Test-Path -LiteralPath $GhostscriptPath -PathType Leaf)) {
    throw (Get-PdfCompressionFailureMessage -Kind 'engineMissing')
  }

  $fullInputPath = [System.IO.Path]::GetFullPath($InputPath)
  if (-not $OutputPath) { $OutputPath = Get-AvailableOutputPath -InputPath $fullInputPath }
  $fullOutputPath = [System.IO.Path]::GetFullPath($OutputPath)
  if ($fullInputPath -eq $fullOutputPath) { throw '輸出檔案不得覆寫原始 PDF。' }
  if (Test-Path -LiteralPath $fullOutputPath) { throw '輸出檔案已存在；請改用其他檔名。' }

  $engineOutput = & $GhostscriptPath @(Get-GhostscriptArguments -InputPath $fullInputPath -OutputPath $fullOutputPath -Level $Level) 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $fullOutputPath -PathType Leaf)) {
    if (Test-Path -LiteralPath $fullOutputPath) { Remove-Item -LiteralPath $fullOutputPath -Force }
    if ($engineOutput -match '(?i)password|encrypted') { throw (Get-PdfCompressionFailureMessage -Kind 'passwordProtected') }
    throw (Get-PdfCompressionFailureMessage -Kind 'compressionFailed')
  }

  return [pscustomobject]@{
    InputPath = $fullInputPath
    OutputPath = $fullOutputPath
    InputBytes = (Get-Item -LiteralPath $fullInputPath).Length
    OutputBytes = (Get-Item -LiteralPath $fullOutputPath).Length
  }
}

Export-ModuleMember -Function Get-CompressionProfile, Get-AvailableOutputPath, Get-PdfCompressionFailureMessage, Test-PdfInput, Get-GhostscriptArguments, Get-SizeSummary, Find-GhostscriptExecutable, Invoke-PdfCompression
