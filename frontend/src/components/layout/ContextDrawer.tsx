import React, { useEffect, useState } from 'react';
import { X, CheckCircle, FileText, AlertTriangle, ExternalLink, ShieldCheck, Compass, MapPin } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { api } from '../../services/api';
import { Badge } from '../ui/Badge';
import { DocumentPageItem } from '../../types';

export const ContextDrawer: React.FC = () => {
  const {
    activeDrawer,
    selectedAlert,
    selectedDocViewer,
    closeDrawer,
    openDocumentViewer
  } = useAppStore();

  const [pageData, setPageData] = useState<DocumentPageItem | null>(null);
  const [loadingPage, setLoadingPage] = useState(false);
  const [ackNotes, setAckNotes] = useState('Reviewed torque escalation. Spotted Pipe-Free soak pill and verified string movement.');
  const [ackSuccess, setAckSuccess] = useState(false);
  const [submittingAck, setSubmittingAck] = useState(false);

  // Load document page if doc drawer active
  useEffect(() => {
    if (activeDrawer === 'document' && selectedDocViewer) {
      setLoadingPage(true);
      api.getDocumentPage(selectedDocViewer.documentId, selectedDocViewer.pageNumber)
        .then((data) => setPageData(data))
        .catch((err) => console.error(err))
        .finally(() => setLoadingPage(false));
    }
  }, [activeDrawer, selectedDocViewer]);

  if (!activeDrawer) return null;

  const handleAcknowledge = async () => {
    if (!selectedAlert) return;
    setSubmittingAck(true);
    try {
      await api.acknowledgeAlert(selectedAlert.alert_id, ackNotes);
      setAckSuccess(true);
      setTimeout(() => {
        closeDrawer();
        setAckSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Acknowledgement failed:', err);
    } finally {
      setSubmittingAck(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex max-w-full pl-10">
      <div className="w-screen max-w-md bg-white border-l border-[#88713C]/20 shadow-drawer flex flex-col">
        {/* Drawer Header */}
        <div className="px-6 py-5 bg-[#FAF4E6] border-b border-[#88713C]/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeDrawer === 'alert' && <AlertTriangle className="w-5 h-5 text-red-600" />}
            {activeDrawer === 'document' && <FileText className="w-5 h-5 text-brand-brown" />}
            <h3 className="text-base font-bold text-ink">
              {activeDrawer === 'alert' && 'Decision-Support Alert Evidence'}
              {activeDrawer === 'document' && `Document Intelligence Viewer`}
            </h3>
          </div>
          <button
            onClick={closeDrawer}
            className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ALERT VIEW */}
          {activeDrawer === 'alert' && selectedAlert && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Badge variant="severity" severity={selectedAlert.severity}>
                  {selectedAlert.severity} RISK
                </Badge>
                <span className="font-mono text-xs text-ink-muted">
                  {selectedAlert.alert_id}
                </span>
              </div>

              {/* What, Where, When */}
              <div className="bg-cream-50 p-4 rounded-xl border border-cream-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-muted font-medium">Target Event:</span>
                  <span className="font-bold text-ink uppercase">{selectedAlert.event_type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted font-medium">Active Well:</span>
                  <span className="font-bold text-ink">{selectedAlert.well_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted font-medium">Current Depth:</span>
                  <span className="font-bold text-ink">{selectedAlert.depth.toFixed(1)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted font-medium">Formation:</span>
                  <span className="font-bold text-brand-brown">{selectedAlert.formation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted font-medium">ML Model:</span>
                  <span className="font-mono text-ink">{selectedAlert.model_version}</span>
                </div>
              </div>

              {/* WHY: Physical signal changes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                  Detection Rationale (Why Alert Fired)
                </h4>
                <div className="p-3.5 bg-red-50/70 border border-red-200/80 rounded-xl text-xs text-red-950 leading-relaxed">
                  {selectedAlert.reason}
                </div>
              </div>

              {/* Historical Offset Evidence */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                  Comparable Offset Precedents
                </h4>
                {selectedAlert.historical_evidence?.map((ev: any, idx: number) => (
                  <div key={idx} className="p-3 bg-cream-50 border border-cream-200 rounded-xl mb-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-ink mb-1">
                      <span>{ev.well_id}</span>
                      <span className="text-emerald-700 font-mono">{(ev.similarity * 100).toFixed(0)}% Similarity</span>
                    </div>
                    <p className="text-ink-muted mb-2">
                      Historical stuck pipe at {ev.depth}m in {ev.formation}. Differential sticking occurred during survey connection.
                    </p>
                  </div>
                ))}
              </div>

              {/* Traceable Source Document Citation */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                  Auditable Source Citation
                </h4>
                {selectedAlert.source_documents?.map((doc: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => openDocumentViewer(doc.document_id, doc.page)}
                    className="p-3 bg-pink-50/70 border border-pink-200 rounded-xl cursor-pointer hover:bg-pink-100/80 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-pink-700" />
                      <div>
                        <div className="font-bold text-xs text-ink">{doc.document_id} — Page {doc.page}</div>
                        <div className="text-[11px] text-ink-muted">{doc.title}</div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-pink-700" />
                  </div>
                ))}
              </div>

              {/* Acknowledgement Action (Decision Support) */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase">
                  Drilling Engineer Acknowledgement
                </label>
                <textarea
                  value={ackNotes}
                  onChange={(e) => setAckNotes(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-brand-brown focus:ring-1 focus:ring-brand-brown mb-3"
                  placeholder="Enter mitigation notes or verification comment..."
                />

                <button
                  onClick={handleAcknowledge}
                  disabled={submittingAck || ackSuccess}
                  className="w-full py-2.5 px-4 bg-ink hover:bg-ink-light text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {ackSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      Alert Acknowledged & Logged
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-[#F5D867]" />
                      Acknowledge & Record Audit Trail
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* DOCUMENT PAGE VIEWER */}
          {activeDrawer === 'document' && selectedDocViewer && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm font-bold text-ink">
                    {selectedDocViewer.documentId}
                  </span>
                  <div className="text-xs text-ink-muted">Page {selectedDocViewer.pageNumber}</div>
                </div>
                <Badge variant="provenance" provenance="SYNTHETIC" />
              </div>

              {loadingPage ? (
                <div className="p-8 text-center text-xs text-ink-muted">
                  Loading original report page...
                </div>
              ) : pageData ? (
                <div className="space-y-4">
                  <div className="bg-cream-50 p-3 rounded-xl border border-cream-200 text-xs flex justify-between">
                    <span>Depth: <strong>{pageData.depth_start}m - {pageData.depth_end}m</strong></span>
                    <span>Formation: <strong>{pageData.formation}</strong></span>
                  </div>

                  <div className="bg-[#FFFDF9] border border-gray-300 rounded-xl p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-gray-800 shadow-inner">
                    {pageData.text_content}
                  </div>

                  {pageData.has_event && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                      <strong>Operational Incident Verified:</strong> This historical record contains verified stuck pipe occurrence and chemical soak freeing protocol.
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-ink-muted">
                  Document content unavailable.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
