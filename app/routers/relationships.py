from fastapi import APIRouter, HTTPException, Body
from typing import List

from app.models import Relationship
from app.utils.data import DataManager

router = APIRouter()

@router.get("/relationships", response_model=List[Relationship])
async def get_relationships():
    return DataManager.load_data()["relationships"]

@router.post("/relationship", response_model=Relationship, status_code=201)
async def add_relationship(rel: Relationship):
    data = DataManager.load_data()
    rels = data.setdefault("relationships", [])
    if not any(r["from_id"] == rel.from_id and r["to_id"] == rel.to_id for r in rels):
        rels.append(rel.dict())
        DataManager.save_data(data)
    return rel

@router.delete("/relationship", status_code=204)
async def delete_relationship(rel: Relationship = Body(...)):
    data = DataManager.load_data()
    data["relationships"] = [
        r for r in data.get("relationships", [])
        if not (r["from_id"] == rel.from_id and r["to_id"] == rel.to_id)
    ]
    DataManager.save_data(data)