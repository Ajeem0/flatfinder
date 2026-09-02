import { useEffect, type ElementType, type HTMLAttributes, type ReactNode } from "react";

export function useScrollReveal() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll("[data-reveal]"));

    if (!elements.length) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const target = entry.target as HTMLElement;
          const delay = Number(target.dataset.delay ?? "0");

          window.setTimeout(() => {
            target.classList.add("is-visible");
          }, delay);

          observer.unobserve(target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);
}

interface RevealProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  delay?: number;
  children: ReactNode;
}

export function Reveal({
  as: Component = "div",
  delay = 0,
  className = "",
  children,
  ...props
}: RevealProps) {
  return (
    <Component
      data-reveal
      data-delay={delay}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}
