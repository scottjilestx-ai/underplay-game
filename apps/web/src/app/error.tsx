"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen table-bg flex items-center justify-center p-6">
      <div className="text-center max-w-md rounded-2xl bg-black/50 border border-amber-500/30 p-8">
        <h1 className="font-serif text-2xl text-amber-100 mb-2">Something went wrong</h1>
        <p className="text-amber-200/70 text-sm mb-6">
          The page failed to load — often fixed by refreshing or restarting the dev server.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="px-6 py-2 rounded-xl bg-amber-500 text-black font-semibold"
        >
          Try again
        </button>
      </div>
    </div>
  );
}