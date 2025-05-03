import io
import os
import uuid
from io import BytesIO

import requests
from PIL import Image
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from serpapi import GoogleSearch
from ultralytics import YOLO

# Load YOLO-v8 model
_ = load_dotenv()

def buscar_imagen_google(data_to_google: list[dict]) -> list[Image.Image]:
    api_key = os.getenv("GOOGLE_API_KEY")
    images_found = []
    for data in data_to_google:
        print(data)
        google_query = f"{data['name']} {data['brand']} {data['id']}"
        params = {
            "engine": "google",
            "q": google_query,
            "tbm": "isch",
            "api_key": api_key
        }

        search = GoogleSearch(params)
        results = search.get_dict()

        if "images_results" in results and results["images_results"]:
            primera_imagen = results["images_results"][0]
            url_image = primera_imagen["original"]
            print(f"Imagen encontrada: {url_image}")
            images_found.append(url_image)
        else:
            print("No se encontraró imágen.")
            continue

    if len(images_found) == 0:
        print("No se encontraron imágenes.")
        return None
    return images_found


def detect_people_in_image(image_bytes):
    model = YOLO("yolov8n.pt")
    image = Image.open(BytesIO(image_bytes))
    results = model(image, classes=0)
    boxes = results[0].boxes.xyxy.tolist()
    print(boxes)
    return boxes

def image_to_tmp_url(image_bytes):
    buffer = io.BytesIO()
    buffer.write(image_bytes)
    buffer.seek(0)

    random_id = str(uuid.uuid4())
    file_name = f"{random_id}.png"
    files = {'file': (file_name, buffer)}
    #response = requests.post('https://tmpfiles.org/api/v1/upload', files=files)
    #data = response.json()
    #image_url = data['data']['url']

    # Get temp url
    #response = requests.get(image_url)
    #soup = BeautifulSoup(response.content, 'html.parser')
    #temp_url = soup.find('img')['src']
    temp_url = "https://tmpfiles.org/dl/26963558/53a1bed0-5e38-4704-ac70-aa03419ab6c1.png"

    return temp_url