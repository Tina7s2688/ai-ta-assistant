$ErrorActionPreference = 'Stop'

function Assert-Equal {
  param(
    $Actual,
    [Parameter(Mandatory)] $Expected,
    [Parameter(Mandatory)] [string] $Message
  )

  if ($Actual -ne $Expected) {
    throw "$Message Expected: [$Expected]; actual: [$Actual]"
  }
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$modulePath = Join-Path $projectRoot 'PdfCompressor.Core.psm1'

if (Test-Path $modulePath) {
  Import-Module $modulePath -Force
}

$balancedDeviceSetting = if (Get-Command Get-CompressionProfile -ErrorAction SilentlyContinue) {
  (Get-CompressionProfile -Level 'balanced').PdfSettings
} else {
  $null
}
Assert-Equal -Actual $balancedDeviceSetting -Expected '/ebook' -Message '平衡模式必須使用適合一般閱讀的 Ghostscript 設定。'

$clearDeviceSetting = if (Get-Command Get-CompressionProfile -ErrorAction SilentlyContinue) {
  (Get-CompressionProfile -Level 'clear').PdfSettings
} else {
  $null
}
Assert-Equal -Actual $clearDeviceSetting -Expected '/prepress' -Message '清晰模式必須優先保留印刷品質。'

$smallDeviceSetting = if (Get-Command Get-CompressionProfile -ErrorAction SilentlyContinue) {
  (Get-CompressionProfile -Level 'small').PdfSettings
} else {
  $null
}
Assert-Equal -Actual $smallDeviceSetting -Expected '/screen' -Message '最小模式必須使用最小檔案的 Ghostscript 設定。'

$missingEngineMessage = if (Get-Command Get-PdfCompressionFailureMessage -ErrorAction SilentlyContinue) {
  Get-PdfCompressionFailureMessage -Kind 'engineMissing'
} else {
  $null
}
Assert-Equal -Actual $missingEngineMessage -Expected '找不到 Ghostscript。請先依 README 安裝，再重新開啟工具。' -Message '缺少壓縮引擎時，工具必須提供可執行的安裝指引。'

$passwordMessage = if (Get-Command Get-PdfCompressionFailureMessage -ErrorAction SilentlyContinue) {
  Get-PdfCompressionFailureMessage -Kind 'passwordProtected'
} else {
  $null
}
Assert-Equal -Actual $passwordMessage -Expected '這份 PDF 受密碼保護；請先解除保護後再壓縮。' -Message '受密碼保護的 PDF 必須說明無法處理的原因。'

$ghostscriptArguments = if (Get-Command Get-GhostscriptArguments -ErrorAction SilentlyContinue) {
  Get-GhostscriptArguments -InputPath 'C:\files\source.pdf' -OutputPath 'C:\files\source-compressed.pdf' -Level 'balanced'
} else {
  @()
}
Assert-Equal -Actual ($ghostscriptArguments -contains '-dPDFSETTINGS=/ebook') -Expected $true -Message '平衡模式必須傳給 Ghostscript 正確的壓縮設定。'
Assert-Equal -Actual ($ghostscriptArguments -contains '-sOutputFile=C:\files\source-compressed.pdf') -Expected $true -Message 'Ghostscript 必須輸出到新檔案，不能覆寫來源檔案。'
Assert-Equal -Actual ($ghostscriptArguments -contains 'C:\files\source.pdf') -Expected $true -Message 'Ghostscript 必須接收使用者所選的來源 PDF。'

$savedSummary = if (Get-Command Get-SizeSummary -ErrorAction SilentlyContinue) { Get-SizeSummary -InputBytes 200 -OutputBytes 150 } else { $null }
Assert-Equal -Actual $savedSummary -Expected '節省 25.0%' -Message '輸出較小時，結果必須顯示正確的節省比例。'

$increasedSummary = if (Get-Command Get-SizeSummary -ErrorAction SilentlyContinue) { Get-SizeSummary -InputBytes 200 -OutputBytes 250 } else { $null }
Assert-Equal -Actual $increasedSummary -Expected '增加 25.0%' -Message '輸出較大時，結果不可誤稱為節省。'

$temporaryFolder = Join-Path ([System.IO.Path]::GetTempPath()) ('pdf-compressor-test-' + [guid]::NewGuid())
[System.IO.Directory]::CreateDirectory($temporaryFolder) | Out-Null
try {
  $inputPath = Join-Path $temporaryFolder 'lecture.pdf'
  [System.IO.File]::WriteAllBytes($inputPath, [byte[]](37,80,68,70,45))
  $validPdf = if (Get-Command Test-PdfInput -ErrorAction SilentlyContinue) { Test-PdfInput -Path $inputPath } else { $false }
  Assert-Equal -Actual $validPdf -Expected $true -Message '以 PDF 標頭開頭的檔案必須可進入壓縮流程。'

  $engineMissingResult = $null
  if (Get-Command Invoke-PdfCompression -ErrorAction SilentlyContinue) {
    try {
      Invoke-PdfCompression -InputPath $inputPath -Level 'balanced' -GhostscriptPath (Join-Path $temporaryFolder 'missing.exe')
    } catch {
      $engineMissingResult = $_.Exception.Message
    }
  }
  Assert-Equal -Actual $engineMissingResult -Expected '找不到 Ghostscript。請先依 README 安裝，再重新開啟工具。' -Message '壓縮前找不到本機引擎時，不可產生或覆寫任何檔案。'

  $invalidPath = Join-Path $temporaryFolder 'not-a-pdf.pdf'
  [System.IO.File]::WriteAllText($invalidPath, 'ordinary text')
  $invalidPdf = if (Get-Command Test-PdfInput -ErrorAction SilentlyContinue) { Test-PdfInput -Path $invalidPath } else { $true }
  Assert-Equal -Actual $invalidPdf -Expected $false -Message '偽裝成 PDF 的非 PDF 檔案不可交給 Ghostscript。'

  $outputPath = if (Get-Command Get-AvailableOutputPath -ErrorAction SilentlyContinue) {
    Get-AvailableOutputPath -InputPath $inputPath
  } else {
    $null
  }
  Assert-Equal -Actual $outputPath -Expected (Join-Path $temporaryFolder 'lecture-compressed.pdf') -Message '壓縮結果不可覆寫原檔，預設名稱應加上 -compressed。'

  [System.IO.File]::WriteAllBytes($outputPath, [byte[]](37,80,68,70,45))
  $nextOutputPath = Get-AvailableOutputPath -InputPath $inputPath
  Assert-Equal -Actual $nextOutputPath -Expected (Join-Path $temporaryFolder 'lecture-compressed-2.pdf') -Message '已有同名結果時，工具必須使用下一個安全的檔名。'
} finally {
  Remove-Item -LiteralPath $temporaryFolder -Recurse -Force
}

Write-Host 'PASS: PdfCompressor core tests'
