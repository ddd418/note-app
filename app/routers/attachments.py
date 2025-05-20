import os
import time
from fastapi import APIRouter, HTTPException, Path, File, UploadFile, Body

from app.models import Attachment
from app.utils.data import DataManager

router = APIRouter()

@router.post(
    "/category/{category_id}/subcategory/{subcategory_id}/attachment",
    response_model=Attachment,
    status_code=201
)
async def upload_attachment(
    category_id: int = Path(...),
    subcategory_id: int = Path(...),
    file: UploadFile = File(...)
):
    data = DataManager.load_data()
    for c in data["categories"]:
        if c["id"] == category_id:
            for s in c.get("subcategories", []):
                if s["id"] == subcategory_id:
                    fname = f"{subcategory_id}_{int(time.time())}_{file.filename}"
                    path = os.path.join(DataManager.UPLOAD_DIR, fname)
                    with open(path, "wb") as f:
                        f.write(await file.read())
                    url = f"/uploads/{fname}"
                    att = {"filename": file.filename, "url": url}
                    s.setdefault("attachments", []).append(att)
                    DataManager.save_data(data)
                    return att
    raise HTTPException(404, "SubCategory not found")

@router.delete(
    "/category/{category_id}/subcategory/{subcategory_id}/attachment",
    status_code=204
)
async def delete_attachment(
    category_id: int = Path(...),
    subcategory_id: int = Path(...),
    payload: Attachment = Body(...)
):
    data = DataManager.load_data()
    for c in data["categories"]:
        if c["id"] == category_id:
            for s in c.get("subcategories", []):
                if s["id"] == subcategory_id:
                    atts = s.get("attachments", [])
                    s["attachments"] = [a for a in atts if a["url"] != payload.url]
                    fp = os.path.join(DataManager.UPLOAD_DIR, os.path.basename(payload.url))
                    if os.path.exists(fp):
                        os.remove(fp)
                    DataManager.save_data(data)
                    return
    raise HTTPException(404, "SubCategory not found")