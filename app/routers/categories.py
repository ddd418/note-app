# app/routers/categories.py

from fastapi import APIRouter, HTTPException, Body, Path
from typing import List
from app.models import Category
from app.utils.data import DataManager

router = APIRouter(
    prefix="/api/categories",
    tags=["categories"],
)

@router.get("", response_model=List[Category])
async def list_categories():
    """
    전체 대분류 조회
    GET /api/categories
    """
    data = DataManager.load_data()
    return data.get("categories", [])

@router.post("", response_model=Category, status_code=201)
async def create_category(cat: Category = Body(...)):
    """
    새 대분류 생성
    POST /api/categories
    """
    data = DataManager.load_data()
    data.setdefault("categories", []).append(cat.dict())
    DataManager.save_data(data)
    return cat

@router.patch("/{category_id}", response_model=Category)
async def update_category(
    category_id: int = Path(..., description="수정할 대분류의 ID"),
    cat: Category = Body(...)
):
    """
    대분류 이름 수정
    PATCH /api/categories/{category_id}
    """
    data = DataManager.load_data()
    for i, c in enumerate(data.get("categories", [])):
        if c["id"] == category_id:
            data["categories"][i] = cat.dict()
            DataManager.save_data(data)
            return cat
    raise HTTPException(404, "Category not found")

@router.delete("/{category_id}", status_code=204)
async def delete_category(
    category_id: int = Path(..., description="삭제할 대분류의 ID")
):
    """
    대분류 삭제
    DELETE /api/categories/{category_id}
    """
    data = DataManager.load_data()
    data["categories"] = [c for c in data.get("categories", []) if c["id"] != category_id]
    DataManager.save_data(data)

@router.patch("/order", status_code=204)
async def reorder_categories(
    order: List[int] = Body(..., description="새 대분류 ID 순서 목록")
):
    """
    대분류 순서 재정렬
    PATCH /api/categories/order
    """
    data = DataManager.load_data()
    id_map = {c["id"]: c for c in data.get("categories", [])}
    data["categories"] = [id_map[i] for i in order if i in id_map]
    DataManager.save_data(data)
