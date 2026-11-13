import os


def show_tree(path, prefix=""):
    items = sorted(os.listdir(path))
    items = [i for i in items if i not in ['venv', '__pycache__', '.git', '.idea', 'node_modules']]

    for i, item in enumerate(items):
        is_last = i == len(items) - 1
        connector = "└── " if is_last else "├── "
        print(prefix + connector + item)

        item_path = os.path.join(path, item)
        if os.path.isdir(item_path):
            extension = "    " if is_last else "│   "
            show_tree(item_path, prefix + extension)


show_tree(".")