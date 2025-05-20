from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field

class Note(BaseModel):
    notes: Optional[Dict[str, Any]] = {}
    attachments: Optional[List[Dict[str, str]]] = []

class Attachment(BaseModel):
    filename: str
    url: str

class Template(BaseModel):
    id: int
    name: str
    fields: List[str]
    include_models: bool = False

class Relationship(BaseModel):
    from_id: int
    to_id: int

class SubCategory(BaseModel):
    id: int
    name: str
    # 여기를 반드시 추가
    template_id: Optional[int] = None
    notes: Optional[Dict[str, Any]] = Field(default_factory=dict)
    attachments: Optional[List[Attachment]] = Field(default_factory=list)

class MidCategory(BaseModel):
    id: int
    name: str
    subcategories: List[SubCategory] = []

class Category(BaseModel):
    id: int
    name: str
    midcategories: Optional[List[MidCategory]] = Field(default_factory=list)
    
class Template(BaseModel):
    id: int
    name: str
    fields: List[str]
    include_models: bool = False
    

class OrderPayload(BaseModel):
    order: List[Union[int, str]]