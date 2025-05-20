from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import json

from app.utils.data import DataManager

from app.routers import (
    pages,
    categories,
    subcategories,
    relationships,
    templates as tpl_router,
    attachments as att_router,
)

from app.routers import categories, middle, subcategories
from fastapi.staticfiles import StaticFiles

# 필요 시 import (에러 방지)
try:
    from app.routers.middle import restrict_write_permissions
except ImportError:
    def restrict_write_permissions(request):
        return request  # 또는 pass

app = FastAPI()

app.include_router(categories.router)
app.include_router(middle.router)
app.include_router(subcategories.router)

# ✅ 권한 제한 미들웨어 (중간에 막히면 기본 패스)
app.middleware("http")(restrict_write_permissions)

# ✅ 정적 파일 및 업로드 경로 설정
app.mount("/static", StaticFiles(directory="static"), name="static")
DataManager.create_upload_dir()
DataManager.create_backup_dir()
app.mount("/uploads", StaticFiles(directory=DataManager.UPLOAD_DIR), name="uploads")

# ✅ 템플릿 설정
templates = Jinja2Templates(directory="templates")

# ✅ 템플릿 렌더링 라우터 (index.html)
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    with open("data.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    categories = data.get("categories", [])
    return templates.TemplateResponse("index.html", {
        "request": request,
        "categories": categories
    })

# ✅ API 라우터 등록
app.include_router(pages.router)
app.include_router(categories.router, prefix="/api")
app.include_router(subcategories.router, prefix="/api")
app.include_router(relationships.router, prefix="/api")
app.include_router(tpl_router.router, prefix="/api")
app.include_router(att_router.router, prefix="/api")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
