# Inditex OAuth2 API

This FastAPI application provides an endpoint to get OAuth2 access tokens from Inditex.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file with your credentials:
```
OAUTH2_CLIENT_ID=oauth-mkpsbox-oauthiykbamatlkblajcsnjsnbxpro
OAUTH2_SECRET=b*9/Pp1Nv0bVAHga
OAUTH2_ACCESSTOKEN_URL=https://auth.inditex.com:443/openam/oauth2/itxid/itxidmp/sandbox/access_token
OAUTH2_SCOPE=technology.catalog.read
```

## Running the API

Start the server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## Endpoints

### GET /token
Get an OAuth2 access token from Inditex.

Response:
```json
{
    "access_token": "your_access_token",
    "token_type": "Bearer",
    "expires_in": 3600,
    "scope": "technology.catalog.read"
}
```

## Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc` 