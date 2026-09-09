param()

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName PresentationFramework

Import-Module (Join-Path $PSScriptRoot 'PdfCompressor.Core.psm1') -Force

[xml]$xaml = @'
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="本機 PDF 壓縮小工具" Height="560" Width="720" MinHeight="560" MinWidth="720"
        WindowStartupLocation="CenterScreen" Background="#F7F4EF">
  <Grid Margin="32">
    <Grid.RowDefinitions>
      <RowDefinition Height="Auto" />
      <RowDefinition Height="18" />
      <RowDefinition Height="150" />
      <RowDefinition Height="20" />
      <RowDefinition Height="Auto" />
      <RowDefinition Height="20" />
      <RowDefinition Height="Auto" />
      <RowDefinition Height="*" />
      <RowDefinition Height="Auto" />
    </Grid.RowDefinitions>
    <StackPanel Grid.Row="0">
      <TextBlock Text="本機 PDF 壓縮小工具" FontSize="28" FontWeight="SemiBold" Foreground="#12344D" />
      <TextBlock Text="檔案只會在這台電腦處理，不會上傳。原始 PDF 永遠保留不變。" Margin="0,8,0,0" FontSize="15" Foreground="#53626C" />
    </StackPanel>
    <Border x:Name="DropArea" Grid.Row="2" Background="White" BorderBrush="#2F7B75" BorderThickness="2" CornerRadius="12" AllowDrop="True" Padding="24">
      <StackPanel VerticalAlignment="Center" HorizontalAlignment="Center">
        <TextBlock Text="將一個 PDF 拖放到這裡" FontSize="19" FontWeight="SemiBold" HorizontalAlignment="Center" Foreground="#12344D" />
        <TextBlock x:Name="SelectedFile" Text="或按下方按鈕選擇檔案" Margin="0,9,0,14" TextWrapping="Wrap" TextAlignment="Center" Foreground="#53626C" />
        <Button x:Name="BrowseButton" Content="選擇 PDF 檔案" Width="150" HorizontalAlignment="Center" Padding="10,6" />
      </StackPanel>
    </Border>
    <StackPanel Grid.Row="4">
      <TextBlock Text="壓縮強度" FontSize="16" FontWeight="SemiBold" Foreground="#12344D" />
      <StackPanel Orientation="Horizontal" Margin="0,10,0,0">
        <RadioButton x:Name="ClearLevel" GroupName="CompressionLevel" Content="清晰 - 優先保留品質" Margin="0,0,22,0" />
        <RadioButton x:Name="BalancedLevel" GroupName="CompressionLevel" Content="平衡 - 一般閱讀建議" IsChecked="True" Margin="0,0,22,0" />
        <RadioButton x:Name="SmallLevel" GroupName="CompressionLevel" Content="最小 - 檔案最小化" />
      </StackPanel>
    </StackPanel>
    <StackPanel Grid.Row="6" Orientation="Horizontal">
      <Button x:Name="CompressButton" Content="開始壓縮" Width="140" Padding="12,8" Background="#1F766E" Foreground="White" BorderBrush="#1F766E" FontWeight="SemiBold" />
      <Button x:Name="OpenFolderButton" Content="開啟結果資料夾" Width="150" Padding="12,8" Margin="12,0,0,0" IsEnabled="False" />
    </StackPanel>
    <Border Grid.Row="8" Background="#E9F3F1" CornerRadius="8" Padding="14">
      <TextBlock x:Name="StatusText" Text="請選擇一個 PDF。" TextWrapping="Wrap" Foreground="#12344D" />
    </Border>
  </Grid>
</Window>
'@

$reader = New-Object System.Xml.XmlNodeReader $xaml
$window = [Windows.Markup.XamlReader]::Load($reader)
$dropArea = $window.FindName('DropArea')
$selectedFile = $window.FindName('SelectedFile')
$browseButton = $window.FindName('BrowseButton')
$clearLevel = $window.FindName('ClearLevel')
$balancedLevel = $window.FindName('BalancedLevel')
$smallLevel = $window.FindName('SmallLevel')
$compressButton = $window.FindName('CompressButton')
$openFolderButton = $window.FindName('OpenFolderButton')
$statusText = $window.FindName('StatusText')

$script:selectedPath = $null
$script:outputPath = $null

function Set-Status([string] $Message) {
  $statusText.Text = $Message
}

function Format-FileSize([long] $Bytes) {
  if ($Bytes -lt 1KB) { return "$Bytes B" }
  if ($Bytes -lt 1MB) { return ('{0:N1} KB' -f ($Bytes / 1KB)) }
  return ('{0:N1} MB' -f ($Bytes / 1MB))
}

function Set-SelectedPdf([string] $Path) {
  if (-not (Test-PdfInput -Path $Path)) {
    $script:selectedPath = $null
    $selectedFile.Text = '請選擇一個可正常開啟的 PDF 檔案。'
    Set-Status (Get-PdfCompressionFailureMessage -Kind 'invalidPdf')
    return
  }

  $script:selectedPath = [System.IO.Path]::GetFullPath($Path)
  $selectedFile.Text = [System.IO.Path]::GetFileName($script:selectedPath)
  Set-Status ('已選擇：' + (Format-FileSize (Get-Item -LiteralPath $script:selectedPath).Length) + '。按「開始壓縮」即可產生新檔。')
}

function Get-SelectedLevel {
  if ($clearLevel.IsChecked) { return 'clear' }
  if ($smallLevel.IsChecked) { return 'small' }
  return 'balanced'
}

$browseButton.Add_Click({
  $dialog = New-Object Microsoft.Win32.OpenFileDialog
  $dialog.Filter = 'PDF 檔案 (*.pdf)|*.pdf'
  $dialog.Multiselect = $false
  if ($dialog.ShowDialog()) { Set-SelectedPdf $dialog.FileName }
})

$dropArea.Add_DragOver({
  param($sender, $event)
  if ($event.Data.GetDataPresent([Windows.DataFormats]::FileDrop)) {
    $event.Effects = [System.Windows.DragDropEffects]::Copy
    $event.Handled = $true
  }
})

$dropArea.Add_Drop({
  param($sender, $event)
  $files = [string[]]$event.Data.GetData([Windows.DataFormats]::FileDrop)
  if ($files.Count -ne 1) {
    Set-Status '第一版一次只能壓縮一個 PDF。'
    return
  }
  Set-SelectedPdf $files[0]
})

$compressButton.Add_Click({
  if (-not $script:selectedPath) {
    Set-Status '請先選擇一個 PDF。'
    return
  }

  $compressButton.IsEnabled = $false
  $window.Cursor = [System.Windows.Input.Cursors]::Wait
  try {
    Set-Status '正在本機壓縮，請稍候...'
    $window.Dispatcher.Invoke([Action] {}, [System.Windows.Threading.DispatcherPriority]::Render)
    $result = Invoke-PdfCompression -InputPath $script:selectedPath -Level (Get-SelectedLevel)
    $script:outputPath = $result.OutputPath
    $sizeSummary = Get-SizeSummary -InputBytes $result.InputBytes -OutputBytes $result.OutputBytes
    Set-Status ('完成：' + (Split-Path -Leaf $result.OutputPath) + '，' + (Format-FileSize $result.InputBytes) + ' -> ' + (Format-FileSize $result.OutputBytes) + '，' + $sizeSummary + '。')
    $openFolderButton.IsEnabled = $true
  } catch {
    Set-Status $_.Exception.Message
  } finally {
    $window.Cursor = $null
    $compressButton.IsEnabled = $true
  }
})

$openFolderButton.Add_Click({
  if ($script:outputPath) { Start-Process explorer.exe -ArgumentList ('/select,"' + $script:outputPath + '"') }
})

[void] $window.ShowDialog()
