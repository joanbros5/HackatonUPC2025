from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv
from typing import List, Optional

# Load environment variables
load_dotenv()

app = FastAPI(title="Inditex OAuth2 API")


class ProductPrice(BaseModel):
    currency: str
    value: dict

class Product(BaseModel):
    id: str
    name: str
    price: ProductPrice
    link: str
    brand: str

class ProductResponse(BaseModel):
    products: List[Product]

def get_token():
    """
    Get OAuth2 access token from Inditex
    """
    try:
        response = requests.post(
            os.getenv("OAUTH2_ACCESSTOKEN_URL"),
            data={
                "grant_type": "client_credentials",
                "scope": os.getenv("OAUTH2_SCOPE")
            },
            auth=(
                os.getenv("OAUTH2_CLIENT_ID"),
                os.getenv("OAUTH2_SECRET")
            ),
            headers={
                "User-Agent": "OpenPlatform/1.0"
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error getting token: {response.text}"
            )
        
        return response.json()["access_token"]
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting token: {str(e)}"
        )


def search_products(image_url: str):
    """
    Search products using an image URL
    """
    try:
        # Get access token
        token = get_token()
        
        # Make real API call
        response = requests.get(
            "https://api.inditex.com/pubvsearch/products",
            params={"image": image_url},
            headers={
                "Authorization": f"Bearer {token}",
                "User-Agent": "OpenPlatform/1.0"
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error searching products: {response.text}"
            )
        
        return response.json()
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching products: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 