"use client";

/**
 * Full-viewport scroll root. Required because layout sets body overflow:hidden
 * (game table); min-h pages otherwise clip content with no way to scroll.
 */
export function ScrollPage({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`fixed inset-0 z-0 overflow-y-auto overflow-x-hidden overscroll-y-contain lobby-bg ${className}`}
    >
      {children}
    </div>
  );
}