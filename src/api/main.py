from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple
from .utils import *
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.post("/boxes")
async def get_boxes(file: UploadFile = File(...)):
    # Leer la imagen del archivo subido
    contents = await file.read()

    # Aquí pasarías la imagen a tu función de detección
    boxes = detect_people_in_image(contents)  # Asegúrate de que tu función acepte bytes

    return {"boxes": boxes}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
