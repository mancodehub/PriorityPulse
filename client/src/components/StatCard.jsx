import { ArrowUpRight } from 'lucide-react';
export default function StatCard({ label, value, note, accent = '' }) { return <article className={`pp-stat-card ${accent}`}><div><span>{label}</span><strong>{value}</strong></div><ArrowUpRight size={16} /><small>{note}</small></article>; }
