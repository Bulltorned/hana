"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export function RouteProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPathname = useRef(pathname);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // Route changed — start progress
      prevPathname.current = pathname;
      setVisible(true);
      setProgress(0);

      // Quick ramp to 70%
      requestAnimationFrame(() => setProgress(70));

      // Then to 90%
      timerRef.current = setTimeout(() => setProgress(90), 150);

      // Complete and hide
      const hideTimer = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 200);
      }, 300);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        clearTimeout(hideTimer);
      };
    }
  }, [pathname]);

  if (!visible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-teal shadow-[0_0_8px_rgba(79,123,247,0.4)]"
        style={{
          width: `${progress}%`,
          transition:
            progress === 0
              ? "none"
              : progress === 100
                ? "width 200ms ease-out, opacity 200ms ease-out"
                : "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
