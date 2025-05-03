import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def get_token() -> str:
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
                "User-Agent": "OpenPlatform/1.0",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        )

        if response.status_code != 200:
            print(f"Error getting token: {response.text}")
            return None
        
        token_data = response.json()
        return token_data["id_token"]
            
    except Exception as e:
        print(f"Error getting token: {str(e)}")
        return None


def search_products(image_url: str) -> list[dict]:
    """
    Search products using an image URL and return a list of products
    """
    try:
        # Get access token
        token = get_token()
        if not token:
            return None
        
        # Make real API call
        headers = {
            "Authorization": f"Bearer {token}",
            "User-Agent": "OpenPlatform/1.0",
            "Content-Type": "application/json"
        }
        
        params = {
            "image": image_url,
            "page": 1,
            "perPage": 5
        }

        response = requests.get(
            "https://api.inditex.com/pubvsearch/products",
            params=params,
            headers=headers
        )

        if response.status_code != 200:
            print(f"Error searching products: {response.text}")
            return None
        
        return response.json()
            
    except Exception as e:
        print(f"Error searching products: {str(e)}")
        return None


if __name__ == "__main__":
    # Test image URL
    image_url = "https://tmpfiles.org/dl/26900256/a58f7aa2-1e8f-4e47-aa94-87d3ada8b186.png"
    
    print("Searching products for image:", image_url)
    result = search_products(image_url)
    
    if result:
        print("\nFound products:")
        for product in result:  # result is already a list of products
            print(f"\nID: {product['id']}")
            print(f"Name: {product['name']}")
            print(f"Brand: {product['brand']}")
            print(f"Price: {product['price']['value']['current']} {product['price']['currency']}")
            print(f"Link: {product['link']}")
    else:
        print("\nNo products found or error occurred") 