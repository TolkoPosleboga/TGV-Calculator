# test_ifc.py
import ifcopenshell
import ifcopenshell.util.element
import os

# Путь к нашему тестовому файлу
FILE_PATH = "test_models/duplex.ifc"

if not os.path.exists(FILE_PATH):
    print(f"ОШИБКА: Файл не найден по пути {FILE_PATH}")
    print("Убедись, что ты положил файл duplex.ifc в папку test_models")
    exit()

print(f"Загружаем модель: {FILE_PATH} ...")
model = ifcopenshell.open(FILE_PATH)
print("Модель успешно загружена!\n")

# 1. Ищем все помещения (Пространства/Комнаты)
spaces = model.by_type("IfcSpace")
print(f"=== НАЙДЕНО ПОМЕЩЕНИЙ: {len(spaces)} ===")

for i, space in enumerate(spaces):
    print(f"\n--- Помещение #{i + 1} ---")
    print(f"Имя (Name): {space.Name}")
    print(f"Описание (Description): {space.Description}")
    print(f"GlobalId: {space.GlobalId}")

    # Пытаемся достать свойства (Property Sets)
    psets = ifcopenshell.util.element.get_psets(space)

    # В IFC свойства могут лежать в разных группах. Нам нужны площади и объемы.
    # Обычно это Pset_SpaceCommon или BaseQuantities
    print("Свойства (если есть):")
    for pset_name, props in psets.items():
        print(f"  Группа свойств: {pset_name}")
        for prop_name, prop_val in props.items():
            # Выводим только то, что касается площади, объема или высоты
            if any(keyword in prop_name.lower() for keyword in ['area', 'volume', 'height', 'площад', 'объем']):
                print(f"    {prop_name}: {prop_val}")

# 2. Ищем стены
walls = model.by_type("IfcWall")
print(f"\n=== НАЙДЕНО СТЕН: {len(walls)} ===")
if len(walls) > 0:
    print(f"Пример имени стены: {walls[0].Name}")

# 3. Ищем окна
windows = model.by_type("IfcWindow")
print(f"\n=== НАЙДЕНО ОКОН: {len(windows)} ===")
if len(windows) > 0:
    print(f"Пример имени окна: {windows[0].Name}")

print("\nРазведка завершена!")