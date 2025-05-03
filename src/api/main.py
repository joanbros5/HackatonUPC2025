from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple
from utils import *
from inditex import *

import cv2
import numpy as np
#import mediapipe as mp


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
    # add the file as file to the request
    files = {"file": (file.filename, contents)}
    temp_url = requests.post("https://hackatonupc2025.onrender.com/temp-url", files=files)

    #temp_url = image_to_tmp_url(contents)
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

"""
@app.post("/get-contour")
async def get_contour(file: UploadFile = File(...)):
    # Decode image from bytes
    contents = await file.read()
    image_array = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Failed to decode image from bytes.")

    # Convert BGR to RGB
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # MediaPipe Selfie Segmentation
    mp_selfie_segmentation = mp.solutions.selfie_segmentation
    with mp_selfie_segmentation.SelfieSegmentation(model_selection=1) as selfie_segmentation:
        results = selfie_segmentation.process(image_rgb)
        if results.segmentation_mask is None:
            raise RuntimeError("Segmentation failed.")

        mask = results.segmentation_mask > 0.5  # Binary mask

    # Create binary mask image
    mask_uint8 = (mask.astype(np.uint8)) * 255

    # Find contours
    contours, _ = cv2.findContours(mask_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Extract contour points
    contour_points = []
    for contour in contours:
        for point in contour:
            contour_points.append([int(point[0][0]), int(point[0][1])])

    return {"contour": contour_points}

"""

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
