"""
Research Ingestion Service Package
==================================
Package exports for the eRTMAC-NWIS India-wide Research Manifest ingestion layer.
"""

from .research_models import (
    NationalActivityArea, IngestionReport, RegionalDrillingContext, NationalCoverageSummary
)
from .research_loader import research_loader, ResearchManifestLoader
from .research_validation import research_validator, ResearchManifestValidator
from .research_normalizer import research_normalizer, ResearchManifestNormalizer
from .research_sources import research_sources, ResearchSourceRegistry
from .research_catalog import research_catalog, NationalResearchCatalog

__all__ = [
    "NationalActivityArea",
    "IngestionReport",
    "RegionalDrillingContext",
    "NationalCoverageSummary",
    "research_loader",
    "ResearchManifestLoader",
    "research_validator",
    "ResearchManifestValidator",
    "research_normalizer",
    "ResearchManifestNormalizer",
    "research_sources",
    "ResearchSourceRegistry",
    "research_catalog",
    "NationalResearchCatalog",
]
