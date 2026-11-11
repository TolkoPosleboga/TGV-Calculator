import os
import shutil
import ifcopenshell
import ifcopenshell.util.element
from fastapi import APIRouter, UploadFile, File, HTTPException
from db.repositories import projects_repo, rooms_repo

router = APIRouter(prefix="/api/ifc", tags=["BIM Анализ"])


@router.post("/upload")
async def upload_ifc(file: UploadFile = File(...)):
    if not file.filename.endswith(".ifc"):
        raise HTTPException(status_code=400, detail="Пожалуйста, загрузите файл с расширением .ifc")

    # Временное сохранение файла
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Парсинг IFC через ifcopenshell
        ifc_file = ifcopenshell.open(temp_path)
        spaces = ifc_file.by_type("IfcSpace")

        if not spaces:
            raise HTTPException(status_code=400, detail="В файле не найдено помещений (IfcSpace)")

        # Создаем новый проект в базе
        project_data = {
            "name": f"Импорт: {file.filename}",
            "address": "Загружено из BIM-модели",
            "customer": "BIM-проект"
        }
        project = projects_repo.create(project_data)

        rooms_created = []
        for space in spaces:
            # Получаем имя помещения
            room_name = space.Name or "Без названия"

            # Пытаемся вытащить площадь из свойств (Pset_SpaceCommon)
            area = 0.0
            height = 3.0

            psets = ifcopenshell.util.element.get_psets(space)
            if "Pset_SpaceCommon" in psets:
                if "GrossPlannedArea" in psets["Pset_SpaceCommon"]:
                    area = float(psets["Pset_SpaceCommon"]["GrossPlannedArea"])
                elif "NetPlannedArea" in psets["Pset_SpaceCommon"]:
                    area = float(psets["Pset_SpaceCommon"]["NetPlannedArea"])

            # Если площади нет в свойствах, пробуем вычислить через геометрию (упрощенно, может быть 0)
            if area == 0.0:
                area = 10.0  # Заглушка, если в модели не задана площадь

            room_data = {
                "name": room_name,
                "room_type": "other",
                "area": area,
                "height": height,
                "parameters": {"source": "IFC"}
            }
            rooms_repo.create(project.id, room_data)
            rooms_created.append(room_name)

        os.remove(temp_path)  # Удаляем временный файл

        return {
            "status": "success",
            "project_id": project.id,
            "project_name": project.name,
            "rooms": rooms_created
        }

    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Ошибка обработки IFC: {str(e)}")