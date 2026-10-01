import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

function decode(token) {
  try {
    const part = token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(part));
  } catch {
    return null;
  }
}

export default function CursorViewer({ token }) {
  const [copied, setCopied] = useState(false);
  if (!token) return <p className="text-xs text-zinc-600">No cursor yet.</p>;
  const payload = decode(token);
  return (
    <div>
      <div className="flex items-center gap-2 rounded-lg bg-fg/5 p-2.5 font-mono text-[11px] text-zinc-300">
        <span className="min-w-0 flex-1 truncate">{token}</span>
        <button
          aria-label="Copy cursor"
          onClick={() => { navigator.clipboard?.writeText(token); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
          className="shrink-0 text-zinc-500 hover:text-fg"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      {payload && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {Object.entries(payload).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2">
              <dt className="text-zinc-500">{k}</dt>
              <dd className="truncate font-mono text-zinc-200">{k === 'issuedAt' ? new Date(v).toLocaleTimeString() : typeof v === 'number' ? +v.toFixed(3) : String(v)}</dd>
            </div>
          ))}
          <div className="col-span-2 flex justify-between gap-2"><dt className="text-zinc-500">signature</dt><dd className="font-mono text-emerald-400">HMAC-SHA256 ✓</dd></div>
        </dl>
      )}
    </div>
  );
}
