import React, { useEffect, useState } from 'react';
import {
  FileText, Upload, Search, Filter, ExternalLink,
  CheckCircle2, Plus, Sparkles, BookOpen
} from 'lucide-react';
import { api } from '../services/api';
import { DocumentItem } from '../types';
import { Badge } from '../components/ui/Badge';
import { useAppStore } from '../store/useAppStore';

export const DocumentIntelligence: React.FC = () => {
  const { openDocumentViewer, activeWellId } = useAppStore();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [filterWell, setFilterWell] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState('DDR');
  const [uploadWell, setUploadWell] = useState('NWIS-ASSAM-003');
  const [uploadText, setUploadText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = () => {
    api.getDocuments().then(setDocuments);
  };

  const filteredDocs = documents.filter((d) => {
    const matchesWell = filterWell === 'ALL' || d.well_id === filterWell;
    const matchesType = filterType === 'ALL' || d.document_type === filterType;
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.document_id.toLowerCase().includes(search.toLowerCase());
    return matchesWell && matchesType && matchesSearch;
  });

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle || !uploadText) return;

    setUploading(true);
    try {
      await api.ingestDocument({
        well_id: uploadWell,
        title: uploadTitle,
        document_type: uploadType,
        raw_text: uploadText,
        provenance: 'SYNTHETIC'
      });
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setShowUploadModal(false);
        setUploadTitle('');
        setUploadText('');
        loadDocs();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Ingest Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink flex items-center gap-2">
            <span>Document Intelligence & Knowledge Base</span>
            <Badge category="research">150+ Reports</Badge>
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Layout-aware parsed Daily Drilling Reports (DDRs), Well Completion Reports (WCRs), and NPT post-mortems.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 bg-ink hover:bg-ink-light text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          <Upload className="w-4 h-4 text-[#F5D867]" />
          <span>Ingest New Drilling Report</span>
        </button>
      </div>

      {/* Primary Evidence Spotlight: DDR-0032 Page 14 */}
      <div className="card-surface p-6 bg-gradient-to-r from-[#FAF4E6] to-[#FFFDF9] border border-[#88713C]/30 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <Badge variant="severity" severity="HIGH">Verified Sticking Incident</Badge>
              <Badge category="research">Primary Offset Evidence</Badge>
            </div>
            <h3 className="text-lg font-black text-ink">
              DDR-0032: Differential Sticking Event Log (NWIS-ASSAM-001)
            </h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Contains the complete operational and chronological transcript of torque escalation (18 to 34 kNm), 40 tonnes overpull,
              and successful Pipe-Free soak pill deployment across 3262m-3275m in Tipam Sandstone.
            </p>
          </div>

          <button
            onClick={() => openDocumentViewer('DDR-0032', 14)}
            className="px-5 py-3 bg-[#88713C] hover:bg-[#685429] text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-2 shrink-0"
          >
            <BookOpen className="w-4 h-4 text-[#F5D867]" />
            <span>Open Page 14 Original Evidence</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-[#88713C]/20 shadow-sm">
        <div className="flex items-center gap-2 px-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search report titles, identifiers, operational terms..."
            className="text-xs text-ink placeholder-gray-400 bg-transparent focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterWell}
            onChange={(e) => setFilterWell(e.target.value)}
            className="text-xs font-bold bg-cream-50 border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Wells ({documents.length})</option>
            <option value="NWIS-ASSAM-001">NWIS-ASSAM-001</option>
            <option value="NWIS-ASSAM-002">NWIS-ASSAM-002</option>
            <option value="NWIS-ASSAM-003">NWIS-ASSAM-003</option>
            <option value="NWIS-ASSAM-004">NWIS-ASSAM-004</option>
            <option value="NWIS-ASSAM-005">NWIS-ASSAM-005</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs font-bold bg-cream-50 border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Document Types</option>
            <option value="DDR">Daily Drilling Report (DDR)</option>
            <option value="WCR">Well Completion Report (WCR)</option>
            <option value="MUD_LOG">Mud Log</option>
            <option value="GEOLOGICAL_PROGNOSIS">Geological Prognosis</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <div
            key={doc.document_id}
            onClick={() => openDocumentViewer(doc.document_id, 1)}
            className="card-surface p-4 hover:shadow-card-hover cursor-pointer transition-all space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-ink">{doc.document_id}</span>
              <Badge category="research">{doc.document_type}</Badge>
            </div>

            <h4 className="font-bold text-ink line-clamp-2">{doc.title}</h4>

            <div className="grid grid-cols-2 gap-1 text-[11px] text-ink-muted bg-cream-50 p-2.5 rounded-lg">
              <div>Well: <strong>{doc.well_id}</strong></div>
              <div>Pages: <strong>{doc.page_count}</strong></div>
              <div>Date: <strong>{doc.date}</strong></div>
              <div>Confidence: <strong>{(doc.extraction_confidence * 100).toFixed(0)}%</strong></div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-brand-brown font-bold">
              <span>View Source Pages</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Ingestion Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-ink">Ingest Drilling Document / PDF Report</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-ink">✕</button>
            </div>

            <form onSubmit={handleIngest} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">Target Well ID</label>
                <select
                  value={uploadWell}
                  onChange={(e) => setUploadWell(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-cream-50 text-xs"
                >
                  <option value="NWIS-ASSAM-003">NWIS-ASSAM-003 (Active)</option>
                  <option value="NWIS-ASSAM-001">NWIS-ASSAM-001</option>
                  <option value="NWIS-ASSAM-002">NWIS-ASSAM-002</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Report Title</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. DDR #42 - Section 3250-3320m Mud Loss Report"
                  className="w-full p-2 border rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Document Type</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-cream-50 text-xs"
                >
                  <option value="DDR">Daily Drilling Report (DDR)</option>
                  <option value="WCR">Well Completion Report (WCR)</option>
                  <option value="MUD_LOG">Mud Logging Report</option>
                  <option value="NPT_REPORT">NPT / Incident Report</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Report Text Content (Layout-aware Parser)</label>
                <textarea
                  value={uploadText}
                  onChange={(e) => setUploadText(e.target.value)}
                  rows={6}
                  placeholder="Paste OCR or report text with depth intervals, lithology, and operational logs..."
                  className="w-full p-2 border rounded-lg font-mono text-[11px]"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-bold text-ink hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-ink text-white rounded-lg text-xs font-bold hover:bg-ink-light flex items-center gap-1.5"
                >
                  {uploadSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Ingested & Indexed
                    </>
                  ) : uploading ? (
                    'Processing & Chunking...'
                  ) : (
                    'Extract & Index'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
