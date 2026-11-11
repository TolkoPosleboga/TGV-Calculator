"""API для работы с проектами, помещениями и оборудованием."""
from fastapi import APIRouter, HTTPException, status
from core.projects_logic import build_specification
from core.projects_models import Project, ProjectCreate, ProjectUpdate, Room, RoomCreate, EquipmentItem, EquipmentItemCreate
from db.repositories import projects_repo, rooms_repo, equipment_repo

router = APIRouter(prefix="/api/projects", tags=["Проекты"])

@router.post("/", response_model=Project, status_code=status.HTTP_201_CREATED)
def create_project(data: ProjectCreate):
    """Создать новый проект."""
    return projects_repo.create(data.model_dump())

@router.get("/", response_model=list[Project])
def list_projects():
    """Получить список всех проектов."""
    return projects_repo.list()

@router.get("/{project_id}", response_model=Project)
def get_project(project_id: int):
    """Получить проект по ID со всеми помещениями и оборудованием."""
    project = projects_repo.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return project

@router.put("/{project_id}", response_model=Project)
def update_project(project_id: int, data: ProjectUpdate):
    """Обновить данные проекта."""
    project = projects_repo.update(project_id, data.model_dump(exclude_unset=True))
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int):
    """Удалить проект (каскадно удалятся все помещения и оборудование)."""
    if not projects_repo.delete(project_id):
        raise HTTPException(status_code=404, detail="Проект не найден")

@router.post("/{project_id}/rooms", response_model=Room, status_code=status.HTTP_201_CREATED)
def add_room(project_id: int, data: RoomCreate):
    """Добавить помещение в проект."""
    if not projects_repo.get(project_id, with_rooms=False):
        raise HTTPException(status_code=404, detail="Проект не найден")
    return rooms_repo.create(project_id, data.model_dump())

@router.post("/rooms/{room_id}/equipment", response_model=EquipmentItem, status_code=status.HTTP_201_CREATED)
def add_equipment(room_id: int, data: EquipmentItemCreate):
    """Добавить оборудование в помещение."""
    # (В будущем здесь можно добавить проверку существования room_id)
    return equipment_repo.create(room_id, data.model_dump())

@router.get("/{project_id}/specification")
def get_specification(project_id: int):
    """Получить сводную спецификацию оборудования по проекту."""
    project = projects_repo.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return build_specification(project)