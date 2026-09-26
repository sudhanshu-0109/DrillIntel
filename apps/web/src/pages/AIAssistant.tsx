import React, { useState } from 'react';
import {
  Bot, Send, Sparkles, FileText, ExternalLink, ShieldCheck,
  Compass, AlertTriangle, Layers, ChevronRight, HelpCircle
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { AIQueryResponse, RAGEvidenceItem } from '../types';
import { Badge } from '../components/ui/Badge';
import clsx from 'clsx';

export const AIAssistant: React.FC = () => {
  const {
    activeWellId,
    currentDepth,
    currentFormation,
    latestTelemetry,
    latestRisk,
    openDocumentViewer
  } = useAppStore();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<AIQueryResponse[]>([
    {
      query: "Show previous stuck pipe incidents around current depth and formation in nearby offset wells.",
      active_well_id: "NWIS-ASSAM-003",
      depth_context: 3280.0,
      formation_context: "Tipam Sandstone",
      interpretation: "Based on historical offset records from NWIS-ASSAM-001 (3.4 km East), a severe differential sticking event occurred at depth 3262m - 3275m within permeable Tipam Sandstone. The primary root cause identified in DDR-0032 (Page 14) was high overbalance (0.15 SG / 48 bar) combined with stationary drill string during survey connection. The field team spotted a 12 m3 Pipe-Free soak pill and successfully freed the string after 48 hours NPT.",
      retrieved_evidence: [
        {
          well_id: "NWIS-ASSAM-001",
          document_id: "DDR-0032",
          document_title: "Daily Drilling Report - NWIS-ASSAM-001 (Section 3200-3300m)",
          page_number: 14,
          depth_start: 3262.0,
          depth_end: 3275.0,
          formation: "Tipam Sandstone",
          event_type: "stuck_pipe",
          snippet: "TIME LOG: 04:30: Severe torque escalation observed: Surface torque increased abruptly from 18 kNm to 34 kNm. ROP plummeted to 2.2 m/hr. Commenced connection... Overpull reached 40 tonnes. DIAGNOSIS: Differential sticking across porous Tipam Sandstone.",
          confidence: 0.98,
          provenance: "SYNTHETIC"
        }
      ],
      confidence_level: "HIGH",
      evidence_status: "STRONG_EVIDENCE",
      model_used: "eRTMAC-Grounded-RAG-v1"
    }
  ]);

  const sampleQueries = [
    "Show previous stuck pipe incidents near the current depth.",
    "Which nearby wells experienced mud loss in this formation?",
    "Why is the current well being flagged for stuck pipe risk?",
    "What historical mitigation was recorded in NWIS-ASSAM-001?"
  ];

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || query;
    if (!q.trim() || loading) return;

    setLoading(true);
    setQuery('');

    try {
      const res = await api.queryAI({
        query: q,
        well_id: activeWellId,
        current_depth: currentDepth,
        current_formation: currentFormation
      });

      setConversation(prev => [...prev, res]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Active Well Operational Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink flex items-center gap-2.5">
            <span>Context-Aware Drilling AI Assistant</span>
            <Badge category="research">eRTMAC Memory</Badge>
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Grounded RAG intelligence answering complex operational questions using offset WCRs, DDRs, and live parameters.
          </p>
        </div>

        {/* Live Context Capsule */}
        <div className="bg-white p-3 rounded-2xl border border-[#88713C]/20 shadow-sm flex items-center gap-3 text-xs">
          <span className="text-ink-muted font-medium">Query Context:</span>
          <span className="font-bold text-ink">{activeWellId}</span>
          <span>•</span>
          <span className="font-mono text-ink font-bold">{currentDepth.toFixed(1)}m</span>
          <span>•</span>
          <span className="font-bold text-brand-brown">{currentFormation}</span>
        </div>
      </div>

      {/* Suggested Quick Queries */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-ink-muted uppercase mr-1">Suggestions:</span>
        {sampleQueries.map((sq, i) => (
          <button
            key={i}
            onClick={() => handleSend(sq)}
            className="text-xs bg-white hover:bg-cream-50 text-ink px-3 py-1.5 rounded-xl border border-[#88713C]/20 transition-all font-medium shadow-sm hover:border-brand-brown"
          >
            "{sq}"
          </button>
        ))}
      </div>

      {/* Conversation Thread */}
      <div className="space-y-6 pb-20">
        {conversation.map((msg, idx) => (
          <div key={idx} className="space-y-4">
            {/* User Query */}
            <div className="flex justify-end">
              <div className="bg-ink text-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-xl text-xs font-medium shadow-sm">
                {msg.query}
              </div>
            </div>

            {/* AI Synthesized Answer & Evidence Card */}
            <div className="card-surface p-6 space-y-5 border-l-4 border-l-brand-brown">
              {/* Context Tagline */}
              <div className="flex items-center justify-between text-xs border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2 text-ink-muted">
                  <Bot className="w-4 h-4 text-brand-brown" />
                  <span>Grounding Context: <strong>{msg.active_well_id}</strong> @ <strong>{msg.depth_context?.toFixed(1)}m</strong> in <strong>{msg.formation_context}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="provenance" provenance="SYNTHETIC" />
                  <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                    {msg.evidence_status}
                  </span>
                </div>
              </div>

              {/* GENERATED INTERPRETATION */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-brand-dark flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-brown" />
                  <span>Synthesized Drilling Decision Support</span>
                </div>
                <p className="text-xs text-ink leading-relaxed font-normal bg-cream-50/70 p-3.5 rounded-xl border border-cream-200">
                  {msg.interpretation}
                </p>
              </div>

              {/* RETRIEVED EVIDENCE (Strictly separated from interpretation) */}
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted flex items-center justify-between">
                  <span>Retrieved Offset Document Evidence ({msg.retrieved_evidence.length})</span>
                  <span className="text-[10px] text-gray-500 font-normal">Click evidence chip to open original report page</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {msg.retrieved_evidence.map((ev, eIdx) => (
                    <div
                      key={eIdx}
                      onClick={() => openDocumentViewer(ev.document_id, ev.page_number)}
                      className="p-3.5 bg-[#FFFDF9] border border-pink-200/80 hover:border-pink-400 rounded-xl cursor-pointer hover:shadow-sm transition-all space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-ink">
                          <FileText className="w-4 h-4 text-pink-700" />
                          <span>{ev.well_id} • {ev.document_id}</span>
                        </div>
                        <span className="text-[10px] font-bold bg-pink-100/70 text-pink-900 px-2 py-0.5 rounded">
                          Page {ev.page_number}
                        </span>
                      </div>

                      <div className="text-[11px] text-ink-muted flex justify-between">
                        <span>Depth: <strong>{ev.depth_start}m - {ev.depth_end}m</strong></span>
                        <span>Formation: <strong>{ev.formation}</strong></span>
                      </div>

                      <p className="text-[11px] text-gray-700 bg-pink-50/40 p-2 rounded border border-pink-100 font-mono line-clamp-3">
                        "{ev.snippet}"
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-pink-800 font-bold">
                        <span>Confidence: {(ev.confidence * 100).toFixed(0)}%</span>
                        <span className="flex items-center gap-0.5">Open Page Evidence <ExternalLink className="w-3 h-3" /></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Query Input Box Fixed at Bottom */}
      <div className="fixed bottom-6 left-[96px] right-6 max-w-[1500px] mx-auto bg-white/95 backdrop-blur p-3 rounded-2xl border border-[#88713C]/25 shadow-xl flex items-center gap-3 z-20">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Ask about previous events in ${currentFormation}, offset wells near ${currentDepth.toFixed(0)}m, or sticking mitigation...`}
          className="flex-1 text-xs text-ink placeholder-gray-400 px-3 py-2 bg-transparent focus:outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-ink hover:bg-ink-light text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-40"
        >
          {loading ? (
            <span>Retrieving...</span>
          ) : (
            <>
              <Send className="w-3.5 h-3.5 text-[#F5D867]" />
              <span>Ask NWIS</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
