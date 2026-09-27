import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Shield, User, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('driller_piter');
  const [password, setPassword] = useState('nwis2026');
  const [loading, setLoading] = useState(false);

  const personas = [
    { role: 'Drilling Engineer', user: 'driller_piter', desc: 'Active rig monitoring & alert acknowledgement' },
    { role: 'Drilling Supervisor', user: 'sup_barua', desc: 'Situation awareness & operational decision reviews' },
    { role: 'Geologist', user: 'geo_gogoi', desc: 'Formation correlation & stratigraphy evaluation' },
    { role: 'Mud Engineer', user: 'mud_borkotoky', desc: 'Rheology, loss mitigation, and ECD tracking' },
    { role: 'Administrator', user: 'admin', desc: 'System governance, data sources & model registry' },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/');
    }, 400);
  };

  const selectPersona = (user: string) => {
    setUsername(user);
    setPassword('nwis2026');
  };

  return (
    <div className="min-h-screen w-screen bg-[#FBF4E6] flex flex-col justify-center items-center p-6 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#88713C] to-[#54431B] items-center justify-center shadow-lg border border-[#B0975C]/30 mb-2">
            <Flame className="w-8 h-8 text-[#F5D867]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-ink">
            eRTMAC–NWIS
          </h1>
          <div className="text-xs font-bold uppercase tracking-widest text-brand-brown">
            Nearby Wells Intelligence System
          </div>
          <p className="text-xs text-ink-muted">
            Oil India Limited • Problem Statement SIH26121
          </p>
        </div>

        {/* Login Card */}
        <div className="card-surface p-7 space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-xs font-bold text-ink uppercase tracking-wider">
              Operator Authentication
            </span>
            <Badge variant="provenance" provenance="SYNTHETIC" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-ink-muted mb-1">Username / Rig ID</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-brand-brown font-medium"
                  required
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-ink-muted mb-1">Security Credential</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-brand-brown font-medium"
                  required
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-ink hover:bg-ink-light text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Enter Drilling Command Center'}</span>
              <ArrowRight className="w-4 h-4 text-[#F5D867]" />
            </button>
          </form>

          {/* Quick Persona Picker */}
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">
              Quick Select Role Persona (Demo Mode):
            </span>
            <div className="space-y-1.5">
              {personas.map((p) => (
                <button
                  key={p.user}
                  type="button"
                  onClick={() => selectPersona(p.user)}
                  className={`w-full text-left p-2 rounded-lg border text-[11px] transition-all flex items-center justify-between ${
                    username === p.user
                      ? 'bg-[#FAF2DF] border-brand-brown font-bold text-ink'
                      : 'bg-cream-50/70 border-gray-200 text-ink-muted hover:bg-cream-100'
                  }`}
                >
                  <div>
                    <span className="text-ink font-semibold">{p.role}</span>
                    <span className="text-gray-500 ml-1.5 font-mono">({p.user})</span>
                  </div>
                  {username === p.user && <CheckCircle2 className="w-3.5 h-3.5 text-brand-brown" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
