Add-Type -AssemblyName System.Drawing

function Generate-PwaIcon {
    param (
        [string]$OutputPath,
        [int]$Size,
        [bool]$Maskable = $false
    )

    $bmp = [System.Drawing.Bitmap]::new($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # 背景
    $rect = [System.Drawing.Rectangle]::new(0, 0, $Size, $Size)
    $colorTop = [System.Drawing.ColorTranslator]::FromHtml("#be123c")
    $colorBottom = [System.Drawing.ColorTranslator]::FromHtml("#881337")
    $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new($rect, $colorTop, $colorBottom, 45.0)

    if ($Maskable) {
        $g.FillRectangle($brush, $rect)
    } else {
        $gPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
        $radius = [float]($Size * 0.22)
        $diameter = $radius * 2
        $gPath.AddArc(0, 0, $diameter, $diameter, 180, 90)
        $gPath.AddArc([float]($Size - $diameter), 0, $diameter, $diameter, 270, 90)
        $gPath.AddArc([float]($Size - $diameter), [float]($Size - $diameter), $diameter, $diameter, 0, 90)
        $gPath.AddArc(0, [float]($Size - $diameter), $diameter, $diameter, 90, 90)
        $gPath.CloseFigure()
        $g.FillPath($brush, $gPath)
        $gPath.Dispose()
    }
    $brush.Dispose()

    # アイコン描画（中央にグラスと音符のモチーフ）
    $scaleFactor = if ($Maskable) { ($Size / 512.0) * 0.78 } else { ($Size / 512.0) * 0.92 }
    $offsetX = ($Size - (512.0 * $scaleFactor)) / 2.0
    $offsetY = ($Size - (512.0 * $scaleFactor)) / 2.0

    $g.TranslateTransform($offsetX, $offsetY)
    $g.ScaleTransform($scaleFactor, $scaleFactor)

    # ブラシ定義
    $whiteBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(250, 255, 255, 255))
    $pinkBrush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#FDA4AF"))
    $goldBrush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#dfb678"))

    # グラスのアウトライン (V字)
    [System.Drawing.PointF[]]$glassPoints = @(
        [System.Drawing.PointF]::new(150, 170),
        [System.Drawing.PointF]::new(340, 170),
        [System.Drawing.PointF]::new(255, 285),
        [System.Drawing.PointF]::new(255, 375),
        [System.Drawing.PointF]::new(305, 375),
        [System.Drawing.PointF]::new(305, 400),
        [System.Drawing.PointF]::new(185, 400),
        [System.Drawing.PointF]::new(185, 375),
        [System.Drawing.PointF]::new(235, 375),
        [System.Drawing.PointF]::new(235, 285)
    )
    $g.FillPolygon($whiteBrush, $glassPoints)

    # ドリンクの中身
    [System.Drawing.PointF[]]$drinkPoints = @(
        [System.Drawing.PointF]::new(175, 205),
        [System.Drawing.PointF]::new(315, 205),
        [System.Drawing.PointF]::new(245, 272)
    )
    $g.FillPolygon($pinkBrush, $drinkPoints)

    # ストロー
    [System.Drawing.PointF[]]$strawPoints = @(
        [System.Drawing.PointF]::new(230, 250),
        [System.Drawing.PointF]::new(305, 115),
        [System.Drawing.PointF]::new(330, 115),
        [System.Drawing.PointF]::new(245, 260)
    )
    $g.FillPolygon($goldBrush, $strawPoints)

    # レモンスライス
    $g.FillPie($goldBrush, 140, 135, 60, 60, 220, 100)

    # 音符
    $notePath = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $notePath.AddEllipse(335, 195, 34, 26)
    $notePath.AddEllipse(385, 180, 34, 26)
    $g.FillPath($whiteBrush, $notePath)
    $notePath.Dispose()

    $stemPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(250, 255, 255, 255), 9)
    $stemPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $stemPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($stemPen, 365, 205, 365, 125)
    $g.DrawLine($stemPen, 415, 190, 415, 110)
    # 梁
    $beamPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(250, 255, 255, 255), 14)
    $g.DrawLine($beamPen, 362, 125, 418, 110)
    $stemPen.Dispose()
    $beamPen.Dispose()

    $whiteBrush.Dispose()
    $pinkBrush.Dispose()
    $goldBrush.Dispose()
    $g.Dispose()

    $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $OutputPath"
}

Generate-PwaIcon -OutputPath "public/icons/icon-192x192.png" -Size 192 -Maskable $false
Generate-PwaIcon -OutputPath "public/icons/icon-512x512.png" -Size 512 -Maskable $false
Generate-PwaIcon -OutputPath "public/icons/icon-maskable-192x192.png" -Size 192 -Maskable $true
Generate-PwaIcon -OutputPath "public/icons/icon-maskable-512x512.png" -Size 512 -Maskable $true
