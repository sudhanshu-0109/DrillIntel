from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import AIQueryRequest, AIQueryResponse, RAGEvidenceItem
from app.rag.rag_engine import rag_engine
from app.auth import get_current_user, User, record_audit

router = APIRouter(prefix="/ai", tags=["AI & RAG Assistant"])

@router.post("/query", response_model=AIQueryResponse)
def query_drilling_intelligence(
    request: AIQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = rag_engine.generate_answer(
        query=request.query,
        active_well_id=request.well_id,
        depth=request.current_depth,
        formation=request.current_formation
    )
    
    evidence_items = [
        RAGEvidenceItem(
            well_id=e["well_id"],
            document_id=e["document_id"],
            document_title=e["document_title"],
            page_number=e["page_number"],
            depth_start=e.get("depth_start"),
            depth_end=e.get("depth_end"),
            formation=e.get("formation"),
            event_type=e.get("event_type"),
            snippet=e["snippet"],
            confidence=e["confidence"],
            provenance=e["provenance"]
        ) for e in result["evidence"]
    ]
    
    record_audit(db, current_user, "AI_RAG_QUERY", "query", request.query[:50], {
        "well_id": request.well_id,
        "depth": request.current_depth,
        "evidence_count": len(evidence_items)
    })
    
    return AIQueryResponse(
        query=request.query,
        active_well_id=request.well_id,
        depth_context=request.current_depth,
        formation_context=request.current_formation,
        interpretation=result["interpretation"],
        retrieved_evidence=evidence_items,
        confidence_level=result["confidence_level"],
        evidence_status=result["evidence_status"],
        model_used=result["model_used"]
    )
