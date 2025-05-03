from pydantic import BaseModel


class Item(BaseModel):
    nombre: str
    descripcion: str = None
    precio: float
    en_stock: bool = True
