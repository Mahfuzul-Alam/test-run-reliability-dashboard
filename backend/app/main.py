import os
from typing import List
from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.models import NormalizedTestRun
from app.parser import parse_junit_xml

MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB limit

app = FastAPI(
    title="RunLens API",
    description="JUnit XML parser and normalized test run analyzer",
    version="1.0.0",
)

# CORS setup: strict allowed origins from env
raw_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,https://mahfuzul-alam.github.io,https://mahfuzshanto.github.io",
)
allowed_origins: List[str] = [
    origin.strip() for origin in raw_origins.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/", tags=["System"])
async def root():
    """Root info endpoint."""
    return {
        "service": "RunLens API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "analyze": "/api/v1/analyze",
    }


@app.get("/health", tags=["System"])
async def health_check():
    """Returns basic service health status."""
    return {"status": "ok", "service": "runlens-api"}


@app.post(
    "/api/v1/analyze",
    response_model=NormalizedTestRun,
    status_code=status.HTTP_200_OK,
    tags=["Analysis"],
)
async def analyze_junit_report(file: UploadFile = File(...)):
    """
    Accepts a single JUnit XML report, processes it in memory,
    and returns normalized run data with summary counts.
    Does not retain uploaded files or store run data.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload.",
        )

    # Basic filename validation (only accept xml-like extensions or octet-stream)
    lower_filename = file.filename.lower()
    if not (lower_filename.endswith(".xml") or lower_filename.endswith(".junit") or lower_filename.endswith(".txt")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a .xml or .junit report.",
        )

    # Read contents with size check
    try:
        content = await file.read(MAX_FILE_SIZE + 1)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to read the uploaded file stream.",
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="File size exceeds the 2 MB limit.",
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    try:
        normalized_run = parse_junit_xml(content, filename=file.filename)
        return normalized_run
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception:
        # Avoid leaking internal stack traces or raw XML contents
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing the test report.",
        )
