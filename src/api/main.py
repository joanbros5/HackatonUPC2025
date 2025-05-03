from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import base64
import io
from PIL import Image

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
    
    # Convert to PIL Image
    image = Image.open(io.BytesIO(contents))
    
    # For now, return mock boxes
    # Format: [id, [x1, y1], [x2, y2]]
    boxes = [
        [1, [50, 50], [250, 250]],  # First box: id=1, top-left=(50,50), bottom-right=(250,250)
        [2, [300, 100], [550, 280]],  # Second box: id=2, top-left=(300,100), bottom-right=(550,280)
        [3, [200, 300], [420, 490]]  # Third box: id=3, top-left=(200,300), bottom-right=(420,490)
    ]
    
    return {"boxes": boxes}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
