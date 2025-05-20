import os
import json
import shutil
from typing import Any, Dict

class DataManager:
    DATA_FILE   = "data.json"
    BACKUP_DIR  = "backup"
    BACKUP_FILE = os.path.join(BACKUP_DIR, "data_backup.json")
    UPLOAD_DIR = "uploads"

    @classmethod
    def create_upload_dir(cls):
        os.makedirs(cls.UPLOAD_DIR, exist_ok=True)

    @classmethod
    def create_backup_dir(cls):
        os.makedirs(cls.BACKUP_DIR, exist_ok=True)

    @classmethod
    def backup_data_file(cls):
        cls.create_backup_dir()
        if os.path.exists(cls.DATA_FILE):
            # 기존 data.json 을 백업으로 복사
            shutil.copy2(cls.DATA_FILE, cls.BACKUP_FILE)

    @classmethod
    def load_data(cls) -> Dict[str, Any]:
        if not os.path.exists(cls.DATA_FILE):
            return {"categories": [], "templates": [], "relationships": []}
        try:
            with open(cls.DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            data.setdefault("categories", [])
            data.setdefault("templates", [])
            data.setdefault("relationships", [])
            return data
        except (json.JSONDecodeError, ValueError):
            init = {"categories": [], "templates": [], "relationships": []}
            cls.save_data(init)
            return init

    @classmethod
    def save_data(cls, data: Dict[str, Any]) -> None:
        #덮어쓰기 전에 백업
        cls.backup_data_file()
        with open(cls.DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)