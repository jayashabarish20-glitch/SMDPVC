import { useEffect, useRef, useState } from "react";

export function useInView(options: IntersectionObserverInit = { threshold: 0.15 }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(element);
      }
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isInView };
}

export function AnimatedNumber({ value }: { value: string }) {
  const { ref, isInView } = useInView({ threshold: 0.2 });
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (!isInView) return;

    // Extract purely numeric digits and suffixes (e.g. "147+", "2,400+", "98%", "68 Yrs")
    const match = value.match(/([\d,]+)/);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const numericString = match[1].replace(/,/g, "");
    const targetNumber = parseInt(numericString, 10);
    const suffix = value.replace(match[1], "");

    const duration = 1600;
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apple-like easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentVal = Math.floor(ease * targetNumber);

      const formatted = targetNumber > 999 
        ? currentVal.toLocaleString() 
        : currentVal.toString();

      setDisplayValue(formatted + suffix);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [isInView, value]);

  return <span ref={ref}>{displayValue}</span>;
}

