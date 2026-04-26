"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";

interface AlertRule {
  id: string;
  name: string;
  type: string;
  condition_json: string;
  webhook_url: string;
  enabled: number;
  last_fired_at: number | null;
}

function getProjectId() {
  return document.cookie.match(/ob_project=([^;]+)/)?.[1] ?? "demo";
}

export default function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [evaluating, setEvaluating] = useState(false);
  const [evalResults, setEvalResults] = useState<{ rule: string; value: number; fired: boolean }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "log_error_rate",
    metric: "",
    operator: ">=",
    threshold: "5",
    window: "5",
    webhookUrl: "",
  });

  async function load() {
    const projectId = getProjectId();
    const res = await fetch(`/api/alerts?projectId=${projectId}`);
    if (res.ok) setRules(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const projectId = getProjectId();
    await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        name: form.name,
        type: form.type,
        condition: {
          operator: form.operator,
          threshold: Number(form.threshold),
          window_minutes: Number(form.window),
          ...(form.type === "metric_threshold" ? { metric: form.metric } : {}),
        },
        webhookUrl: form.webhookUrl,
      }),
    });
    setShowForm(false);
    await load();
  }

  async function remove(id: string) {
    await fetch("/api/alerts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, projectId: getProjectId() }),
    });
    await load();
  }

  async function evaluate() {
    setEvaluating(true);
    const res = await fetch("/api/alerts/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: getProjectId() }),
    });
    const data = await res.json();
    setEvalResults(data.results ?? []);
    setEvaluating(false);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-100">Alerts</h1>
        <div className="flex gap-2">
          <button
            onClick={evaluate} disabled={evaluating}
            className="text-xs px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-md transition-colors disabled:opacity-50"
          >
            {evaluating ? "Evaluating…" : "Evaluate Now"}
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-xs px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-md transition-colors"
          >
            + New Rule
          </button>
        </div>
      </div>

      {/* Evaluation results */}
      {evalResults.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
          <p className="text-xs uppercase text-gray-500 tracking-wider mb-3">Last Evaluation</p>
          {evalResults.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-300">{r.rule}</span>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-xs">{r.value.toFixed(2)}</span>
                <span className={clsx("text-xs px-2 py-0.5 rounded-full", r.fired ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400")}>
                  {r.fired ? "FIRED" : "OK"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New rule form */}
      {showForm && (
        <form onSubmit={create} className="bg-gray-900 border border-brand-500/30 rounded-xl p-5 space-y-4">
          <p className="text-sm font-medium text-gray-200">New Alert Rule</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-gray-400">Rule name</label>
              <input
                required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Type</label>
              <select
                value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="log_error_rate">Log error rate (%)</option>
                <option value="metric_threshold">Metric threshold</option>
              </select>
            </div>
            {form.type === "metric_threshold" && (
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Metric name</label>
                <input
                  required value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })}
                  placeholder="e.g. http.latency_ms"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Operator</label>
              <select
                value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value=">=">&gt;=</option>
                <option value=">">&gt;</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Threshold</label>
              <input
                type="number" required value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Window (minutes)</label>
              <input
                type="number" required value={form.window} onChange={(e) => setForm({ ...form, window: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-gray-400">Webhook URL</label>
              <input
                type="url" required value={form.webhookUrl} onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
                placeholder="https://hooks.slack.com/…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 text-gray-400 hover:text-gray-200 transition-colors">Cancel</button>
            <button type="submit" className="text-xs px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-md transition-colors">Save Rule</button>
          </div>
        </form>
      )}

      {/* Rules list */}
      <div className="space-y-3">
        {rules.length === 0 && !showForm && (
          <p className="text-sm text-gray-600 py-8 text-center">No alert rules yet. Create one to get notified on incidents.</p>
        )}
        {rules.map((r) => {
          const cond = JSON.parse(r.condition_json);
          return (
            <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-gray-100">{r.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {r.type === "log_error_rate" ? "Error rate" : `Metric: ${cond.metric}`}
                  {" "}{cond.operator} {cond.threshold} · last {cond.window_minutes}min
                </p>
                {r.last_fired_at && (
                  <p className="text-xs text-red-400 mt-0.5">
                    Last fired: {new Date(r.last_fired_at * 1000).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => remove(r.id)}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
