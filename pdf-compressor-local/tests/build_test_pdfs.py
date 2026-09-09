from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from PIL import Image, ImageDraw


output = Path(__file__).resolve().parent / "fixtures"
output.mkdir(exist_ok=True)

text_pdf = output / "text-document.pdf"
page = canvas.Canvas(str(text_pdf), pagesize=A4)
page.setTitle("Text document test")
page.setFont("Helvetica-Bold", 18)
page.drawString(20 * mm, 275 * mm, "Course handout - text PDF")
page.setFont("Helvetica", 11)
for index in range(1, 95):
    y = 265 * mm - (index % 42) * 6 * mm
    if index % 42 == 0:
        page.showPage()
        page.setFont("Helvetica", 11)
    page.drawString(20 * mm, y, f"Line {index}: tables and text should remain readable after compression.")
page.save()

image_path = output / "scanned-page.png"
image = Image.new("RGB", (1800, 2400), "white")
draw = ImageDraw.Draw(image)
for y in range(80, 2300, 70):
    draw.line((100, y, 1700, y), fill=(90, 90, 90), width=3)
for x in range(100, 1700, 160):
    draw.rectangle((x, 150, x + 100, 550), outline=(20, 90, 120), width=8)
image.save(image_path, quality=96)

image_pdf = output / "scanned-document.pdf"
page = canvas.Canvas(str(image_pdf), pagesize=A4)
page.setTitle("Scanned document test")
page.drawImage(str(image_path), 10 * mm, 10 * mm, width=190 * mm, height=277 * mm)
page.save()
