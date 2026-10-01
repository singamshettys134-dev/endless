import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-32 text-center">
      <p className="text-6xl font-black text-zinc-700">404</p>
      <p className="mt-3 text-zinc-400">That page doesn't exist.</p>
      <Link to="/" className="mt-6 inline-block rounded-full bg-fg px-5 py-2 text-sm font-semibold text-ink">Back home</Link>
    </div>
  );
}
