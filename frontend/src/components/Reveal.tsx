import { useEffect, type ElementType, type HTMLAttributes, type ReactNode } from "react";

export function useScrollReveal() {
  useEffect(() => {
    let observer: IntersectionObserver | undefined;
    let mutations: MutationObserver | undefined;
    let frame = 0;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      frame = window.requestAnimationFrame(() => {
        document.querySelectorAll("[data-reveal]").forEach((element) => element.classList.add("is-visible"));
      });
      return () => window.cancelAnimationFrame(frame);
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const target = entry.target as HTMLElement;
          const delay = Number(target.dataset.delay ?? "0");

          window.setTimeout(() => {
            target.classList.add("is-visible");
          }, delay);

          observer?.unobserve(target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    const observeElements = (root: ParentNode = document) => {
      root.querySelectorAll("[data-reveal]").forEach((element) => observer?.observe(element));
    };

    frame = window.requestAnimationFrame(() => {
      observeElements();
      mutations = new MutationObserver(() => observeElements());
      mutations.observe(document.body, { childList: true, subtree: true });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      mutations?.disconnect();
      observer?.disconnect();
    };
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
