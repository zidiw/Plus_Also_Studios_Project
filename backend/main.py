from fastapi import FastAPI, UploadFile, Form, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import replicate
import tempfile
import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
app = FastAPI()

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# Allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set Replicate API token
replicate_api_token = os.getenv("REPLICATE_API_TOKEN")
if not replicate_api_token:
    raise ValueError("REPLICATE_API_TOKEN environment variable is not set")
os.environ["REPLICATE_API_TOKEN"] = replicate_api_token


# Endpoint to generate a new image based on the user's input
@app.post("/generate")
async def generate_image(
        image: UploadFile = File(...),  # Uploaded product image
        prompt: str = Form(...),  # Text prompt from the user
        aspect_ratio: str = Form(...),  # Aspect ratio selected by the user
):
    try:
        # Save the uploaded image to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
            contents = await image.read()
            temp_file.write(contents)
            temp_path = temp_file.name

        # Call the Replicate model (flux-1.1-pro) to generate the new image
        with open(temp_path, "rb") as img_file:
            output = replicate.run(
                "black-forest-labs/flux-1.1-pro",  # Use the appropriate model from Replicate
                input={
                    "prompt": prompt,
                    "image_prompt": img_file,
                    "aspect_ratio": aspect_ratio,
                    "output_format": "png",
                    "output_quality": 80,
                    "safety_tolerance": 2,
                    "prompt_upsampling": True
                }
            )

        # Return the URL of the generated image
        return {"generated_image_url": str(output)}

    except Exception as e:
        # Handle any errors that occur during the image generation process
        logger.error(f"Error during image generation: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": str(e)})

    finally:
        # Clean up the temporary file after processing
        if os.path.exists(temp_path):
            os.remove(temp_path)
