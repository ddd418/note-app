from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="templates")

@router.get("/", response_class=HTMLResponse)
async def read_index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@router.get("/detail.html", response_class=HTMLResponse)
async def read_detail(request: Request):
    return templates.TemplateResponse("detail.html", {"request": request})

@router.get("/mindmap.html", response_class=HTMLResponse)
async def read_mindmap(request: Request):
    return templates.TemplateResponse("mindmap.html", {"request": request})

@router.get("/templates.html", response_class=HTMLResponse)
async def read_templates(request: Request):
    return templates.TemplateResponse("templates.html", {"request": request})