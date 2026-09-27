import React, { useState } from 'react';
import {
  Bot, Send, Sparkles, FileText, ExternalLink,
  Layers, ChevronRight, HelpCircle, AlertTriangle, BookOpen, Compass, Loader2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { AIQueryResponse, RAGEvidenceItem } from '../types';
import { getAssignedWellsForUser } from '../services/assignedWells';
import { Badge } from '../components/ui/Badge';
import clsx from 'clsx';

export const AIAssistant: React.FC = () => {
  const {
    activeWellId,
    currentDepth,
    currentFormation,
    openDocumentViewer,
    currentUser
  } = useAppStore();

  const assignedWells = getAssignedWellsForUser(currentUser.username);
  const activeWellInfo = assignedWells.find(w => w.well_id === activeWellId) || assignedWells[0];

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<AIQueryResponse[]>([
    {
      query: `Why is the stuck pipe risk elevated around ${currentDepth.toFixed(0)}m in ${currentFormation}?`,
      active_well_id: activeWellId,
      depth_context: currentDepth,
      formation_context: currentFormation,
      interpretation: `Based on real-time telemetry from ${activeWellInfo.well_name} and historical correlation in ${currentFormation}, surface torque has increased from a 15.8 kNm baseline to 17.9 kNm (+13.3%), while ROP has decreased from 18.2 m/hr to 14.3 m/hr. In nearby offset well OIL Duliajan Well #1 (4.2 km west), severe differential sticking was recorded at 3290m under identical lithological conditions. Recommended action: Circulate bottoms-up, condition mud weight to 1.25 sg, and limit static connection time to <15 minutes.`,
      retrieved_evidence: [
        {
          well_id: 'NWIS-ASSAM-001',
          document_id: 'DDR-0032',
          document_title: 'DDR - OIL Duliajan Well #1',
          page_number: 14,
          snippet: 'Differential sticking occurred at 3290m during connection. Pipe freed after 14 hrs jarring.',
          confidence: 0.94,
          provenance: 'Daily Drilling Report #32 (OIL Archival)'
        }
      ],
      confidence_level: 'HIGH',
      evidence_status: 'STRONG_EVIDENCE',
      model_used: 'RAG Grounded Retrieval'
    }
  ]);

  const quickQuestions = [
    `Why is stuck pipe risk elevated at ${currentDepth.toFixed(0)}m?`,
    `What mud weight was used in ${currentFormation} offset wells?`,
    `Show historical stuck pipe incidents within 15 km of ${activeWellInfo.well_name}.`,
    `What are the casing shoe depths for nearby wells in this basin?`
  ];

  const handleAsk = async (userQuery: string) => {
    if (!userQuery.trim() || loading) return;
    setLoading(true);

    try {
      const response = await api.queryAI({
        query: userQuery,
        well_id: activeWellId,
        current_depth: currentDepth,
        current_formation: currentFormation
      });

      setConversation(prev => [response, ...prev]);
      setQuery('');
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── Context Awareness Banner ──────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] p-5 shadow-card border border-[#88713C]/15 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-ink">Context-Aware Drilling Assistant</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 font-bold">
                GROUNDED RAG
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Current Active Context: <strong className="text-ink">{activeWellInfo.well_name}</strong> • Depth: <strong className="text-brand-brown font-mono font-bold">{currentDepth.toFixed(1)}m</strong> • Formation: <strong className="text-brand-brown">{currentFormation}</strong>
            </p>
          </div>
        </div>

        <Badge category="research">DDR Archive Grounded</Badge>
      </div>

      {/* ── Quick Context Prompt Chips ────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(q)}
            className="px-3.5 py-2 bg-white hover:bg-cream-50 text-ink border border-[#88713C]/20 rounded-xl text-xs font-semibold shadow-sm transition-all text-left flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#88713C]" />
            <span>{q}</span>
          </button>
        ))}
      </div>

      {/* ── Input Box ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] p-4 shadow-card border border-[#88713C]/15">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk(query)}
            placeholder={`Ask about ${activeWellInfo.well_name}, offset DDRs, stuck pipe mitigation, or formation tops...`}
            className="flex-1 bg-cream-50 border border-[#88713C]/25 rounded-xl px-4 py-3 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand-brown focus:bg-white transition-all"
          />
          <button
            onClick={() => handleAsk(query)}
            disabled={loading || !query.trim()}
            className="px-5 py-3 bg-[#88713C] hover:bg-[#685429] disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Ask</span>
          </button>
        </div>
      </div>

      {/* ── Conversation Stream ────────────────────────────────────────────── */}
      <div className="space-y-4">
        {conversation.map((item, i) => (
          <div key={i} className="space-y-3">
            {/* User Query Bubble */}
            <div className="flex justify-end">
              <div className="bg-[#88713C] text-white rounded-2xl px-5 py-3 text-xs font-medium max-w-2xl shadow-sm">
                {item.query}
              </div>
            </div>

            {/* AI Assistant Answer Card */}
            <div className="bg-white rounded-[20px] p-6 shadow-card border border-[#88713C]/15 space-y-4 text-ink">
              <div className="flex items-center justify-between pb-3 border-b border-[#88713C]/10 text-xs">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-700" />
                  <span className="font-bold text-ink">DrillIntel RAG Engine</span>
                  <span className="text-[10px] font-mono text-ink-muted">
                    Confidence: {item.confidence_level}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-ink-muted">
                  Well: {item.active_well_id} @ {item.depth_context?.toFixed(0)}m
                </span>
              </div>

              <div className="text-xs text-ink leading-relaxed">
                {item.interpretation}
              </div>

              {/* Supporting Evidence Sources */}
              {item.retrieved_evidence && item.retrieved_evidence.length > 0 && (
                <div className="pt-3 border-t border-[#88713C]/10 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                    Supporting Documentary Provenance:
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {item.retrieved_evidence.map((src: RAGEvidenceItem, srcIdx: number) => (
                      <div
                        key={srcIdx}
                        className="p-3 bg-cream-50 border-l-4 border-[#88713C] rounded-r-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-ink">
                            {src.document_title} (Page {src.page_number})
                          </div>
                          <div className="text-[11px] text-ink-muted italic">
                            "{src.snippet}"
                          </div>
                        </div>

                        <button
                          onClick={() => openDocumentViewer(src.document_id, src.page_number)}
                          className="px-3 py-1.5 bg-white hover:bg-cream-100 border border-[#88713C]/30 text-brand-brown font-bold rounded-lg text-xs shadow-sm flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <span>View Doc</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIAssistant;
