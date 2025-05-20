from fastapi import APIRouter, HTTPException, Path, Body
from typing import List

from app.models import Template
from app.utils.data import DataManager

router = APIRouter()

@router.get("/templates", response_model=List[Template])
async def list_templates():
    return DataManager.load_data()["templates"]

@router.post("/template", response_model=Template, status_code=201)
async def create_template(tpl: Template):
    data = DataManager.load_data()
    lst = data.setdefault("templates", [])
    lst.append(tpl.dict())
    DataManager.save_data(data)
    return tpl

@router.patch("/template/{tpl_id}", response_model=Template)
async def update_template(
    tpl_id: int = Path(...),
    updated: Template = Body(...)
):
    data = DataManager.load_data()
    for i, t in enumerate(data.get("templates", [])):
        if t["id"] == tpl_id:
            data["templates"][i] = updated.dict()
            DataManager.save_data(data)
            return updated
    raise HTTPException(404, "Template not found")

@router.delete("/template/{tpl_id}", status_code=204)
async def delete_template(tpl_id: int = Path(...)):
    data = DataManager.load_data()
    data["templates"] = [t for t in data.get("templates", []) if t["id"] != tpl_id]
    DataManager.save_data(data)