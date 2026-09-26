import re
from typing import Dict, Any, List
from apps.api.database import SessionLocal
from apps.api.models_db import Document, DocumentPage, DocumentChunk

class DocumentAIParser:
    def __init__(self):
        pass

    def extract_metadata_from_text(self, text: str) -> Dict[str, Any]:
        """
        Extract depth, formation, dates, and event tags from report text using regex and heuristics.
        """
        # Look for depths like "3280 m", "3280.5m", "Depth: 3250-3280m"
        depth_matches = re.findall(r'(\d{3,4}(?:\.\d+)?)\s*(?:m|meters|meter)', text, re.IGNORECASE)
        depth_start = float(depth_matches[0]) if depth_matches else None
        depth_end = float(depth_matches[1]) if len(depth_matches) > 1 else (depth_start + 15.0 if depth_start else None)
        
        # Look for known Assam formations
        formation = None
        formations = ["Tipam Sandstone", "Girujan Clay", "Barail Sandstone", "Dhekiajuli", "Kopili", "Alluvium"]
        for f in formations:
            if re.search(r'\b' + re.escape(f) + r'\b', text, re.IGNORECASE):
                formation = f
                break
                
        # Look for event type
        event_type = None
        if re.search(r'stuck\s*pipe|differential\s*stick|pipe\s*stuck|overpull', text, re.IGNORECASE):
            event_type = "stuck_pipe"
        elif re.search(r'mud\s*loss|lost\s*circulation|losses|seepage', text, re.IGNORECASE):
            event_type = "mud_loss"
        elif re.search(r'kick|gas\s*influx|well\s*control|pit\s*gain', text, re.IGNORECASE):
            event_type = "kick"
        elif re.search(r'pack[\s-]*off', text, re.IGNORECASE):
            event_type = "pack_off"
        elif re.search(r'washout', text, re.IGNORECASE):
            event_type = "washout"
            
        return {
            "depth_start": depth_start,
            "depth_end": depth_end,
            "formation": formation,
            "event_type": event_type
        }

    def process_and_ingest_document(
        self,
        well_id: str,
        title: str,
        document_type: str,
        raw_text: str,
        date: str = "2026-03-15",
        provenance: str = "SYNTHETIC"
    ) -> str:
        """
        Ingest, parse, chunk and store document with metadata.
        """
        db = SessionLocal()
        try:
            doc_id = f"DOC-{well_id[-3:]}-{title.replace(' ', '-').upper()[:12]}"
            
            # Split raw text into simulated pages (separated by --- or page markers)
            pages_raw = re.split(r'---|\n(?=Page\s+\d+)', raw_text)
            if not pages_raw:
                pages_raw = [raw_text]
                
            doc = Document(
                document_id=doc_id,
                well_id=well_id,
                title=title,
                document_type=document_type,
                date=date,
                page_count=len(pages_raw),
                source=f"OIL eRTMAC Ingestion / {provenance}",
                provenance=provenance,
                extraction_confidence=0.96,
                status="COMPLETED"
            )
            db.add(doc)
            db.commit()
            
            for idx, p_text in enumerate(pages_raw):
                page_num = idx + 1
                meta = self.extract_metadata_from_text(p_text)
                
                page_obj = DocumentPage(
                    document_id=doc_id,
                    page_number=page_num,
                    text_content=p_text.strip(),
                    depth_start=meta["depth_start"],
                    depth_end=meta["depth_end"],
                    formation=meta["formation"],
                    has_event=bool(meta["event_type"])
                )
                db.add(page_obj)
                
                # Create semantic chunks
                chunk_id = f"{doc_id}-P{page_num}-C1"
                chunk_obj = DocumentChunk(
                    chunk_id=chunk_id,
                    document_id=doc_id,
                    well_id=well_id,
                    page_number=page_num,
                    chunk_text=p_text.strip(),
                    depth_start=meta["depth_start"],
                    depth_end=meta["depth_end"],
                    formation=meta["formation"],
                    event_type=meta["event_type"],
                    provenance=provenance,
                    extraction_confidence=0.95
                )
                db.add(chunk_obj)
                
            db.commit()
            return doc_id
        finally:
            db.close()

document_parser = DocumentAIParser()
