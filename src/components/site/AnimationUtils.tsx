import React, { useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export type AnimationType = "fade-up" | "fade" | "scale-up" | "slide-left" | "slide-right";

interface RevealOnScrollProps {
  children: ReactNode;
  animation?: AnimationType;
  delayMs?: number;
  durationMs?: number;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  as?: React.ElementType;
}

export function RevealOnScroll({
  children,
  animation = "fade-up",
  delayMs = 0,
  durationMs = 500,
  className = "",
  threshold = 0.1,
  rootMargin = "0px 0px -40px 0px",
  as: Component = "div",
}: RevealOnScrollProps) {
  const { ref, isVisible } = useScrollReveal<HTMLElement>({ threshold, rootMargin });

  const getAnimationStyles = (): React.CSSProperties => {
    return {
      transitionProperty: "opacity, transform",
      transitionDuration: `${durationMs}ms`,
      transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      transitionDelay: `${delayMs}ms`,
      willChange: isVisible ? "auto" : "opacity, transform",
    };
  };

  const getTransformClass = () => {
    if (isVisible) {
      return "opacity-100 translate-y-0 translate-x-0 scale-100";
    }

    switch (animation) {
      case "fade-up":
        return "opacity-0 translate-y-7";
      case "scale-up":
        return "opacity-0 scale-[0.96] translate-y-4";
      case "slide-left":
        return "opacity-0 translate-x-8";
      case "slide-right":
        return "opacity-0 -translate-x-8";
      case "fade":
      default:
        return "opacity-0";
    }
  };

  return (
    <Component
      ref={ref}
      style={getAnimationStyles()}
      className={`${getTransformClass()} ${className}`}
    >
      {children}
    </Component>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  staggerIntervalMs?: number;
  baseDelayMs?: number;
  className?: string;
  animation?: AnimationType;
  threshold?: number;
}

export function StaggerContainer({
  children,
  staggerIntervalMs = 70,
  baseDelayMs = 0,
  className = "",
  animation = "fade-up",
  threshold = 0.1,
}: StaggerContainerProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({ threshold });

  const childArray = React.Children.toArray(children);

  return (
    <div ref={ref} className={className}>
      {childArray.map((child, index) => {
        const delay = baseDelayMs + index * staggerIntervalMs;
        const transformClass = isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : animation === "scale-up"
            ? "opacity-0 scale-[0.96] translate-y-3"
            : "opacity-0 translate-y-6";

        return (
          <div
            key={index}
            style={{
              transitionProperty: "opacity, transform",
              transitionDuration: "450ms",
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDelay: `${delay}ms`,
              willChange: isVisible ? "auto" : "opacity, transform",
            }}
            className={transformClass}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Route / Page transition wrapper for smooth navigation without layout jank
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(false);
    const timer = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => cancelAnimationFrame(timer);
  }, [pathname]);

  return (
    <div
      key={pathname}
      className={`page-transition-wrapper ${
        isMounted ? "page-transition-enter-active" : "page-transition-enter"
      }`}
    >
      {children}
    </div>
  );
}
