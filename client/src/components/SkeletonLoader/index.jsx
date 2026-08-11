function SkeletonLoader() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((item) => (
        <div key={item} className="animate-pulse rounded-[24px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/70 p-5">
          <div className="h-3 w-24 rounded-full bg-white/10" />
          <div className="mt-4 h-4 w-full rounded-full bg-white/10" />
          <div className="mt-3 h-4 w-3/4 rounded-full bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export default SkeletonLoader;
