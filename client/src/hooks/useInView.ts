import { useRef, useState } from "react";

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useInView(_options: UseInViewOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  // Always return true - content is always visible
  // Animations are purely decorative enhancement
  const [isInView] = useState(true);

  return { ref, isInView };
}
