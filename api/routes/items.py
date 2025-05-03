from fastapi import APIRouter
from api.models.item import Item

router = APIRouter(prefix="/items", tags=["Items"])


@router.post("/")
def crear_item(item: Item):
    return {"item_recibido": item}
