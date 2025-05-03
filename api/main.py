from fastapi import FastAPI
from api.routes import items

app = FastAPI()

# Incluir rutas
app.include_router(items.router)


@app.get("/")
def root():
    return {"message": "Bienvenido a mi API"}
