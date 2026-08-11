export default function LoadingSkeleton({ count = 4 }) {
  return <div className="pp-skeleton-list" aria-label="Loading emails" aria-busy="true">
    {Array.from({ length: count }, (_, index) => <div className="pp-skeleton-card" key={index}><i /><div><b /><span /><em /></div><small /></div>)}
  </div>;
}
