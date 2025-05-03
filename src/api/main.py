from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/boxes")
async def get_boxes():
    # Mock bounding boxes in the format [x1, y1, x2, y2]
    boxes = [
        [50, 50, 250, 250],    # First box: top-left=(50,50), bottom-right=(250,250)
        [300, 100, 550, 280],  # Second box: top-left=(300,100), bottom-right=(550,280)
        [200, 300, 420, 490]   # Third box: top-left=(200,300), bottom-right=(420,490)
    ]
    return {"boxes": boxes}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
