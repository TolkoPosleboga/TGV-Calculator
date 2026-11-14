import io
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import traceback
import math

router = APIRouter(prefix="/api/import", tags=["Импорт"])


class ImportedRoom(BaseModel):
    name: str
    length: float
    width: float
    height: float
    people: int
    heat_gain_kw: float
    moisture_gain_g_h: float
    hazard_g_h: float
    mpc_mg_m3: float


@router.get("/template")
async def download_template():
    try:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Шаблон импорта"

        headers = [
            "Наименование", "Длина (м)", "Ширина (м)", "Высота (м)",
            "Площадь (м²)", "Кол-во людей", "Теплоизбытки (кВт)",
            "Влаговыделения (г/ч)", "Вредные в-ва (г/ч)", "ПДК (мг/м³)"
        ]

        header_font = Font(bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="2563EB", end_color="2563EB", fill_type="solid")
        center_align = Alignment(horizontal="center", vertical="center", wrap_text=True)

        for col_idx, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_idx, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = center_align
            ws.column_dimensions[get_column_letter(col_idx)].width = 18

        ws.row_dimensions[1].height = 30

        sample_data = ["Офис", 6.0, 4.0, 3.0, 24.0, 10, 1.5, 500, 0.5, 20]
        for col_idx, value in enumerate(sample_data, 1):
            ws.cell(row=2, column=col_idx, value=value)

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        return StreamingResponse(
            output,
            headers={'Content-Disposition': 'attachment; filename="template_rooms.xlsx"'},
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ошибка генерации шаблона: {str(e)}")


@router.post("/excel", response_model=List[ImportedRoom])
async def import_excel(file: UploadFile = File(...)):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Пожалуйста, загрузите файл Excel (.xlsx)")

    try:
        contents = await file.read()
        wb = openpyxl.load_workbook(io.BytesIO(contents), data_only=True)
        ws = wb.active

        keywords = {
            "name": ["наименование", "название", "помещение", "комната", "зал", "№", "имя", "объект"],
            "length": ["длина", "длины", "дл.", "l"],
            "width": ["ширина", "ширины", "ш.", "w"],
            "area": ["площадь", "площади", "кв.м", "м2", "м²", "s", "пл."],
            "height": ["высота", "высоты", "выс.", "h"],
            "people": ["люди", "людей", "чел", "чел.", "количество людей", "n", "кол-во", "персонал", "посетители"],
            "heat": ["тепло", "теплоизбытки", "квт", "q", "тп", "вт", "теплопоступления"],
            "moisture": ["влага", "влаговыделения", "г/ч (влага)", "влаговыделение"],
            "hazard": ["вредности", "вредные", "г/ч (вредности)", "выделение вредных"],
            "mpc": ["пдк", "мг/м³", "мг/м3"]
        }

        header_row_idx = -1
        col_map = {}

        for r in range(1, min(16, ws.max_row + 1)):
            for c in range(1, ws.max_column + 1):
                cell_val = str(ws.cell(row=r, column=c).value).lower().strip() if ws.cell(row=r, column=c).value else ""
                if not cell_val:
                    continue

                for key, words in keywords.items():
                    if key not in col_map:
                        if any(w in cell_val for w in words):
                            col_map[key] = c
                            if header_row_idx == -1:
                                header_row_idx = r

        if header_row_idx == -1 or ("area" not in col_map and "length" not in col_map):
            raise HTTPException(
                status_code=400,
                detail="Не удалось распознать габариты. Убедитесь, что в шапке есть слова 'Площадь', 'Длина', 'Ширина'."
            )

        rooms = []

        for r in range(header_row_idx + 1, ws.max_row + 1):
            row_data = {}
            is_empty = True

            for key, col_idx in col_map.items():
                val = ws.cell(row=r, column=col_idx).value
                if val is not None and str(val).strip() != "":
                    is_empty = False
                    row_data[key] = val

            if is_empty:
                continue

            def parse_float(val, default=0.0):
                if not val: return default
                try:
                    clean_val = "".join(c for c in str(val) if c.isdigit() or c in ".,-")
                    return float(clean_val.replace(",", "."))
                except:
                    return default

            name = str(row_data.get("name", f"Помещение {r}")).strip()
            if name == "None": name = f"Помещение {r}"

            area = parse_float(row_data.get("area", 0))
            length = parse_float(row_data.get("length", 0))
            width = parse_float(row_data.get("width", 0))
            height = parse_float(row_data.get("height", 3.0))

            if area > 0 and (length == 0 or width == 0):
                length = round(math.sqrt(area), 2)
                width = length
            elif length == 0 and width == 0:
                length = 6.0
                width = 4.0

            people = int(parse_float(row_data.get("people", 0)))
            heat = parse_float(row_data.get("heat", 0))
            moisture = parse_float(row_data.get("moisture", 0))
            hazard = parse_float(row_data.get("hazard", 0))
            mpc = parse_float(row_data.get("mpc", 20.0))

            rooms.append({
                "name": name,
                "length": length,
                "width": width,
                "height": height,
                "people": people,
                "heat_gain_kw": heat,
                "moisture_gain_g_h": moisture,
                "hazard_g_h": hazard,
                "mpc_mg_m3": mpc
            })

        if not rooms:
            raise HTTPException(status_code=400, detail="В файле не найдено данных о помещениях.")

        return rooms

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ошибка при чтении файла: {str(e)}")