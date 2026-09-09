"use client";

import { useEffect, useRef } from "react";

interface InteractiveDotGridProps {
  gridSpacing?: number;
  baseRadius?: number;
  maxRadius?: number;
  interactionRadius?: number;
  className?: string;
}

interface Dot {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function InteractiveDotGrid({
  gridSpacing = 24,
  baseRadius = 1.2,
  maxRadius = 2.6,
  interactionRadius = 175,
  className = "",
}: InteractiveDotGridProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dots: Dot[] = [];

    const mouse = {
      x: -9999,
      y: -9999,
      prevX: -9999,
      prevY: -9999,
      vx: 0,
      vy: 0,
      active: false,
    };

    const initDots = () => {
      dots = [];
      const cols = Math.ceil(width / gridSpacing) + 3;
      const rows = Math.ceil(height / gridSpacing) + 3;
      const offsetX = (width - (cols - 1) * gridSpacing) / 2;
      const offsetY = (height - (rows - 1) * gridSpacing) / 2;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const bx = offsetX + c * gridSpacing;
          const by = offsetY + r * gridSpacing;
          dots.push({
            baseX: bx,
            baseY: by,
            x: bx,
            y: by,
            vx: 0,
            vy: 0,
          });
        }
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      const parent = canvas.parentElement;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = Math.max(rect.width, parent?.clientWidth || window.innerWidth);
      height = Math.max(rect.height, parent?.clientHeight || window.innerHeight, parent?.scrollHeight || 0);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initDots();
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      if (mouse.prevX === -9999) {
        mouse.prevX = currentX;
        mouse.prevY = currentY;
      } else {
        const rawVx = (currentX - mouse.prevX);
        const rawVy = (currentY - mouse.prevY);
        // Clamp velocity to avoid extreme jumps
        const clampedVx = Math.max(-45, Math.min(45, rawVx));
        const clampedVy = Math.max(-45, Math.min(45, rawVy));
        mouse.vx = clampedVx * 0.75 + mouse.vx * 0.25;
        mouse.vy = clampedVy * 0.75 + mouse.vy * 0.25;
        mouse.prevX = currentX;
        mouse.prevY = currentY;
      }

      mouse.x = currentX;
      mouse.y = currentY;
      mouse.active = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      const rect = canvas.getBoundingClientRect();
      const currentX = e.touches[0].clientX - rect.left;
      const currentY = e.touches[0].clientY - rect.top;

      if (mouse.prevX === -9999) {
        mouse.prevX = currentX;
        mouse.prevY = currentY;
      } else {
        const rawVx = (currentX - mouse.prevX);
        const rawVy = (currentY - mouse.prevY);
        const clampedVx = Math.max(-40, Math.min(40, rawVx));
        const clampedVy = Math.max(-40, Math.min(40, rawVy));
        mouse.vx = clampedVx * 0.75 + mouse.vx * 0.25;
        mouse.vy = clampedVy * 0.75 + mouse.vy * 0.25;
        mouse.prevX = currentX;
        mouse.prevY = currentY;
      }

      mouse.x = currentX;
      mouse.y = currentY;
      mouse.active = true;
    };

    const onMouseLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
      mouse.prevX = -9999;
      mouse.prevY = -9999;
      mouse.vx = 0;
      mouse.vy = 0;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("touchend", onMouseLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const time = performance.now() * 0.0014;

      // Gradually damp mouse velocity
      mouse.vx *= 0.88;
      mouse.vy *= 0.88;

      const activeDots: { x: number; y: number; r: number; alpha: number; isWarm: boolean }[] = [];

      // Passive dot batch
      ctx.beginPath();
      ctx.fillStyle = "rgba(161, 64, 0, 0.32)";

      const count = dots.length;
      const radiusSq = interactionRadius * interactionRadius;

      for (let i = 0; i < count; i++) {
        const dot = dots[i];

        // Subtle ambient flowing wave so the field feels organic and alive
        const waveX = Math.sin(time + dot.baseY * 0.03 + dot.baseX * 0.015) * 1.5;
        const waveY = Math.cos(time + dot.baseX * 0.03 + dot.baseY * 0.015) * 1.5;
        const targetX = dot.baseX + waveX;
        const targetY = dot.baseY + waveY;

        let force = 0;
        if (mouse.active) {
          const dx = dot.x - mouse.x;
          const dy = dot.y - mouse.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < radiusSq) {
            const dist = Math.sqrt(distSq);
            force = 1 - dist / interactionRadius;

            // 1. Fluid drag with cursor movement (directional flow)
            dot.vx += mouse.vx * force * 0.36;
            dot.vy += mouse.vy * force * 0.36;

            // 2. Elastic wake repulsion
            const push = force * force * 5.0;
            const angle = Math.atan2(dy, dx);
            dot.vx += Math.cos(angle) * push;
            dot.vy += Math.sin(angle) * push;
          }
        }

        // Return to anchor point with spring physics & damping
        dot.vx += (targetX - dot.x) * 0.078;
        dot.vy += (targetY - dot.y) * 0.078;
        dot.vx *= 0.88;
        dot.vy *= 0.88;
        dot.x += dot.vx;
        dot.y += dot.vy;

        // Visual distinction
        const speed = Math.abs(dot.vx) + Math.abs(dot.vy);
        if (force > 0.04 || speed > 0.35) {
          const intensity = Math.min(1, force * 1.2 + speed * 0.14);
          activeDots.push({
            x: dot.x,
            y: dot.y,
            r: baseRadius + (maxRadius - baseRadius) * intensity,
            alpha: 0.38 + intensity * 0.52,
            isWarm: intensity > 0.25,
          });
        } else {
          ctx.moveTo(dot.x + baseRadius, dot.y);
          ctx.arc(dot.x, dot.y, baseRadius, 0, Math.PI * 2);
        }
      }

      // Draw all passive dots in 1 single draw call
      ctx.fill();

      // Draw active flowing dots with warm glowing palette
      for (let j = 0; j < activeDots.length; j++) {
        const ad = activeDots[j];
        ctx.beginPath();
        ctx.fillStyle = ad.isWarm
          ? `rgba(245, 117, 28, ${ad.alpha})` // Flame Orange
          : `rgba(25, 57, 70, ${ad.alpha})`;  // Slate / Navy
        ctx.arc(ad.x, ad.y, ad.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("touchend", onMouseLeave);
    };
  }, [gridSpacing, baseRadius, maxRadius, interactionRadius]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 ${className}`}
    />
  );
}
