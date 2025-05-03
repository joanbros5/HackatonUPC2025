from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple
from utils import *
from inditex import *
import base64
from io import BytesIO

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
    contents = await file.read()
    temp_url = image_to_tmp_url(contents)
    results = search_products(temp_url)
    data_to_google = []
    for result in results:
        data_to_google.append({
            "name": result["name"],
            "brand": result["brand"],
            "id": result["id"],
            "link": result["link"],
            "price": f"{result['price']['value']['current']} {result['price']['currency']}"
        })
    print(data_to_google)
    google_images = buscar_imagen_google(data_to_google)
    if google_images is None:
        return {"results": []}

    # Convert images to base64 and pair with links
    images_with_links = []
    for img, product in zip(google_images, data_to_google):
        images_with_links.append({
            "image_url": img,
            "name": product["name"],
            "brand": product["brand"],
            "price": product["price"],
            "link": product["link"]
        })
    print(images_with_links)

    return {"results": images_with_links}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
