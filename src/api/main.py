from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple
from utils import *
from inditex import *

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
    # Read the uploaded file
    contents = await file.read()
    boxes = detect_people_in_image(contents)
    #boxes = [[0, 0, 100, 100], [100, 100, 200, 200], [200, 200, 300, 300], [300, 300, 400, 400]]

    return {"boxes": boxes}

@app.post("/search-products")
async def get_products(file: UploadFile = File(...)):
    # Leer la imagen del archivo subido
    contents = await file.read()
    temp_url = image_to_tmp_url(contents)
    results = search_products(temp_url)

    return {"results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
