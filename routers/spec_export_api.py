import io
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from openpyxl.utils import get_column_letter

# Импорты для PDF
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os
from xml.sax.saxutils import escape

router = APIRouter(prefix="/api/spec_export", tags=["Экспорт спецификации"])

# Поиск шрифта для PDF
FONT_NAME = "Helvetica"
FONT_PATHS = ["C:\\Windows\\Fonts\\arial.ttf", "C:\\Windows\\Fonts\\segoeui.ttf"]
for path in FONT_PATHS:
    if os.path.exists(path):
        try:
            pdfmetrics.registerFont(TTFont("CustomFont", path))
            FONT_NAME = "CustomFont"
            break
        except:
            pass


class BOMItem(BaseModel):
    name: str
    qty: int
    price: int


class BOMExportRequest(BaseModel):
    project_name: str = "Без названия"
    items: List[BOMItem]


@router.post("/excel")
async def export_bom_excel(data: BOMExportRequest):
    try:
        wb = Workbook()
        ws = wb.active
        ws.title = "Спецификация"

        ws.append([f"Спецификация оборудования: {data.project_name}"])
        ws['A1'].font = Font(bold=True, size=14, color="1F4E78")
        ws.append([])  # Пустая строка

        headers = ["Наименование оборудования", "Кол-во", "Цена (руб)", "Сумма (руб)"]
        ws.append(headers)

        # Стилизация шапки
        for col in range(1, 5):
            cell = ws.cell(row=3, column=col)
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = PatternFill(start_color="2563EB", end_color="2563EB", fill_type="solid")
            cell.alignment = Alignment(horizontal="center")

        total_sum = 0
        for item in data.items:
            item_total = item.price * item.qty
            total_sum += item_total
            ws.append([item.name, item.qty, item.price, item_total])

        # Итоговая строка
        ws.append(["", "", "ИТОГО:", total_sum])
        ws.cell(row=ws.max_row, column=3).font = Font(bold=True)
        ws.cell(row=ws.max_row, column=4).font = Font(bold=True)

        # Автоширина
        ws.column_dimensions['A'].width = 60
        ws.column_dimensions['B'].width = 10
        ws.column_dimensions['C'].width = 15
        ws.column_dimensions['D'].width = 15

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        return StreamingResponse(
            output,
            headers={'Content-Disposition': 'attachment; filename="specification.xlsx"'},
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pdf")
async def export_bom_pdf(data: BOMExportRequest):
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
        elements = []

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(name='TitleStyle', parent=styles['Heading1'], fontName=FONT_NAME, fontSize=16,
                                     spaceAfter=20)
        normal_style = ParagraphStyle(name='NormalStyle', parent=styles['Normal'], fontName=FONT_NAME, fontSize=10)

        elements.append(Paragraph(escape(f"Спецификация: {data.project_name}"), title_style))
        elements.append(Spacer(1, 10))

        table_data = [["Наименование", "Кол-во", "Цена", "Сумма"]]
        total_sum = 0

        for item in data.items:
            item_total = item.price * item.qty
            total_sum += item_total
            table_data.append([
                Paragraph(escape(item.name), normal_style),
                str(item.qty),
                f"{item.price:,.0f}",
                f"{item_total:,.0f}"
            ])

        table_data.append(["", "", "ИТОГО:", f"{total_sum:,.0f}"])

        t = Table(table_data, colWidths=[300, 50, 80, 80])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#2563eb")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, -1), FONT_NAME),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#eff6ff")),
            ('FONTNAME', (0, -1), (-1, -1), FONT_NAME),
        ]))
        elements.append(t)

        doc.build(elements)
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            headers={'Content-Disposition': 'attachment; filename="specification.pdf"'},
            media_type="application/pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))