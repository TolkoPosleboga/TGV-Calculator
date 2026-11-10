# routers/export_api.py
import io
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any
from xml.sax.saxutils import escape  # Для безопасной вставки текста в PDF

# Импорты для Excel
from openpyxl import Workbook
from openpyxl.styles import Font
from openpyxl.cell.cell import ILLEGAL_CHARACTERS_RE  # Очистка запрещенных символов

# Импорты для PDF
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

router = APIRouter(prefix="/api/export", tags=["Экспорт"])


class ExportRequest(BaseModel):
    category: str
    request_data: Dict[str, Any]
    response_data: Dict[str, Any]


# --- УМНЫЙ ПОИСК ШРИФТА ДЛЯ PDF ---
FONT_NAME = "Helvetica"  # Базовый шрифт (без кириллицы)
FONT_PATHS = [
    "C:\\Windows\\Fonts\\arial.ttf",
    "C:\\Windows\\Fonts\\segoeui.ttf",
    "C:\\Windows\\Fonts\\calibri.ttf"
]
for path in FONT_PATHS:
    if os.path.exists(path):
        try:
            pdfmetrics.registerFont(TTFont("CustomFont", path))
            FONT_NAME = "CustomFont"
            break
        except:
            pass


# Функция защиты для PDF
def safe_pdf_text(text):
    return escape(str(text))


# Функция защиты для Excel
def safe_excel_text(text):
    return ILLEGAL_CHARACTERS_RE.sub("", str(text))


@router.post("/excel")
async def export_excel(data: ExportRequest):
    try:
        wb = Workbook()
        ws = wb.active
        ws.title = "Расчёт"

        bold_font = Font(bold=True, size=12)
        title_font = Font(bold=True, size=14, color="1F4E78")

        ws.append([f"Отчёт по разделу: {safe_excel_text(data.category)}"])
        ws['A1'].font = title_font
        ws.append([])

        ws.append(["ВХОДНЫЕ ДАННЫЕ"])
        ws[f'A3'].font = bold_font
        for key, value in data.request_data.items():
            ws.append([safe_excel_text(key), safe_excel_text(value)])

        ws.append([])

        ws.append(["РЕЗУЛЬТАТЫ РАСЧЁТА"])
        ws[f'A{ws.max_row}'].font = bold_font
        for key, value in data.response_data.items():
            ws.append([safe_excel_text(key), safe_excel_text(value)])

        # Автоширина колонок
        for col in ws.columns:
            max_length = 0
            column = col[0].column_letter
            for cell in col:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(cell.value)
                except:
                    pass
            ws.column_dimensions[column].width = max_length + 2

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        return StreamingResponse(
            output,
            headers={'Content-Disposition': 'attachment; filename="report.xlsx"'},
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка Excel: {str(e)}")


@router.post("/pdf")
async def export_pdf(data: ExportRequest):
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
        elements = []

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(name='TitleStyle', parent=styles['Heading1'], fontName=FONT_NAME, fontSize=18,
                                     spaceAfter=20)
        section_style = ParagraphStyle(name='SectionStyle', parent=styles['Heading2'], fontName=FONT_NAME, fontSize=14,
                                       spaceBefore=15, spaceAfter=10)

        elements.append(Paragraph(safe_pdf_text(f"Инженерный расчёт: {data.category}"), title_style))
        elements.append(Spacer(1, 10))

        elements.append(Paragraph("Входные параметры:", section_style))
        table_data = [["Параметр", "Значение"]]
        for k, v in data.request_data.items():
            table_data.append([safe_pdf_text(k), safe_pdf_text(v)])

        t1 = Table(table_data, colWidths=[200, 250])
        t1.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#2563eb")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, -1), FONT_NAME),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        elements.append(t1)
        elements.append(Spacer(1, 20))

        elements.append(Paragraph("Результаты расчёта:", section_style))
        res_data = [["Показатель", "Значение"]]
        for k, v in data.response_data.items():
            res_data.append([safe_pdf_text(k), safe_pdf_text(v)])

        t2 = Table(res_data, colWidths=[200, 250])
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#059669")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, -1), FONT_NAME),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        elements.append(t2)

        doc.build(elements)
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            headers={'Content-Disposition': 'attachment; filename="report.pdf"'},
            media_type="application/pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка PDF: {str(e)}")