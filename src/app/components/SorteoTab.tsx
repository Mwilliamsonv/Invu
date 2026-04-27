import { useState, useEffect, useRef, useCallback } from "react";
import { Gift, Trophy, User, Hash, Tag, Check, Trash2, ChevronDown } from "lucide-react";
import {
  addRaffleWinner,
  deleteRaffleWinner,
  subscribeToRaffleWinners,
} from "../lib/events";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface SorteoGuest {
  id: number;
  name: string;
  present: boolean;
  bracelet?: number;
}

interface Winner {
  id: string;
  guest: SorteoGuest;
  prize: string;
  timestamp: string;
}

// ── Tombola Canvas ────────────────────────────────────────────────────────────
function TombolaCanvas({ spinning, progress }: { spinning: boolean; progress: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef  = useRef(0);
  const rafRef    = useRef(0);

  // Ball positions (deterministic initial + animated)
  const ballsRef = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      angle:  (i / 18) * Math.PI * 2,
      radius: 58 + (i % 3) * 18,
      size:   7 + (i % 4) * 2.5,
      color:  [
        "#26c6da", "#00acc1", "#7c3aed", "#f59e0b",
        "#e53e3e", "#00897b", "#3b82f6", "#ec4899",
        "#10b981", "#f97316",
      ][i % 10],
      speed: 0.4 + (i % 5) * 0.12,
      orbitDir: i % 2 === 0 ? 1 : -1,
    }))
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    ctx.clearRect(0, 0, W, H);

    // ── Outer bowl ring ───────────────────────────────────────────────────
    const bowlGrad = ctx.createRadialGradient(cx - 10, cy - 10, 10, cx, cy, 108);
    bowlGrad.addColorStop(0, "#f0f4f8");
    bowlGrad.addColorStop(1, "#cdd5e0");

    ctx.beginPath();
    ctx.arc(cx, cy, 108, 0, Math.PI * 2);
    ctx.fillStyle = bowlGrad;
    ctx.fill();

    // bowl shadow border
    ctx.beginPath();
    ctx.arc(cx, cy, 108, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(184,190,199,0.7)";
    ctx.lineWidth   = 6;
    ctx.stroke();

    // ── Inner glass dome ──────────────────────────────────────────────────
    const glassGrad = ctx.createRadialGradient(cx - 20, cy - 25, 8, cx, cy, 94);
    glassGrad.addColorStop(0,   "rgba(255,255,255,0.55)");
    glassGrad.addColorStop(0.5, "rgba(232,236,240,0.30)");
    glassGrad.addColorStop(1,   "rgba(200,208,218,0.22)");

    ctx.beginPath();
    ctx.arc(cx, cy, 94, 0, Math.PI * 2);
    ctx.fillStyle = glassGrad;
    ctx.fill();

    // ── Spinning drum lines ───────────────────────────────────────────────
    const drumAngle = angleRef.current;
    const lineCount = 8;
    for (let i = 0; i < lineCount; i++) {
      const a  = drumAngle + (i / lineCount) * Math.PI * 2;
      const x1 = cx + Math.cos(a) * 20;
      const y1 = cy + Math.sin(a) * 20;
      const x2 = cx + Math.cos(a) * 90;
      const y2 = cy + Math.sin(a) * 90;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(38,198,218,${spinning ? 0.18 + Math.abs(Math.sin(a + Date.now() / 400)) * 0.14 : 0.12})`;
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }

    // ── Balls ─────────────────────────────────────────────────────────────
    ballsRef.current.forEach((ball) => {
      const bx = cx + Math.cos(ball.angle) * ball.radius;
      const by = cy + Math.sin(ball.angle) * ball.radius;

      // glow
      if (spinning) {
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, ball.size * 2.2);
        glow.addColorStop(0, ball.color + "55");
        glow.addColorStop(1, ball.color + "00");
        ctx.beginPath();
        ctx.arc(bx, by, ball.size * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // ball body
      const ballGrad = ctx.createRadialGradient(bx - ball.size * 0.3, by - ball.size * 0.3, ball.size * 0.1, bx, by, ball.size);
      ballGrad.addColorStop(0, "rgba(255,255,255,0.9)");
      ballGrad.addColorStop(0.3, ball.color);
      ballGrad.addColorStop(1, ball.color + "cc");

      ctx.beginPath();
      ctx.arc(bx, by, ball.size, 0, Math.PI * 2);
      ctx.fillStyle = ballGrad;
      ctx.fill();

      // highlight
      ctx.beginPath();
      ctx.arc(bx - ball.size * 0.28, by - ball.size * 0.28, ball.size * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.fill();
    });

    // ── Center hub ────────────────────────────────────────────────────────
    const hubGrad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 16);
    hubGrad.addColorStop(0, "#ffffff");
    hubGrad.addColorStop(1, "#b8bec7");
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();

    // ── Glass shine overlay ───────────────────────────────────────────────
    const shineGrad = ctx.createRadialGradient(cx - 35, cy - 40, 5, cx - 20, cy - 20, 70);
    shineGrad.addColorStop(0, "rgba(255,255,255,0.38)");
    shineGrad.addColorStop(1, "rgba(255,255,255,0.00)");
    ctx.beginPath();
    ctx.arc(cx, cy, 94, 0, Math.PI * 2);
    ctx.fillStyle = shineGrad;
    ctx.fill();
  }, [spinning]);

  // Animation loop
  useEffect(() => {
    let last = performance.now();

    const loop = (now: number) => {
      const dt    = (now - last) / 1000;
      last        = now;

      if (spinning) {
        // speed ramps up then slows at the end (eased by parent's `progress`)
        const speedFactor = Math.min(1, progress < 0.8 ? progress / 0.2 : (1 - progress) / 0.2 * 0.4 + 0.6);
        const baseSpeed   = 3.5 * speedFactor;
        angleRef.current += baseSpeed * dt;

        ballsRef.current.forEach((ball) => {
          ball.angle += ball.orbitDir * ball.speed * baseSpeed * dt;
        });
      }

      draw();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [spinning, progress, draw]);

  return (
    <canvas
      ref={canvasRef}
      width={230}
      height={230}
      style={{ display: "block" }}
    />
  );
}

// ── Countdown Ring ────────────────────────────────────────────────────────────
function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const r   = 18;
  const circ = 2 * Math.PI * r;
  const pct  = seconds / total;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 52, height: 52 }}>
      <svg width="52" height="52" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        <circle cx="26" cy="26" r={r} fill="none" stroke="#d4d8e0" strokeWidth="3" />
        <circle
          cx="26" cy="26" r={r}
          fill="none"
          stroke="#26c6da"
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s linear" }}
        />
      </svg>
      <span style={{ fontSize: "16px", fontWeight: 800, color: "#3d4a5c", position: "relative", zIndex: 1 }}>
        {seconds}
      </span>
    </div>
  );
}

// ── Winner Card ───────────────────────────────────────────────────────────────
function WinnerCard({
  winner,
  onDelete,
  isNew,
}: {
  winner: Winner;
  onDelete: (id: string) => void;
  isNew?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{
        background: "#e8ecf0",
        boxShadow: isNew
          ? "6px 6px 14px rgba(0,172,193,0.25), -6px -6px 14px #ffffff, 0 0 0 2px rgba(38,198,218,0.25)"
          : "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff",
        transition: "box-shadow 0.4s ease",
      }}
    >
      {/* Trophy icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(245,158,11,0.12)" }}
      >
        <Trophy size={18} color="#f59e0b" strokeWidth={1.8} />
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 min-w-0">
        <span style={{ fontSize: "14px", fontWeight: 700, color: "#3d4a5c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {winner.guest.name}
        </span>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <div className="flex items-center gap-1">
            <Hash size={10} color="#a0aec0" strokeWidth={2} />
            <span style={{ fontSize: "11px", color: "#a0aec0", fontWeight: 500 }}>
              {String(winner.guest.id).padStart(4, "0")}
            </span>
          </div>
          {winner.guest.bracelet && (
            <>
              <span style={{ color: "#d4d8e0" }}>·</span>
              <span style={{ fontSize: "11px", color: "#8a9bb0", fontWeight: 500 }}>
                Pulsera #{winner.guest.bracelet}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Tag size={10} color="#26c6da" strokeWidth={2} />
          <span style={{ fontSize: "12px", color: "#26c6da", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {winner.prize}
          </span>
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(winner.id)}
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: "#e8ecf0",
          boxShadow: "3px 3px 6px #b8bec7, -3px -3px 6px #ffffff",
          border: "none", cursor: "pointer",
        }}
      >
        <Trash2 size={13} color="#e53e3e" strokeWidth={2} />
      </button>
    </div>
  );
}

// ── Prize Input Sheet ─────────────────────────────────────────────────────────
function PrizeSheet({
  guest,
  onConfirm,
  onSkip,
}: {
  guest: SorteoGuest;
  onConfirm: (prize: string) => void;
  onSkip: () => void;
}) {
  const [prize, setPrize]   = useState("");
  const [focus, setFocus]   = useState(false);
  const canSave = prize.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(60,80,100,0.28)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-[390px] rounded-t-3xl p-6 pb-10 flex flex-col gap-5"
        style={{ background: "#e8ecf0", boxShadow: "-4px -4px 20px rgba(255,255,255,0.8), 0px -6px 20px rgba(184,190,199,0.5)" }}
      >
        {/* Handle */}
        <div className="flex justify-center -mb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "#b8bec7" }} />
        </div>

        {/* Winner banner */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: "rgba(245,158,11,0.10)", boxShadow: "inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff" }}
        >
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(245,158,11,0.15)" }}
          >
            <Trophy size={20} color="#f59e0b" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: "11px", color: "#b45309", margin: 0, fontWeight: 600 }}>Ganador del sorteo</p>
            <p style={{ fontSize: "16px", color: "#3d4a5c", margin: 0, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {guest.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span style={{ fontSize: "11px", color: "#8a9bb0" }}>ID #{String(guest.id).padStart(4, "0")}</span>
              {guest.bracelet && (
                <>
                  <span style={{ color: "#d4d8e0" }}>·</span>
                  <span style={{ fontSize: "11px", color: "#8a9bb0" }}>Pulsera #{guest.bracelet}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Prize input */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: "12px", color: "#8a9bb0", fontWeight: 500 }}>
            Premio obtenido
          </label>
          <div
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all"
            style={{
              background: "#e8ecf0",
              boxShadow: focus
                ? "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff"
                : "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff",
            }}
          >
            <Tag size={16} color={focus ? "#26c6da" : "#a0aec0"} strokeWidth={2} />
            <input
              type="text"
              placeholder='Ej. "Cena para dos" o "Vale $5000"'
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              autoFocus
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontSize: "15px", color: "#3d4a5c",
              }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            style={{
              flex: 1, background: "#e8ecf0",
              boxShadow: "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff",
              border: "none", borderRadius: 16, padding: "14px",
              cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "#8a9bb0",
            }}
          >
            Omitir
          </button>
          <button
            onClick={() => { if (canSave) onConfirm(prize.trim()); }}
            disabled={!canSave}
            style={{
              flex: 1,
              background: canSave
                ? "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)"
                : "#e8ecf0",
              boxShadow: canSave
                ? "5px 5px 12px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.5)"
                : "inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff",
              border: "none", borderRadius: 16, padding: "14px",
              cursor: canSave ? "pointer" : "default",
              fontSize: "14px", fontWeight: 600,
              color: canSave ? "#fff" : "#a0aec0",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Check size={16} color={canSave ? "#fff" : "#a0aec0"} strokeWidth={2.2} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Sorteo Tab ───────────────────────────────────────────────────────────
const TOTAL_SECONDS = 5;

export function SorteoTab({ eventId, guests }: { eventId: string; guests: SorteoGuest[] }) {
  const [spinning, setSpinning]           = useState(false);
  const [countdown, setCountdown]         = useState(TOTAL_SECONDS);
  const [progress, setProgress]           = useState(0);          // 0→1 during spin
  const [drawnGuest, setDrawnGuest]       = useState<SorteoGuest | null>(null);
  const [showPrizeSheet, setShowPrizeSheet] = useState(false);
  const [winners, setWinners]             = useState<Winner[]>([]);
  const [newWinnerId, setNewWinnerId]     = useState<string | null>(null);
  const [drawNotice, setDrawNotice]       = useState<string | null>(null);

  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef    = useRef(0);

  useEffect(() => {
    if (!eventId) return;
    const unsub = subscribeToRaffleWinners(eventId, (items) => {
      const mapped: Winner[] = items.map((w) => {
        const guestInList = guests.find((g) => g.id === w.guestId);
        return {
          id: w.id,
          guest: guestInList ?? {
            id: w.guestId,
            name: w.guestName,
            present: true,
            extra: false,
            bracelet: w.guestBracelet,
          },
          prize: w.prize,
          timestamp: w.createdAt,
        };
      });
      setWinners(mapped);
    });
    return () => unsub();
  }, [eventId, guests]);

  // Eligible: present guests (or all guests if none present), excluding previous winners.
  const candidatePool = guests.filter((g) => g.present).length > 0
    ? guests.filter((g) => g.present)
    : guests;
  const winnerIds = new Set(winners.map((w) => w.guest.id));
  const eligiblePool = candidatePool.filter((g) => !winnerIds.has(g.id));

  const startSpin = () => {
    if (spinning) return;
    if (eligiblePool.length === 0) {
      setDrawNotice(
        candidatePool.length === 0
          ? "No hay invitados disponibles para sortear."
          : "Todos los invitados ya han ganado.",
      );
      setTimeout(() => setDrawNotice(null), 2600);
      return;
    }
    setDrawNotice(null);
    setSpinning(true);
    setCountdown(TOTAL_SECONDS);
    setProgress(0);
    setDrawnGuest(null);
    startRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const remaining = Math.max(0, TOTAL_SECONDS - Math.floor(elapsed));
      const prog      = Math.min(1, elapsed / TOTAL_SECONDS);

      setCountdown(remaining);
      setProgress(prog);

      if (elapsed >= TOTAL_SECONDS) {
        clearInterval(timerRef.current!);
        // Pick random winner
        const winner = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
        setDrawnGuest(winner);
        setSpinning(false);
        setShowPrizeSheet(true);
      }
    }, 200);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const handleConfirmPrize = async (prize: string) => {
    if (!drawnGuest) return;
    try {
      const newWinnerId = await addRaffleWinner(eventId, {
        guestId: drawnGuest.id,
        guestName: drawnGuest.name,
        guestBracelet: drawnGuest.bracelet,
        prize,
      });
      setNewWinnerId(newWinnerId);
      setTimeout(() => setNewWinnerId(null), 3000);
      setDrawNotice("Ganador guardado.");
      setTimeout(() => setDrawNotice(null), 2200);
      setShowPrizeSheet(false);
      setDrawnGuest(null);
    } catch (e: any) {
      setDrawNotice(e?.message ?? "No se pudo guardar el ganador.");
      setTimeout(() => setDrawNotice(null), 3000);
    }
  };

  const handleSkipPrize = () => {
    setShowPrizeSheet(false);
    setDrawnGuest(null);
  };

  const handleDeleteWinner = async (id: string) => {
    try {
      await deleteRaffleWinner(eventId, id);
    } catch {
      setDrawNotice("No se pudo eliminar el ganador.");
      setTimeout(() => setDrawNotice(null), 3000);
    }
  };

  const noEligible = eligiblePool.length === 0;
  const allAlreadyWon = candidatePool.length > 0 && eligiblePool.length === 0;

  return (
    <>
      <div className="flex flex-col gap-6">

        {/* ── Tombola section ── */}
        <div
          className="rounded-3xl p-6 flex flex-col items-center gap-5"
          style={{ background: "#e8ecf0", boxShadow: "6px 6px 16px #b8bec7, -6px -6px 16px #ffffff" }}
        >
          {/* Title row */}
          <div className="flex items-center gap-2 w-full">
            <Gift size={18} color="#26c6da" strokeWidth={1.8} />
            <span style={{ fontSize: "16px", fontWeight: 700, color: "#3d4a5c" }}>Sorteo</span>
            <div className="ml-auto">
              {spinning && (
                <CountdownRing seconds={countdown} total={TOTAL_SECONDS} />
              )}
            </div>
          </div>

          {/* Tombola canvas */}
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              background: "#e8ecf0",
              boxShadow: spinning
                ? "8px 8px 20px #b8bec7, -8px -8px 20px #ffffff, 0 0 30px rgba(38,198,218,0.18)"
                : "8px 8px 20px #b8bec7, -8px -8px 20px #ffffff",
              padding: 10,
              transition: "box-shadow 0.5s ease",
            }}
          >
            <TombolaCanvas spinning={spinning} progress={progress} />
          </div>

          {/* Spin button */}
          {noEligible ? (
            <div
              className="w-full py-4 rounded-2xl flex flex-col items-center gap-1"
              style={{ background: "#e8ecf0", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }}
            >
              <User size={18} color="#c8d0da" strokeWidth={1.8} />
              <span style={{ fontSize: "13px", color: "#c8d0da", fontWeight: 600 }}>
                {allAlreadyWon ? "Todos los invitados ya han ganado" : "Sin invitados presentes"}
              </span>
              <span style={{ fontSize: "11px", color: "#d4d8e0", fontWeight: 400 }}>
                {allAlreadyWon ? "No quedan participantes disponibles." : "Marcá invitados como presentes para sortear"}
              </span>
            </div>
          ) : (
            <button
              onClick={startSpin}
              disabled={spinning}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-150 active:scale-[0.97]"
              style={{
                background: spinning
                  ? "#e8ecf0"
                  : "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)",
                boxShadow: spinning
                  ? "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff"
                  : "6px 6px 16px rgba(0,172,193,0.4), -3px -3px 8px rgba(255,255,255,0.5)",
                border: "none",
                cursor: spinning ? "default" : "pointer",
              }}
              onMouseDown={(e) => {
                if (!spinning) (e.currentTarget as HTMLButtonElement).style.boxShadow = "inset 3px 3px 8px rgba(0,120,140,0.4), inset -2px -2px 4px rgba(255,255,255,0.15)";
              }}
              onMouseUp={(e) => {
                if (!spinning) (e.currentTarget as HTMLButtonElement).style.boxShadow = "6px 6px 16px rgba(0,172,193,0.4), -3px -3px 8px rgba(255,255,255,0.5)";
              }}
              onMouseLeave={(e) => {
                if (!spinning) (e.currentTarget as HTMLButtonElement).style.boxShadow = "6px 6px 16px rgba(0,172,193,0.4), -3px -3px 8px rgba(255,255,255,0.5)";
              }}
            >
              {spinning ? (
                <>
                  <div
                    style={{
                      width: 18, height: 18, borderRadius: "50%",
                      border: "2.5px solid #b8bec7",
                      borderTopColor: "#26c6da",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#8a9bb0" }}>Girando…</span>
                </>
              ) : (
                <>
                  <Gift size={20} color="#fff" strokeWidth={2} />
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>Girar la tómbola</span>
                </>
              )}
            </button>
          )}

          {/* Spinning hint */}
          {spinning && (
            <p style={{ fontSize: "12px", color: "#a0aec0", fontWeight: 500, textAlign: "center", margin: 0 }}>
              Seleccionando ganador entre {eligiblePool.length} invitados…
            </p>
          )}
          {drawNotice && (
            <div
              className="w-full rounded-xl px-4 py-2.5"
              style={{
                background: "rgba(38,198,218,0.10)",
                color: "#0f6f79",
                fontSize: "12px",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              {drawNotice}
            </div>
          )}
        </div>

        {/* ── Winners list ── */}
        {winners.length > 0 && (
          <div className="flex flex-col gap-3">
            {/* Section header */}
            <div className="flex items-center gap-2">
              <Trophy size={15} color="#f59e0b" strokeWidth={2} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#3d4a5c" }}>
                Ganadores ({winners.length})
              </span>
              <ChevronDown size={14} color="#a0aec0" strokeWidth={2} />
            </div>

            {winners.map((w) => (
              <WinnerCard
                key={w.id}
                winner={w}
                onDelete={handleDeleteWinner}
                isNew={w.id === newWinnerId}
              />
            ))}
          </div>
        )}

        {/* Empty winners hint */}
        {winners.length === 0 && !spinning && (
          <div
            className="flex flex-col items-center py-8 gap-2 rounded-2xl"
            style={{ background: "#e8ecf0", boxShadow: "inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff" }}
          >
            <Trophy size={24} color="#d4d8e0" strokeWidth={1.5} />
            <p style={{ fontSize: "13px", color: "#c8d0da", fontWeight: 500, margin: 0 }}>
              Aún no hay ganadores
            </p>
            <p style={{ fontSize: "11px", color: "#d4d8e0", margin: 0 }}>
              Los resultados aparecerán aquí
            </p>
          </div>
        )}
      </div>

      {/* Prize sheet */}
      {showPrizeSheet && drawnGuest && (
        <PrizeSheet
          guest={drawnGuest}
          onConfirm={handleConfirmPrize}
          onSkip={handleSkipPrize}
        />
      )}
    </>
  );
}




