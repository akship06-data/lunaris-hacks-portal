import React, { useEffect, useState } from "react";
import { Upload, Users, DollarSign, Building2, CheckCircle2, Plus } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Metrics {
  total_sponsors: number;
  committed_funding_cad: number;
  total_pipeline_cad: number;
  total_teams: number;
  total_participants: number;
}

interface Sponsor {
  id: number;
  company_name: string;
  contact_name: string;
  contact_email: string;
  tier: string;
  pledged_amount: number;
  status: string;
}

interface Team {
  id: number;
  team_name: string;
  project_track: string;
  member_count: number;
  lead_email: string;
  university: string;
}

export default function App() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [uploadMsg, setUploadMsg] = useState("");
  const [teamForm, setTeamForm] = useState({
    team_name: "",
    project_track: "AI/ML",
    member_count: 4,
    lead_email: "",
  });

  const fetchAll = async () => {
    const [mRes, sRes, tRes] = await Promise.all([
      fetch(`${API_BASE}/api/dashboard/metrics`),
      fetch(`${API_BASE}/api/sponsors?status=${statusFilter}`),
      fetch(`${API_BASE}/api/teams`),
    ]);
    setMetrics(await mRes.json());
    setSponsors(await sRes.json());
    setTeams(await tRes.json());
  };

  useEffect(() => {
    fetchAll();
  }, [statusFilter]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    await fetch(`${API_BASE}/api/sponsors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchAll();
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/api/sponsors/ingest-csv`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (res.ok) {
      setUploadMsg(`Ingested ${data.inserted} new sponsors (${data.duplicates_skipped} duplicates skipped).`);
      fetchAll();
    } else {
      setUploadMsg(`Error: ${data.detail}`);
    }
  };

  const handleRegisterTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(teamForm),
    });
    if (res.ok) {
      setTeamForm({ team_name: "", project_track: "AI/ML", member_count: 4, lead_email: "" });
      fetchAll();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-indigo-400">Lunaris Hacks Portal</h1>
            <p className="text-slate-400 text-sm mt-1">
              Sponsor CRM, Automated CSV Ingestion Pipeline & Hackathon Team Registration
            </p>
          </div>
          <label className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition">
            <Upload className="w-4 h-4" />
            Import Sponsor CSV
            <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
          </label>
        </header>

        {uploadMsg && (
          <div className="bg-emerald-950/60 border border-emerald-700 text-emerald-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {uploadMsg}
          </div>
        )}

        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-sm">
                <span>Committed Funding</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold mt-2">${metrics.committed_funding_cad.toLocaleString()} CAD</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-sm">
                <span>Corporate Sponsors</span>
                <Building2 className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-bold mt-2">{metrics.total_sponsors}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-sm">
                <span>Registered Teams</span>
                <Users className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-bold mt-2">{metrics.total_teams}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-sm">
                <span>Total Hackers</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold mt-2">{metrics.total_participants}</p>
            </div>
          </div>
        )}

        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Corporate Sponsor Pipeline</h2>
            <div className="flex gap-2">
              {["All", "Prospect", "Contacted", "Committed", "Paid"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                    statusFilter === st ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3">Company</th>
                  <th className="py-3">Contact</th>
                  <th className="py-3">Tier</th>
                  <th className="py-3">Pledged (CAD)</th>
                  <th className="py-3">Pipeline Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sponsors.map((sp) => (
                  <tr key={sp.id}>
                    <td className="py-3 font-medium">{sp.company_name}</td>
                    <td className="py-3 text-slate-400">{sp.contact_email}</td>
                    <td className="py-3">{sp.tier}</td>
                    <td className="py-3 font-mono">${sp.pledged_amount.toLocaleString()}</td>
                    <td className="py-3">
                      <select
                        value={sp.status}
                        onChange={(e) => handleStatusChange(sp.id, e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs"
                      >
                        {["Prospect", "Contacted", "Committed", "Paid"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleRegisterTeam} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" /> Register Hackathon Team
            </h2>
            <input
              required
              placeholder="Team Name"
              value={teamForm.team_name}
              onChange={(e) => setTeamForm({ ...teamForm, team_name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={teamForm.project_track}
              onChange={(e) => setTeamForm({ ...teamForm, project_track: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value="AI/ML">AI / Machine Learning</option>
              <option value="FinTech">FinTech & Commerce</option>
              <option value="Hardware">Hardware & Embedded</option>
              <option value="Sustainability">Sustainability</option>
            </select>
            <input
              required
              type="email"
              placeholder="Team Lead Email (@torontomu.ca)"
              value={teamForm.lead_email}
              onChange={(e) => setTeamForm({ ...teamForm, lead_email: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 py-2 rounded-lg text-sm font-medium transition"
            >
              Submit Registration
            </button>
          </form>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Registered Teams ({teams.length})</h2>
            <div className="space-y-2.5">
              {teams.map((t) => (
                <div key={t.id} className="flex items-center justify-between bg-slate-800/60 px-4 py-3 rounded-lg text-sm">
                  <div>
                    <p className="font-medium">{t.team_name}</p>
                    <p className="text-xs text-slate-400">{t.lead_email} • {t.member_count} members</p>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full text-xs">
                    {t.project_track}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
