"use client";

import React, { useEffect, useRef } from "react";
import { StreakTier } from "@/types";

interface ElementalCanvasProps {
  tier: StreakTier;
  isCompletedToday: boolean;
  isFlaring?: boolean;
  isFizzling?: boolean;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  angle?: number;
  angularVelocity?: number;
  radius?: number;
  type?: "flame" | "plasma" | "solar" | "vortex" | "singularity" | "flare" | "ash";
}

export const ElementalCanvas: React.FC<ElementalCanvasProps> = ({
  tier,
  isCompletedToday,
  isFlaring = false,
  isFizzling = false,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const particles = useRef<Particle[]>([]);
  const flashAlpha = useRef<number>(0);

  // Trigger burst when isFlaring starts
  useEffect(() => {
    if (isFlaring) {
      flashAlpha.current = 0.85;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Burst 60 explosive radial vectors
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 8;
        const colors = ["#ffffff", "#00f0ff", "#ffbe0b", "#fb5607", "#ff006e"];
        particles.current.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          life: 0,
          maxLife: 40 + Math.random() * 30,
          type: "flare",
        });
      }
    }
  }, [isFlaring]);

  // Trigger ash dispersion when isFizzling starts
  useEffect(() => {
    if (isFizzling) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;

      // Spawn 50 gray dispersing ash particles
      for (let i = 0; i < 50; i++) {
        particles.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 0.5 + Math.random() * 1.5,
          size: 2 + Math.random() * 3.5,
          color: Math.random() > 0.5 ? "#475569" : "#64748b",
          alpha: 0.9,
          life: 0,
          maxLife: 50 + Math.random() * 40,
          type: "ash",
        });
      }
    }
  }, [isFizzling]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    // Tier-specific particle limits and spawning
    const getSpawnRateAndCap = () => {
      if (isFizzling) return { cap: 80, rate: 0.1 };
      switch (tier) {
        case "tier1":
          return { cap: 24, rate: 0.3 };
        case "tier2":
          return { cap: 48, rate: 0.6 };
        case "tier3":
          return { cap: 75, rate: 0.9 };
        case "tier4":
          return { cap: 110, rate: 1.4 };
        case "tier5":
          return { cap: 160, rate: 2.0 };
        default:
          return { cap: 8, rate: 0.08 }; // Tier 0 dormant
      }
    };

    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // Flash background on flare-up completion
      if (flashAlpha.current > 0.01) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha.current * 0.35})`;
        ctx.fillRect(0, 0, width, height);
        flashAlpha.current *= 0.88;
      }

      const { cap, rate } = getSpawnRateAndCap();

      // Ambient Background Glow per Tier
      if (tier !== "tier0") {
        const glowGrad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          10,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.7
        );

        if (tier === "tier1") {
          glowGrad.addColorStop(0, "rgba(56, 189, 248, 0.08)");
          glowGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
        } else if (tier === "tier2") {
          glowGrad.addColorStop(0, "rgba(0, 240, 255, 0.09)");
          glowGrad.addColorStop(0.5, "rgba(255, 94, 0, 0.06)");
          glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        } else if (tier === "tier3") {
          const pulse = 0.12 + Math.sin(tick * 0.05) * 0.03;
          glowGrad.addColorStop(0, `rgba(254, 240, 138, ${pulse})`);
          glowGrad.addColorStop(0.5, `rgba(245, 158, 11, ${pulse * 0.7})`);
          glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        } else if (tier === "tier4") {
          glowGrad.addColorStop(0, "rgba(192, 132, 252, 0.14)");
          glowGrad.addColorStop(0.4, "rgba(6, 182, 212, 0.08)");
          glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        } else if (tier === "tier5") {
          const singularityPulse = 0.18 + Math.sin(tick * 0.06) * 0.06;
          glowGrad.addColorStop(0, `rgba(236, 72, 153, ${singularityPulse})`);
          glowGrad.addColorStop(0.3, `rgba(139, 92, 246, ${singularityPulse * 0.8})`);
          glowGrad.addColorStop(0.7, `rgba(6, 182, 212, ${singularityPulse * 0.4})`);
          glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        }

        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Tier 3: Radiant Solar Rays emanating from right corner or center
      if (tier === "tier3" && width > 0) {
        ctx.save();
        ctx.translate(width - 40, 40);
        ctx.rotate(tick * 0.008);
        const rayCount = 8;
        for (let r = 0; r < rayCount; r++) {
          ctx.rotate((Math.PI * 2) / rayCount);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(80, -10);
          ctx.lineTo(80, 10);
          ctx.closePath();
          ctx.fillStyle = "rgba(251, 191, 36, 0.04)";
          ctx.fill();
        }
        ctx.restore();
      }

      // Tier 5: Pulsing Singularity Accretion Horizon in top corner
      if (tier === "tier5" && width > 0) {
        const horizonX = width - 50;
        const horizonY = 50;
        const horizonRadius = 22 + Math.sin(tick * 0.08) * 3;

        // Chromatic distortion ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(horizonX, horizonY, horizonRadius + 10, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(236, 72, 153, 0.3)";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(horizonX, horizonY, horizonRadius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Singularity Black Hole Void
        ctx.beginPath();
        ctx.arc(horizonX, horizonY, horizonRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#030408";
        ctx.fill();
        ctx.restore();
      }

      // Spawn new particles according to rate & cap
      if (particles.current.length < cap && Math.random() < rate && width > 0) {
        if (tier === "tier1") {
          // Subtle blue flame rising upward from bottom
          particles.current.push({
            x: Math.random() * width,
            y: height + 5,
            vx: (Math.random() - 0.5) * 0.6,
            vy: -0.8 - Math.random() * 1.2,
            size: 1.5 + Math.random() * 2.5,
            color: Math.random() > 0.4 ? "#38bdf8" : "#7dd3fc",
            alpha: 0.6 + Math.random() * 0.4,
            life: 0,
            maxLife: 60 + Math.random() * 40,
            type: "flame",
          });
        } else if (tier === "tier2") {
          // Dual-tone Cyan & Fiery Orange plasma particles
          const isCyan = Math.random() > 0.5;
          particles.current.push({
            x: Math.random() * width,
            y: height * (0.3 + Math.random() * 0.7),
            vx: (Math.random() - 0.5) * 1.5,
            vy: -1.0 - Math.random() * 1.5,
            size: 2.0 + Math.random() * 3.0,
            color: isCyan ? "#00f0ff" : "#ff5e00",
            alpha: 0.7 + Math.random() * 0.3,
            life: 0,
            maxLife: 50 + Math.random() * 35,
            type: "plasma",
          });
        } else if (tier === "tier3") {
          // Solar corona radiant particles
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.2 + Math.random() * 2.2;
          particles.current.push({
            x: width - 40 + (Math.random() - 0.5) * 20,
            y: 40 + (Math.random() - 0.5) * 20,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2.2 + Math.random() * 3.2,
            color: ["#ffffff", "#fef08a", "#fbbf24", "#f59e0b"][Math.floor(Math.random() * 4)],
            alpha: 0.8 + Math.random() * 0.2,
            life: 0,
            maxLife: 45 + Math.random() * 30,
            type: "solar",
          });
        } else if (tier === "tier4") {
          // Cosmic vortex orbiting particles
          const angle = Math.random() * Math.PI * 2;
          const radius = 30 + Math.random() * (Math.min(width, height) * 0.45);
          particles.current.push({
            x: width / 2 + Math.cos(angle) * radius,
            y: height / 2 + Math.sin(angle) * radius,
            vx: 0,
            vy: 0,
            angle,
            radius,
            angularVelocity: 0.025 + (Math.random() * 0.02) / (radius * 0.05),
            size: 2.0 + Math.random() * 3.5,
            color: ["#c084fc", "#a855f7", "#06b6d4", "#ec4899"][Math.floor(Math.random() * 4)],
            alpha: 0.75 + Math.random() * 0.25,
            life: 0,
            maxLife: 70 + Math.random() * 50,
            type: "vortex",
          });
        } else if (tier === "tier5") {
          // Supernova / Singularity hyper-speed trails & prismatic shimmer
          const angle = Math.random() * Math.PI * 2;
          const speed = 2.5 + Math.random() * 4.5;
          particles.current.push({
            x: width - 50,
            y: 50,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2.5 + Math.random() * 4.0,
            color: ["#ffffff", "#ec4899", "#8b5cf6", "#06b6d4", "#f43f5e", "#fbbf24"][
              Math.floor(Math.random() * 6)
            ],
            alpha: 0.9,
            life: 0,
            maxLife: 40 + Math.random() * 30,
            type: "singularity",
          });
        } else {
          // Tier 0: Dormant gentle gray/blue ash wisp
          particles.current.push({
            x: Math.random() * width,
            y: height - 10,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -0.3 - Math.random() * 0.4,
            size: 1.2 + Math.random() * 1.5,
            color: "#475569",
            alpha: 0.3,
            life: 0,
            maxLife: 80,
            type: "ash",
          });
        }
      }

      // Render and update existing particles using lighter composite for neon glow
      ctx.save();
      ctx.globalCompositeOperation = tier === "tier0" || isFizzling ? "source-over" : "lighter";

      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.life++;

        // Calculate fading alpha
        const progress = p.life / p.maxLife;
        const currentAlpha = p.alpha * (1 - progress);

        if (p.type === "vortex" && p.angle !== undefined && p.radius !== undefined) {
          // Orbiting vortex mechanics
          p.angle += p.angularVelocity || 0.03;
          p.radius *= 0.995; // slowly spiral inward
          p.x = width / 2 + Math.cos(p.angle) * p.radius;
          p.y = height / 2 + Math.sin(p.angle) * p.radius;
        } else {
          // Standard motion
          p.x += p.vx;
          p.y += p.vy;
          if (p.type === "flame" || p.type === "plasma") {
            p.vx += (Math.random() - 0.5) * 0.2; // slight turbulence
          }
        }

        // Draw particle with glow halo
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size * (1 - progress * 0.3)), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, currentAlpha);
        ctx.fill();

        // Extra light trail for Tier 5 Singularity
        if (p.type === "singularity" && p.life > 2) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size * 0.7;
          ctx.stroke();
        }

        // Remove dead particles or out of bounds
        if (
          p.life >= p.maxLife ||
          p.x < -30 ||
          p.x > width + 30 ||
          p.y < -30 ||
          p.y > height + 30
        ) {
          particles.current.splice(i, 1);
        }
      }

      ctx.restore();
      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      resizeObserver.disconnect();
    };
  }, [tier, isCompletedToday, isFizzling]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full rounded-2xl ${className}`}
    />
  );
};
