import io
import openpyxl
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List

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


@router.post("/excel", response_model=List[ImportedRoom])
async def import_excel(file: UploadFile = File(...)):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Пожалуйста, загрузите файл Excel (.xlsx)")

    try:
        contents = await file.read()
        wb = openpyxl.load_workbook(io.BytesIO(contents), data_only=True)
        ws = wb.active

        # 1. Расширенный словарь ключевых слов (включая единицы измерения и сокращения)
        keywords = {
            "name": ["наименование", "название", "помещение", "комната", "зал", "№", "имя", "объект"],
            "length": ["длина", "длины", "д", "l", "a"],  # a - иногда ширина/длина в чертежах
            "width": ["ширина", "ширины", "ш", "w", "b"],
            "area": ["площадь", "площади", "кв.м", "м2", "м²", "s", "пл."],
            "height": ["высота", "высоты", "в", "h", "выс."],
            "people": ["люди", "людей", "чел", "чел.", "количество людей", "n", "кол-во", "персонал", "посетители"],
            "heat": ["тепло", "теплоизбытки", "квт", "кВт", "q", "тп", "вт", "теплопоступления"],
            "moisture": ["влага", "влаговыделения", "г/ч", "w", "влага, г/ч"],
            "hazard": ["вредности", "вредные", "пдк", "г/ч", "г/ч (вредности)"]
        }

        header_row_idx = -1
        col_map = {}

        # Сканируем первые 15 строк на предмет заголовков
        for r in range(1, min(16, ws.max_row + 1)):
            for c in range(1, ws.max_column + 1):
                cell_val = str(ws.cell(row=r, column=c).value).lower().strip() if ws.cell(row=r, column=c).value else ""
                if not cell_val:
                    continue

                for key, words in keywords.items():
                    if key not in col_map:
                        # Проверяем, есть ли хоть одно ключевое слово в ячейке
                        if any(w == cell_val or w in cell_val.split() or w in cell_val for w in words):
                            # Защита от ложных срабатываний (например, "высота" содержит "в", но мы ищем "высота")
                            # Просто берем первое совпадение
                            col_map[key] = c
                            if header_row_idx == -1:
                                header_row_idx = r

        # Проверка, что мы нашли хоть какие-то габариты
        if header_row_idx == -1 or ("area" not in col_map and "length" not in col_map):
            raise HTTPException(
                status_code=400,
                detail="Не удалось распознать габариты. Убедитесь, что в шапке есть слова 'Площадь', 'Длина', 'Ширина' или их обозначения (S, м2, Д, Ш)."
            )

        # 2. Читаем данные
        rooms = []
        import math

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

                # Парсим числа

            def parse_float(val, default=0.0):
                if not val: return default
                try:
                    # Убираем всё кроме цифр, точки и запятой
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

            # Логика габаритов
            if area > 0 and (length == 0 or width == 0):
                # Если есть только площадь, делаем квадрат
                length = round(math.sqrt(area), 2)
                width = length
            elif length == 0 and width == 0:
                # Если вообще ничего нет — дефолт
                length = 6.0
                width = 4.0

            people = int(parse_float(row_data.get("people", 0)))
            heat = parse_float(row_data.get("heat", 0))
            moisture = parse_float(row_data.get("moisture", 0))
            hazard = parse_float(row_data.get("hazard", 0))

            rooms.append({
                "name": name,
                "length": length,
                "width": width,
                "height": height,
                "people": people,
                "heat_gain_kw": heat,
                "moisture_gain_g_h": moisture,
                "hazard_g_h": hazard,
                "mpc_mg_m3": 20.0
            })

        if not rooms:
            raise HTTPException(status_code=400, detail="В файле не найдено данных о помещениях.")

        return rooms

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при чтении файла: {str(e)}")