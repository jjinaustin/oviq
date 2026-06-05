from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.ingest_service import IngestService

router = APIRouter()

@router.post("/csv")
async def ingest_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files accepted")
    content = await file.read()
    service = IngestService()
    result = await service.process_csv(content)
    return result
