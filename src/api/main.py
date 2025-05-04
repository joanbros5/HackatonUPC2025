from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from utils import *
from inditex import *

import cv2
import numpy as np
import requests


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
    return {"boxes": boxes}


@app.post("/search-products")
async def get_products(file: UploadFile = File(...)):
    contents = await file.read()
    # add the file as file to the request
    files = {"file": (file.filename, contents)}
    temp_url = requests.post("https://hackatonupc2025.onrender.com/temp-url", files=files)

    temp_url = temp_url.json()["temp_url"]
    print(temp_url)
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
    google_images = search_google_image(data_to_google)
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

    return {"results": images_with_links}

@app.post("/try-clothing")
async def get_try_clothing(
    clothing_image_url: str = Form(...),
    avatar_image_url: str = Form(...)
):
    img = generate_image(
        clothing_image_url,
        avatar_image_url
    )
    url = image_to_tmp_url(img)
    return {"url": url}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
