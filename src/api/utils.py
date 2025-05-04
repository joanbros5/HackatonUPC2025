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


def generate_image(clothing_image_url, avatar_image_url):
    payload = {
        "clothing_image_url": {clothing_image_url},
        "avatar_image_url": {avatar_image_url}
    }
    headers = {
        "x-rapidapi-key": os.getenv("RADAPI_KEY"),
        "x-rapidapi-host": "try-on-diffusion.p.rapidapi.com",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    response = requests.post(
        "https://try-on-diffusion.p.rapidapi.com/try-on-url", data=payload,
        headers=headers)
    return BytesIO(response.content)

def search_google_image(data_to_google: list[dict]) -> list[Image.Image]:
    api_key = os.getenv("GOOGLE_API_KEY")
    images_found = []
    for data in data_to_google:
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
            first_image = results["images_results"][0]
            url_image = first_image["original"]
            print(f"Imagen found: {url_image}")
            images_found.append(url_image)
        else:
            print("Image not found")
            continue

    if len(images_found) == 0:
        print("Images not found")
        return None
    return images_found


def detect_people_in_image(image_bytes):
    model = YOLO("yolov8n.pt")
    image = Image.open(BytesIO(image_bytes))
    results = model(image, classes=0)
    boxes = results[0].boxes.xyxy.tolist()
    return boxes

def image_to_tmp_url(image_bytes):
    buffer = io.BytesIO()
    buffer.write(image_bytes.getvalue())
    buffer.seek(0)
    random_id = str(uuid.uuid4())
    file_name = f"{random_id}.png"
    files = {'file': (file_name, buffer)}
    response = requests.post('https://tmpfiles.org/api/v1/upload', files=files)
    data = response.json()
    image_url = data['data']['url']
    # Get temp url
    response = requests.get(image_url)
    soup = BeautifulSoup(response.content, 'html.parser')
    temp_url = soup.find('img')['src']
    return temp_url