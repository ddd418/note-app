from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi import APIRouter, HTTPException, Path, Body
from typing import List
from app.models import MidCategory
from app.utils.data import DataManager

ADMIN_IPS = {"127.0.0.1"}
router = APIRouter(
    prefix="/api/categories/{category_id}/midcategories",
    tags=["midcategories"],
)

async def restrict_write_permissions(request: Request, call_next):
    client_ip = request.client.host
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        if client_ip not in ADMIN_IPS:
            return JSONResponse(status_code=403, content={"detail": "읽기 전용 사용자입니다."})
    return await call_next(request)

@router.get("", response_model=List[MidCategory])
async def list_midcategories(
    category_id: int = Path(...)
):
    data = DataManager.load_data()
    for c in data["categories"]:
        if c["id"] == category_id:
            return c.get("midcategories", [])
    raise HTTPException(404, "Category not found")

@router.post("", response_model=MidCategory, status_code=201)
async def create_midcategory(
    category_id: int = Path(...),
    mid: MidCategory = Body(...)
):
    data = DataManager.load_data()
    for c in data["categories"]:
        if c["id"] == category_id:
            c.setdefault("midcategories", []).append(mid.dict())
            DataManager.save_data(data)
            return mid
    raise HTTPException(404, "Category not found")

@router.patch("/{mid_id}", response_model=MidCategory)
async def update_midcategory(
    category_id: int = Path(...),
    mid_id: int = Path(...),
    mid: MidCategory = Body(...)
):
    data = DataManager.load_data()
    for c in data["categories"]:
        if c["id"] == category_id:
            for i, m in enumerate(c.get("midcategories", [])):
                if m["id"] == mid_id:
                    c["midcategories"][i] = mid.dict()
                    DataManager.save_data(data)
                    return mid
    raise HTTPException(404, "MidCategory not found")

@router.delete("/{mid_id}", status_code=204)
async def delete_midcategory(
    category_id: int = Path(...),
    mid_id: int = Path(...)
):
    data = DataManager.load_data()
    for c in data["categories"]:
        if c["id"] == category_id:
            c["midcategories"] = [
                m for m in c.get("midcategories", []) if m["id"] != mid_id
            ]
            DataManager.save_data(data)
            return
    raise HTTPException(404, "MidCategory not found")

@router.patch("/order", status_code=204)
async def reorder_midcategories(
    category_id: int = Path(...),
    order: List[int] = Body(...)
):
    data = DataManager.load_data()
    for c in data["categories"]:
        if c["id"] == category_id:
            id_map = {m["id"]: m for m in c.get("midcategories", [])}
            c["midcategories"] = [id_map[i] for i in order if i in id_map]
            DataManager.save_data(data)
            return
    raise HTTPException(404, "Category not found")