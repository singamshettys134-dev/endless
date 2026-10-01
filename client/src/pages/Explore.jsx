import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { fetchCategories } from '../lib/api.js';
import { ICONS } from '../components/feed/Thumbnail.jsx';
import { CATEGORIES, CATEGORY_COLORS } from '../lib/constants.js';
import PageHeader from '../components/ui/PageHeader.jsx';

export default function Explore() {
  const [data, setData] = useState(null);
  useEffect(() => {
    const ctrl = new AbortController();
    fetchCategories(ctrl.signal).then(setData).catch(() => undefined);
    return () => ctrl.abort();
  }, []);

  const items = data?.categories || CATEGORIES.map((name) => ({ name, color: CATEGORY_COLORS[name], count: null }));
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Explore" subtitle="Browse by category. Each category is its own infinite, auto-loading feed." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((c, i) => {
          const Icon = ICONS[c.name];
          return (
            <Link
              key={c.name}
              to={`/category/${c.name}`}
              className="group relative animate-fade-up overflow-hidden rounded-2xl border border-fg/10 p-5 transition hover:-translate-y-0.5 hover:border-fg/25"
              style={{ background: `linear-gradient(145deg, ${c.color}33, var(--color-panel) 65%)`, animationDelay: `${i * 30}ms` }}
            >
              <Icon className="h-8 w-8" style={{ color: c.color }} strokeWidth={1.7} />
              <p className="mt-10 text-xl font-bold">{c.name}</p>
              <p className="mt-1 text-sm text-zinc-400">{c.count != null ? `${c.count.toLocaleString()} videos` : '…'}</p>
              <ArrowUpRight className="absolute right-4 top-4 h-5 w-5 text-zinc-600 transition group-hover:text-fg" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
