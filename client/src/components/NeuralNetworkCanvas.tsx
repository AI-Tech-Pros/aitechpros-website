/*
 * NeuralNetworkCanvas — GPU-accelerated animated neural network overlay
 * 
 * Effects:
 *   1. "Flow" — data pulses travel along connecting lines with gradient trails
 *   2. "Sparkle" — nodes breathe with a rhythmic glow (3-5s cycle)
 *   3. "Interactive" — nodes near cursor brighten, enlarge, and gently attract
 * 
 * Performance:
 *   - Uses HTML5 Canvas (composited on GPU via will-change: transform)
 *   - requestAnimationFrame loop with delta-time for consistent speed
 *   - Respects prefers-reduced-motion
 *   - Pauses when tab is not visible (via visibilitychange)
 *   - Mouse tracking uses passive listeners with no layout thrash
 */
import { useEffect, useRef, useCallback } from "react";

/* ─── Configuration ─── */
const NODE_COUNT = 45;
const CONNECTION_DISTANCE = 220;
const NODE_MIN_RADIUS = 1.5;
const NODE_MAX_RADIUS = 3;
const GLOW_BREATH_SPEED = 0.0006; // ~3-5s full cycle
const PULSE_SPEED = 0.35; // px per ms
const PULSE_LENGTH = 0.18; // fraction of line length
const PULSE_SPAWN_CHANCE = 0.003; // per connection per frame
const DRIFT_SPEED = 0.012; // px per ms — very slow drift

/* ─── Cursor interaction ─── */
const CURSOR_RADIUS = 180; // px — influence zone around cursor
const CURSOR_ATTRACT_STRENGTH = 0.015; // how strongly nodes pull toward cursor
const CURSOR_BRIGHTEN_MULT = 2.5; // glow multiplier at cursor center
const CURSOR_LINE_BRIGHTEN = 3.0; // connection brightness multiplier near cursor
const CURSOR_PULSE_BOOST = 0.015; // extra pulse spawn chance near cursor

/* ─── Colors (electric blue / cyan palette) ─── */
const PULSE_COLOR_START = "rgba(6, 182, 212, 0.7)";
const PULSE_COLOR_END = "rgba(59, 130, 246, 0.0)";

/* ─── Types ─── */
interface Node {
  x: number;
  y: number;
  baseX: number; // original drift position (for spring-back)
  baseY: number;
  vx: number;
  vy: number;
  r: number;
  phase: number; // breathing phase offset
}

interface Pulse {
  fromIdx: number;
  toIdx: number;
  t: number; // 0 → 1 progress along line
}

interface CursorState {
  x: number;
  y: number;
  active: boolean;
}

export default function NeuralNetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const pulsesRef = useRef<Pulse[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });
  const lastTimeRef = useRef(0);
  const pausedRef = useRef(false);
  const cursorRef = useRef<CursorState>({ x: 0, y: 0, active: false });

  /* ─── Initialise nodes ─── */
  const initNodes = useCallback((w: number, h: number) => {
    const nodes: Node[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = DRIFT_SPEED * (0.5 + Math.random() * 0.5);
      const x = Math.random() * w;
      const y = Math.random() * h;
      nodes.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: NODE_MIN_RADIUS + Math.random() * (NODE_MAX_RADIUS - NODE_MIN_RADIUS),
        phase: Math.random() * Math.PI * 2,
      });
    }
    nodesRef.current = nodes;
    pulsesRef.current = [];
  }, []);

  /* ─── Resize handler ─── */
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const prevW = sizeRef.current.w;
    sizeRef.current = { w, h };
    if (prevW === 0 || Math.abs(prevW - w) > 100) initNodes(w, h);
  }, [initNodes]);

  /* ─── Cursor proximity helper ─── */
  const getCursorInfluence = (nodeX: number, nodeY: number): number => {
    const cursor = cursorRef.current;
    if (!cursor.active) return 0;
    const dx = nodeX - cursor.x;
    const dy = nodeY - cursor.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > CURSOR_RADIUS) return 0;
    // Smooth cubic falloff for organic feel
    const t = 1 - dist / CURSOR_RADIUS;
    return t * t * t; // cubic ease — strong near center, gentle at edge
  };

  /* ─── Animation loop ─── */
  const animate = useCallback((time: number) => {
    if (pausedRef.current) {
      animRef.current = requestAnimationFrame(animate);
      return;
    }

    const dt = lastTimeRef.current ? Math.min(time - lastTimeRef.current, 50) : 16;
    lastTimeRef.current = time;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) {
      animRef.current = requestAnimationFrame(animate);
      return;
    }

    const { w, h } = sizeRef.current;
    const nodes = nodesRef.current;
    const pulses = pulsesRef.current;
    const cursor = cursorRef.current;

    ctx.clearRect(0, 0, w, h);

    /* ── Update node positions (gentle drift + cursor attraction) ── */
    for (const node of nodes) {
      // Base drift
      node.baseX += node.vx * dt;
      node.baseY += node.vy * dt;

      // Wrap base position around edges
      if (node.baseX < -20) node.baseX = w + 20;
      if (node.baseX > w + 20) node.baseX = -20;
      if (node.baseY < -20) node.baseY = h + 20;
      if (node.baseY > h + 20) node.baseY = -20;

      // Cursor attraction: gently pull node toward cursor
      if (cursor.active) {
        const influence = getCursorInfluence(node.baseX, node.baseY);
        if (influence > 0) {
          const dx = cursor.x - node.baseX;
          const dy = cursor.y - node.baseY;
          // Lerp toward cursor with smooth easing
          node.x = node.baseX + dx * influence * CURSOR_ATTRACT_STRENGTH * dt;
          node.y = node.baseY + dy * influence * CURSOR_ATTRACT_STRENGTH * dt;
        } else {
          // Spring back smoothly
          node.x += (node.baseX - node.x) * 0.05;
          node.y += (node.baseY - node.y) * 0.05;
        }
      } else {
        // No cursor — spring back to base
        node.x += (node.baseX - node.x) * 0.05;
        node.y += (node.baseY - node.y) * 0.05;
      }
    }

    /* ── Draw connections and spawn pulses ── */
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DISTANCE) {
          const alpha = 1 - dist / CONNECTION_DISTANCE;

          // Brighten connections near cursor
          const midX = (nodes[i].x + nodes[j].x) / 2;
          const midY = (nodes[i].y + nodes[j].y) / 2;
          const cursorInf = getCursorInfluence(midX, midY);
          const lineBrightness = 0.06 * alpha * (1 + cursorInf * CURSOR_LINE_BRIGHTEN);

          // Near cursor: shift color toward cyan
          if (cursorInf > 0.1) {
            const cyanMix = cursorInf * 0.6;
            const r = Math.round(59 * (1 - cyanMix) + 6 * cyanMix);
            const g = Math.round(130 * (1 - cyanMix) + 182 * cyanMix);
            const b = Math.round(246 * (1 - cyanMix) + 212 * cyanMix);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(lineBrightness, 0.35)})`;
          } else {
            ctx.strokeStyle = `rgba(59, 130, 246, ${lineBrightness})`;
          }

          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();

          // Pulse spawn — boosted near cursor
          const spawnChance = PULSE_SPAWN_CHANCE + cursorInf * CURSOR_PULSE_BOOST;
          if (Math.random() < spawnChance) {
            pulses.push({ fromIdx: i, toIdx: j, t: 0 });
          }
        }
      }
    }

    /* ── Update and draw pulses (flow effect) ── */
    const activePulses: Pulse[] = [];
    for (const pulse of pulses) {
      const from = nodes[pulse.fromIdx];
      const to = nodes[pulse.toIdx];
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) continue;

      pulse.t += (PULSE_SPEED * dt) / dist;
      if (pulse.t > 1 + PULSE_LENGTH) continue;

      const tHead = Math.min(pulse.t, 1);
      const tTail = Math.max(pulse.t - PULSE_LENGTH, 0);
      const x1 = from.x + dx * tTail;
      const y1 = from.y + dy * tTail;
      const x2 = from.x + dx * tHead;
      const y2 = from.y + dy * tHead;

      // Brighten pulses near cursor
      const pMidX = (x1 + x2) / 2;
      const pMidY = (y1 + y2) / 2;
      const pInf = getCursorInfluence(pMidX, pMidY);
      const pulseWidth = 1.5 + pInf * 1.5;

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      if (pInf > 0.1) {
        grad.addColorStop(0, `rgba(6, 182, 212, 0)`);
        grad.addColorStop(1, `rgba(6, 182, 212, ${0.7 + pInf * 0.3})`);
      } else {
        grad.addColorStop(0, PULSE_COLOR_END);
        grad.addColorStop(1, PULSE_COLOR_START);
      }
      ctx.strokeStyle = grad;
      ctx.lineWidth = pulseWidth;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.lineWidth = 1;

      activePulses.push(pulse);
    }
    pulsesRef.current = activePulses;

    /* ── Draw nodes with breathing glow + cursor enhancement ── */
    const globalPhase = time * GLOW_BREATH_SPEED;
    for (const node of nodes) {
      const breath = 0.5 + 0.5 * Math.sin(globalPhase + node.phase);
      const cursorInf = getCursorInfluence(node.x, node.y);
      const brighten = 1 + cursorInf * (CURSOR_BRIGHTEN_MULT - 1);

      const glowRadius = node.r * (3 + breath * 4) * (1 + cursorInf * 1.5);
      const glowAlpha = Math.min((0.08 + breath * 0.18) * brighten, 0.6);

      // Outer glow — shifts toward white/cyan near cursor
      const glow = ctx.createRadialGradient(
        node.x, node.y, 0,
        node.x, node.y, glowRadius
      );
      if (cursorInf > 0.2) {
        // Near cursor: brighter, whiter glow
        const whiteBlend = cursorInf * 0.4;
        const gr = Math.round(6 + (255 - 6) * whiteBlend);
        const gg = Math.round(182 + (255 - 182) * whiteBlend);
        const gb = Math.round(212 + (255 - 212) * whiteBlend);
        glow.addColorStop(0, `rgba(${gr}, ${gg}, ${gb}, ${glowAlpha})`);
        glow.addColorStop(1, `rgba(${gr}, ${gg}, ${gb}, 0)`);
      } else {
        glow.addColorStop(0, `rgba(6, 182, 212, ${glowAlpha})`);
        glow.addColorStop(1, "rgba(6, 182, 212, 0)");
      }
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Core dot — enlarges and brightens near cursor
      const coreAlpha = Math.min((0.4 + breath * 0.4) * brighten, 1.0);
      const coreRadius = node.r * (1 + cursorInf * 1.2);
      if (cursorInf > 0.3) {
        // White-hot core near cursor
        ctx.fillStyle = `rgba(200, 230, 255, ${coreAlpha})`;
      } else {
        ctx.fillStyle = `rgba(59, 130, 246, ${coreAlpha})`;
      }
      ctx.beginPath();
      ctx.arc(node.x, node.y, coreRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    /* ── Optional: draw subtle cursor halo ── */
    if (cursor.active) {
      const halo = ctx.createRadialGradient(
        cursor.x, cursor.y, 0,
        cursor.x, cursor.y, CURSOR_RADIUS * 0.4
      );
      halo.addColorStop(0, "rgba(6, 182, 212, 0.03)");
      halo.addColorStop(1, "rgba(6, 182, 212, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, CURSOR_RADIUS * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    animRef.current = requestAnimationFrame(animate);
  }, []);

  /* ─── Mouse handlers ─── */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    cursorRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  }, []);

  const handleMouseLeave = useCallback(() => {
    cursorRef.current = { ...cursorRef.current, active: false };
  }, []);

  /* ─── Lifecycle ─── */
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    handleResize();

    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;

    // Listen on the parent (the hero section wrapper) so pointer-events-none on canvas doesn't block
    const target = parent || canvas;

    const onVisChange = () => {
      pausedRef.current = document.hidden;
      if (!document.hidden) lastTimeRef.current = 0;
    };

    document.addEventListener("visibilitychange", onVisChange);
    window.addEventListener("resize", handleResize);
    target?.addEventListener("mousemove", handleMouseMove as EventListener, { passive: true });
    target?.addEventListener("mouseleave", handleMouseLeave as EventListener);

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      document.removeEventListener("visibilitychange", onVisChange);
      window.removeEventListener("resize", handleResize);
      target?.removeEventListener("mousemove", handleMouseMove as EventListener);
      target?.removeEventListener("mouseleave", handleMouseLeave as EventListener);
    };
  }, [handleResize, animate, handleMouseMove, handleMouseLeave]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ willChange: "transform" }}
      aria-hidden="true"
    />
  );
}
