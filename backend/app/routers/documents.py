from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models_db import Document, DocumentPage
from app.schemas import DocumentItem, DocumentPageItem, DocumentIngestRequest
from app.services.document_ai.parser import document_parser
from app.auth import get_current_user, User, record_audit

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("", response_model=List[DocumentItem])
def get_documents(
    well_id: Optional[str] = None,
    document_type: Optional[str] = None,
    provenance: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    if well_id:
        query = query.filter(Document.well_id == well_id)
    if document_type:
        query = query.filter(Document.document_type == document_type)
    if provenance:
        query = query.filter(Document.provenance == provenance)
    return query.order_by(Document.created_at.desc()).offset(offset).limit(limit).all()

@router.get("/{id}", response_model=DocumentItem)
def get_document(id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.document_id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document {id} not found")
    return doc

@router.get("/{id}/pages/{page}", response_model=DocumentPageItem)
def get_document_page(id: str, page: int, db: Session = Depends(get_db)):
    doc_page = db.query(DocumentPage).filter(
        DocumentPage.document_id == id,
        DocumentPage.page_number == page
    ).first()
    if not doc_page:
        raise HTTPException(status_code=404, detail=f"Page {page} of document {id} not found")
    return doc_page

@router.post("/ingest")
def ingest_document(
    request: DocumentIngestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc_id = document_parser.process_and_ingest_document(
        well_id=request.well_id,
        title=request.title,
        document_type=request.document_type,
        raw_text=request.raw_text,
        date=request.date or "2026-03-20",
        provenance=request.provenance
    )
    record_audit(db, current_user, "DOCUMENT_INGEST", "document", doc_id, {"title": request.title})
    return {
        "status": "COMPLETED",
        "document_id": doc_id,
        "message": "Document parsed, layout extracted, and semantic chunks indexed into knowledge base."
    }
