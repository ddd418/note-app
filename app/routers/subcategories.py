# app/routers/subcategories.py

from fastapi import APIRouter, HTTPException, Path, Body, UploadFile, File
from typing import List
from app.models import SubCategory, Attachment
from app.utils.data import DataManager
import os
from uuid import uuid4

router = APIRouter(
    prefix="/api/categories/{category_id}/midcategories/{mid_id}/subcategories",
    tags=["subcategories"],
)

@router.get("", response_model=List[SubCategory])
async def list_subcategories(
    category_id: int = Path(..., description="대분류 ID"),
    mid_id:      int = Path(..., description="중분류 ID"),
):
    data = DataManager.load_data()
    for c in data.get("categories", []):
        if c["id"] == category_id:
            for m in c.get("midcategories", []):
                if m["id"] == mid_id:
                    return m.get("subcategories", [])
    raise HTTPException(404, "MidCategory not found")

@router.get("/{sub_id}", response_model=SubCategory)
async def get_subcategory(
    category_id: int = Path(..., description="대분류 ID"),
    mid_id:      int = Path(..., description="중분류 ID"),
    sub_id:      int = Path(..., description="소분류 ID"),
):
    data = DataManager.load_data()
    for c in data.get("categories", []):
        if c["id"] == category_id:
            for m in c.get("midcategories", []):
                if m["id"] == mid_id:
                    for s in m.get("subcategories", []):
                        if s["id"] == sub_id:
                            return s
    raise HTTPException(404, "SubCategory not found")

@router.post("", response_model=SubCategory, status_code=201)
async def create_subcategory(
    category_id: int = Path(..., description="대분류 ID"),
    mid_id:      int = Path(..., description="중분류 ID"),
    sub:         SubCategory   = Body(..., description="생성할 소분류 전체 객체")
):
    data = DataManager.load_data()
    for c in data.get("categories", []):
        if c["id"] == category_id:
            for m in c.setdefault("midcategories", []):
                if m["id"] == mid_id:
                    m.setdefault("subcategories", []).append(sub.dict())
                    DataManager.save_data(data)
                    return sub
    raise HTTPException(404, "MidCategory not found")

# PATCH와 PUT 둘 다 처리하도록 데코레이터를 중첩
@router.patch("/{sub_id}", response_model=SubCategory)
@router.put  ("/{sub_id}", response_model=SubCategory)
async def update_subcategory(
    category_id: int = Path(..., description="대분류 ID"),
    mid_id:      int = Path(..., description="중분류 ID"),
    sub_id:      int = Path(..., description="소분류 ID"),
    sub:         SubCategory   = Body(..., description="수정할 소분류 전체 객체")
):
    """
    기존 sub 객체를 통째로 sub.dict() 로 덮어써서
    template_id 포함 모든 필드를 저장합니다.
    """
    data = DataManager.load_data()
    for c in data.get("categories", []):
        if c["id"] == category_id:
            for m in c.get("midcategories", []):
                if m["id"] == mid_id:
                    subs = m.setdefault("subcategories", [])
                    for i, s in enumerate(subs):
                        if s["id"] == sub_id:
                            subs[i] = sub.dict()
                            DataManager.save_data(data)
                            return sub
    raise HTTPException(404, "SubCategory not found")

@router.delete("/{sub_id}", status_code=204)
async def delete_subcategory(
    category_id: int = Path(..., description="대분류 ID"),
    mid_id:      int = Path(..., description="중분류 ID"),
    sub_id:      int = Path(..., description="소분류 ID"),
):
    data = DataManager.load_data()
    for c in data.get("categories", []):
        if c["id"] == category_id:
            for m in c.get("midcategories", []):
                if m["id"] == mid_id:
                    m["subcategories"] = [
                        s for s in m.get("subcategories", []) if s["id"] != sub_id
                    ]
                    DataManager.save_data(data)
                    return
    raise HTTPException(404, "SubCategory not found")

@router.patch("/order", status_code=204)
async def reorder_subcategories(
    category_id: int  = Path(..., description="대분류 ID"),
    mid_id:      int  = Path(..., description="중분류 ID"),
    order:       List[int] = Body(..., description="새 소분류 ID 순서 배열")
):
    data = DataManager.load_data()
    for c in data.get("categories", []):
        if c["id"] == category_id:
            for m in c.get("midcategories", []):
                if m["id"] == mid_id:
                    id_map = { s["id"]: s for s in m.get("subcategories", []) }
                    m["subcategories"] = [ id_map[i] for i in order if i in id_map ]
                    DataManager.save_data(data)
                    return
    raise HTTPException(404, "MidCategory not found")

@router.post(
    "/{sub_id}/attachment",
    response_model=Attachment,
    status_code=201,
)
async def upload_attachment(
    category_id: int = Path(...),
    mid_id:      int = Path(...),
    sub_id:      int = Path(...),
    file:        UploadFile = File(...)
):
    """
    소분류에 파일 업로드하고 attachments 배열에 추가
    """
    data = DataManager.load_data()
    for c in data.get("categories", []):
        if c["id"] == category_id:
            for m in c.get("midcategories", []):
                if m["id"] == mid_id:
                    for s in m.get("subcategories", []):
                        if s["id"] == sub_id:
                            # 1) uploads 디렉토리 준비
                            upload_dir = os.path.join(os.getcwd(), "uploads")
                            os.makedirs(upload_dir, exist_ok=True)
                            # 2) 고유 파일명 생성
                            ext = os.path.splitext(file.filename)[1]
                            fname = f"{uuid4().hex}{ext}"
                            path = os.path.join(upload_dir, fname)
                            # 3) 실제 저장
                            with open(path, "wb") as f:
                                f.write(await file.read())
                            # 4) URL 생성 (/uploads/<fname> 으로 static 서빙)
                            url = f"/uploads/{fname}"
                            att = {"filename": file.filename, "url": url}
                            s.setdefault("attachments", []).append(att)
                            DataManager.save_data(data)
                            return att
    raise HTTPException(404, "SubCategory not found")

@router.delete(
    "/{sub_id}/attachment",
    status_code=204,
)
async def delete_attachment(
    category_id: int = Path(...),
    mid_id:      int = Path(...),
    sub_id:      int = Path(...),
    att:         Attachment = Body(...)
):
    """
    소분류에서 특정 attachment 삭제
    """
    data = DataManager.load_data()
    for c in data.get("categories", []):
        if c["id"] == category_id:
            for m in c.get("midcategories", []):
                if m["id"] == mid_id:
                    for s in m.get("subcategories", []):
                        if s["id"] == sub_id:
                            s["attachments"] = [
                                a for a in s.get("attachments", [])
                                if a["url"] != att.url
                            ]
                            DataManager.save_data(data)
                            # (원본 파일 삭제는 선택 사항)
                            return
    raise HTTPException(404, "Attachment not found")