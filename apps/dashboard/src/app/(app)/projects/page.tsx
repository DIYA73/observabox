"use client";

import { useState, useEffect } from "react";

interface Project { id: string; name: string; api_key: string; created_at: number; }

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  async function load() {
    const res = await fetch("/api/projects");
    setProjects(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    setNewName("");
    await load();
    setCreating(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this project? All data in ClickHouse is kept but the API key is revoked.")) return;
    await fetch("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  function switchProject(id: string) {
    document.cookie = `ob_project=${id}; path=/; max-age=${60 * 60 * 24 * 7}`;
    window.location.href = "/";
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-100">Projects</h1>

      <form onSubmit={create} className="flex gap-3">
        <input
          type="text" placeholder="New project name" value={newName}
          onChange={(e) => setNewName(e.target.value)} required
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit" disabled={creating}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create"}
        </button>
      </form>

      <div className="space-y-3">
        {projects.map((p) => (
          <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-100">{p.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">ID: {p.id}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => switchProject(p.id)}
                  className="text-xs px-3 py-1.5 bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 rounded-md transition-colors"
                >
                  Switch to
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">API Key</p>
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                <code className="flex-1 text-xs text-gray-300 font-mono">
                  {revealed.has(p.id) ? p.api_key : "obs_••••••••••••••••••••••••"}
                </code>
                <button
                  onClick={() => setRevealed((s) => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {revealed.has(p.id) ? "Hide" : "Reveal"}
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(p.api_key)}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
