import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import {
  ScanLine,
  CameraOff,
  AlertCircle,
  Check,
  X,
  User,
  Hash,
  RefreshCw,
} from "lucide-react";

// ── Types (mirrored from EventDetailScreen) ───────────────────────────────────
export interface ScanGuest {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  present: boolean;
  extra: boolean;
  bracelet?: number;
}

interface Props {
  guests: ScanGuest[];
  onMarkPresent: (guestId: number, bracelet: number) => void;
}

// ── Parse QR content ──────────────────────────────────────────────────────────
// Format: "ID: 0001\nNombre: María González"
function parseQR(text: string): { id: number; name?: string } | null {
  const raw = text.trim();

  try {
    const parsed = JSON.parse(raw) as { id?: unknown; name?: unknown };
    if (typeof parsed.id === "number" && Number.isFinite(parsed.id)) {
      return { id: parsed.id, name: typeof parsed.name === "string" ? parsed.name.trim() : undefined };
    }
  } catch {
    // Continue with URL/text parsing.
  }

  try {
    const url = new URL(raw);
    const idParam = url.searchParams.get("id") ?? url.searchParams.get("guestId");
    if (idParam && /^\d+$/.test(idParam)) {
      return {
        id: parseInt(idParam, 10),
        name: url.searchParams.get("name")?.trim() || undefined,
      };
    }
  } catch {
    // Continue with regex parsing.
  }

  const idMatch = raw.match(/(?:^|\b)(?:ID|id|guestId)\s*[:#-]?\s*(\d+)\b/);
  if (!idMatch) return null;
  const nameMatch = raw.match(/(?:^|\b)(?:Nombre|nombre|Name|name)\s*[:#-]\s*(.+)/);
  return {
    id: parseInt(idMatch[1], 10),
    name: nameMatch?.[1]?.trim(),
  };
}

// ── Guest Detail Sheet (inline, adapted for scanner) ─────────────────────────
function ScannerGuestSheet({
  guest,
  onClose,
  onConfirmPresence,
}: {
  guest: ScanGuest;
  onClose: () => void;
  onConfirmPresence: (bracelet: number) => void;
}) {
  const [bracelet, setBracelet] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const canMark = bracelet.trim() !== "" && Number(bracelet) > 0;

  const handleConfirm = () => {
    onConfirmPresence(Number(bracelet));
    setShowConfirm(false);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ background: "rgba(60,80,100,0.22)", backdropFilter: "blur(3px)" }}
        onClick={onClose}
      >
        {/* Sheet */}
        <div
          className="w-full max-w-[390px] rounded-t-3xl p-6 pb-10 flex flex-col gap-5"
          style={{
            background: "#e8ecf0",
            boxShadow: "-4px -4px 20px rgba(255,255,255,0.8), 0px -6px 20px rgba(184,190,199,0.5)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center -mb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: "#b8bec7" }} />
          </div>

          {/* Scanned badge */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl self-start"
            style={{ background: "rgba(38,198,218,0.10)", boxShadow: "inset 2px 2px 4px #b8bec7, inset -2px -2px 4px #ffffff" }}
          >
            <ScanLine size={12} color="#26c6da" strokeWidth={2} />
            <span style={{ fontSize: "11px", color: "#26c6da", fontWeight: 600 }}>QR escaneado</span>
          </div>

          {/* Guest header */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "#e8ecf0",
                boxShadow: "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff",
              }}
            >
              <User size={24} color={guest.present ? "#00897b" : "#8a9bb0"} strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ fontSize: "17px", fontWeight: 700, color: "#3d4a5c" }}>
                  {guest.name}
                </span>
                {guest.extra && (
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{ fontSize: "10px", color: "#f59e0b", background: "rgba(245,158,11,0.12)", fontWeight: 600 }}
                  >
                    Extra
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Hash size={11} color="#a0aec0" strokeWidth={2} />
                <span style={{ fontSize: "12px", color: "#3d4a5c", fontWeight: 600 }}>
                  {String(guest.id).padStart(4, "0")}
                </span>
              </div>
            </div>
            {/* Status badge */}
            <div
              className="px-3 py-1.5 rounded-xl flex items-center gap-1.5 flex-shrink-0"
              style={{
                background: guest.present ? "rgba(0,137,123,0.12)" : "rgba(229,62,62,0.08)",
                boxShadow: "inset 2px 2px 4px #b8bec7, inset -2px -2px 4px #ffffff",
              }}
            >
              {guest.present
                ? <Check size={13} color="#00897b" strokeWidth={2.5} />
                : <X size={13} color="#e53e3e" strokeWidth={2.5} />}
              <span style={{ fontSize: "12px", color: guest.present ? "#00897b" : "#e53e3e", fontWeight: 600 }}>
                {guest.present ? "Presente" : "Ausente"}
              </span>
            </div>
          </div>

          {/* Already present — read-only */}
          {guest.present ? (
            <div
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: "#e8ecf0", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(0,137,123,0.12)" }}
              >
                <Hash size={16} color="#00897b" strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontSize: "11px", color: "#8a9bb0", margin: 0, fontWeight: 500 }}>Pulsera asignada</p>
                <p style={{ fontSize: "18px", color: "#00897b", margin: 0, fontWeight: 700 }}>
                  {guest.bracelet ?? "—"}
                </p>
              </div>
              <div
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ background: "rgba(0,137,123,0.10)" }}
              >
                <Check size={13} color="#00897b" strokeWidth={2.5} />
                <span style={{ fontSize: "12px", color: "#00897b", fontWeight: 600 }}>Confirmado</span>
              </div>
            </div>
          ) : (
            <>
              {/* Bracelet input */}
              <div className="flex flex-col gap-2">
                <label style={{ fontSize: "12px", color: "#8a9bb0", fontWeight: 500 }}>
                  Número de pulsera
                </label>
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: "#e8ecf0", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }}
                >
                  <Hash size={16} color="#26c6da" strokeWidth={2} />
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej. 105"
                    value={bracelet}
                    onChange={(e) => setBracelet(e.target.value)}
                    autoFocus
                    style={{
                      flex: 1, background: "transparent", border: "none", outline: "none",
                      fontSize: "20px", color: "#3d4a5c", fontWeight: 600,
                    }}
                  />
                </div>
              </div>

              {/* Mark present button */}
              <button
                onClick={() => { if (canMark) setShowConfirm(true); }}
                disabled={!canMark}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.97]"
                style={{
                  background: canMark
                    ? "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)"
                    : "#e8ecf0",
                  boxShadow: canMark
                    ? "5px 5px 12px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.5)"
                    : "inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff",
                  border: "none",
                  cursor: canMark ? "pointer" : "default",
                }}
              >
                <Check size={18} color={canMark ? "#fff" : "#a0aec0"} strokeWidth={2.2} />
                <span style={{ fontSize: "15px", fontWeight: 600, color: canMark ? "#fff" : "#a0aec0" }}>
                  Marcar como presente
                </span>
              </button>
            </>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl"
            style={{
              background: "#e8ecf0",
              boxShadow: "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff",
              border: "none", cursor: "pointer",
              fontSize: "14px", fontWeight: 600, color: "#8a9bb0",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-8"
          style={{ background: "rgba(60,80,100,0.3)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-[320px] rounded-3xl p-6 flex flex-col gap-5"
            style={{ background: "#e8ecf0", boxShadow: "10px 10px 24px #b8bec7, -10px -10px 24px #ffffff" }}
          >
            <div className="flex justify-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "#e8ecf0", boxShadow: "6px 6px 12px #b8bec7, -6px -6px 12px #ffffff" }}
              >
                <AlertCircle size={26} color="#26c6da" strokeWidth={1.8} />
              </div>
            </div>
            <div className="text-center flex flex-col gap-2">
              <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#3d4a5c", margin: 0 }}>
                Confirmar presencia
              </h3>
              <p style={{ fontSize: "14px", color: "#8a9bb0", margin: 0, lineHeight: 1.5 }}>
                ¿Marcar a{" "}
                <span style={{ color: "#3d4a5c", fontWeight: 600 }}>{guest.name}</span>{" "}
                como <span style={{ color: "#00897b", fontWeight: 600 }}>presente</span> con pulsera{" "}
                <span style={{ color: "#26c6da", fontWeight: 700 }}>#{bracelet}</span>?
              </p>
              <p style={{ fontSize: "12px", color: "#e53e3e", margin: 0 }}>Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1, background: "#e8ecf0",
                  boxShadow: "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff",
                  border: "none", borderRadius: 16, padding: "14px",
                  cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "#8a9bb0",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)",
                  boxShadow: "5px 5px 12px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.5)",
                  border: "none", borderRadius: 16, padding: "14px",
                  cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "#fff",
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Viewfinder corner decoration ──────────────────────────────────────────────
function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const top    = pos.startsWith("t");
  const left   = pos.endsWith("l");
  const size   = 22;
  const thick  = 3;
  const radius = 6;

  return (
    <div
      style={{
        position: "absolute",
        top:    top  ? 0 : undefined,
        bottom: !top ? 0 : undefined,
        left:   left ? 0 : undefined,
        right:  !left ? 0 : undefined,
        width:  size,
        height: size,
        borderTop:    top  ? `${thick}px solid #26c6da` : undefined,
        borderBottom: !top ? `${thick}px solid #26c6da` : undefined,
        borderLeft:   left ? `${thick}px solid #26c6da` : undefined,
        borderRight:  !left ? `${thick}px solid #26c6da` : undefined,
        borderTopLeftRadius:     (top  && left)  ? radius : 0,
        borderTopRightRadius:    (top  && !left) ? radius : 0,
        borderBottomLeftRadius:  (!top && left)  ? radius : 0,
        borderBottomRightRadius: (!top && !left) ? radius : 0,
      }}
    />
  );
}

// ── Main scanner tab ──────────────────────────────────────────────────────────
type CameraState = "idle" | "requesting" | "active" | "denied" | "error";

export function QRScannerTab({ guests, onMarkPresent }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const scanRafRef = useRef<number | null>(null);
  const lineRafRef = useRef<number | null>(null);
  const cooldownRef = useRef(false);

  const [camState, setCamState]     = useState<CameraState>("idle");
  const [scanResult, setScanResult] = useState<"found" | "unknown" | null>(null);
  const [foundGuest, setFoundGuest] = useState<ScanGuest | null>(null);
  const [scanLine, setScanLine]     = useState(0); // animated scan bar 0-100%
  const [errorText, setErrorText]   = useState<string | null>(null);
  const [cameraIds, setCameraIds]   = useState<string[]>([]);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [videoStats, setVideoStats] = useState("w:0 h:0 rs:0");

  const getCameraIds = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === "videoinput").map((d) => d.deviceId).filter(Boolean);
    } catch {
      return [] as string[];
    }
  }, []);

  const attachStreamToVideo = useCallback(async () => {
    const stream = streamRef.current;
    const video = videoRef.current;
    if (!stream || !video) return false;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    video.setAttribute("autoplay", "true");
    video.setAttribute("playsinline", "true");
    video.setAttribute("muted", "true");

    await new Promise<void>((resolve) => {
      let done = false;
      const complete = () => {
        if (done) return;
        done = true;
        resolve();
      };
      video.addEventListener("loadedmetadata", complete, { once: true });
      video.addEventListener("canplay", complete, { once: true });
      setTimeout(complete, 1200);
    });

    await video.play().catch(() => undefined);

    const hasFrames = await new Promise<boolean>((resolve) => {
      const startedAt = Date.now();
      const check = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2) {
          resolve(true);
          return;
        }
        if (Date.now() - startedAt > 2500) {
          resolve(false);
          return;
        }
        setTimeout(check, 100);
      };
      check();
    });

    return hasFrames;
  }, []);

  // ── Animated scan line ───────────────────────────────────────────────────
  useEffect(() => {
    if (camState !== "active") return;
    let dir = 1;
    let pos = 0;
    const step = () => {
      pos += dir * 1.2;
      if (pos >= 100) { pos = 100; dir = -1; }
      if (pos <= 0)   { pos = 0;   dir =  1; }
      setScanLine(pos);
      lineRafRef.current = requestAnimationFrame(step);
    };
    lineRafRef.current = requestAnimationFrame(step);
    return () => {
      if (lineRafRef.current !== null) {
        cancelAnimationFrame(lineRafRef.current);
        lineRafRef.current = null;
      }
    };
  }, [camState]);

  // ── Start camera ─────────────────────────────────────────────────────────
  const startCamera = useCallback(async (preferredDeviceId?: string) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorText("Este navegador no soporta acceso a cámara.");
      setCamState("error");
      return;
    }

    streamRef.current?.getTracks().forEach((t) => t.stop());
    setCamState("requesting");
    setScanResult(null);
    setFoundGuest(null);
    setErrorText(null);
    cooldownRef.current = false;
    try {
      const deviceIds = await getCameraIds();
      if (deviceIds.length > 0) {
        setCameraIds(deviceIds);
      }

      const attempts: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { exact: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        },
        {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        {
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        { video: true, audio: false },
      ];

      const preferred = preferredDeviceId ?? deviceIds[cameraIndex];
      if (preferred) {
        attempts.unshift({
          video: {
            deviceId: { exact: preferred },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      }

      let stream: MediaStream | null = null;
      let lastError: unknown = null;
      for (const constraints of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err) {
          lastError = err;
        }
      }
      if (!stream) throw lastError ?? new Error("NoCameraStream");

      streamRef.current = stream;
      // Move to active first, because <video> only mounts in the active state.
      setCamState("active");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.name : "";
      if (msg === "NotAllowedError" || msg === "PermissionDeniedError") {
        setCamState("denied");
        return;
      }

      if (msg === "NotReadableError") {
        setErrorText("La cámara está en uso por otra aplicación.");
      } else if (msg === "NotFoundError" || msg === "DevicesNotFoundError") {
        setErrorText("No se detectó ninguna cámara disponible.");
      } else if (msg === "NoVideoFrames") {
        setErrorText("Se concedió permiso, pero la cámara no entregó imagen. Reintenta o abre en navegador externo.");
      } else {
        setErrorText("No se pudo iniciar la cámara en este entorno.");
      }

      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
      setCamState("error");
    }
  }, [cameraIndex, getCameraIds]);

  const switchCamera = useCallback(async () => {
    const ids = cameraIds.length ? cameraIds : await getCameraIds();
    if (!ids.length) {
      await startCamera();
      return;
    }
    const next = (cameraIndex + 1) % ids.length;
    setCameraIndex(next);
    await startCamera(ids[next]);
  }, [cameraIds, cameraIndex, getCameraIds, startCamera]);

  // ── Stop camera ───────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (scanRafRef.current !== null) {
      cancelAnimationFrame(scanRafRef.current);
      scanRafRef.current = null;
    }
    if (lineRafRef.current !== null) {
      cancelAnimationFrame(lineRafRef.current);
      lineRafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }, []);

  // ── Frame scan loop ───────────────────────────────────────────────────────
  const scanFrame = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      scanRafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result    = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (result && !cooldownRef.current) {
      cooldownRef.current = true;
      const parsed = parseQR(result.data);

      if (parsed) {
        const guest = guests.find(
          (g) =>
            g.id === parsed.id ||
            (!!parsed.name && g.name.toLowerCase() === parsed.name.toLowerCase())
        );
        if (guest) {
          setScanResult("found");
          setFoundGuest(guest);
        } else {
          setScanResult("unknown");
          // Reset after 2.5s to allow re-scan
          setTimeout(() => {
            setScanResult(null);
            cooldownRef.current = false;
          }, 2500);
        }
      } else {
        setScanResult("unknown");
        setTimeout(() => {
          setScanResult(null);
          cooldownRef.current = false;
        }, 2500);
      }
    }

    scanRafRef.current = requestAnimationFrame(scanFrame);
  }, [guests]);

  // Start scan loop when active
  useEffect(() => {
    if (camState !== "active") return;
    scanRafRef.current = requestAnimationFrame(scanFrame);
    return () => {
      if (scanRafRef.current !== null) {
        cancelAnimationFrame(scanRafRef.current);
        scanRafRef.current = null;
      }
    };
  }, [camState, scanFrame]);

  // Attach stream after the active UI mounts the <video> element.
  useEffect(() => {
    if (camState !== "active") return;
    let cancelled = false;

    (async () => {
      const hasFrames = await attachStreamToVideo();
      if (cancelled || hasFrames) return;

      setErrorText("Se concedió permiso, pero la cámara no entregó imagen. Reintenta o abre en navegador externo.");
      stopCamera();
      setCamState("error");
    })();

    return () => {
      cancelled = true;
    };
  }, [attachStreamToVideo, camState, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    if (camState !== "active") return;
    const id = window.setInterval(() => {
      const video = videoRef.current;
      const track = streamRef.current?.getVideoTracks?.()[0];
      const stats = `w:${video?.videoWidth ?? 0} h:${video?.videoHeight ?? 0} rs:${video?.readyState ?? 0} t:${track?.readyState ?? "none"}`;
      setVideoStats(stats);
    }, 700);
    return () => window.clearInterval(id);
  }, [camState]);

  const handleMarkPresent = (bracelet: number) => {
    if (!foundGuest) return;
    onMarkPresent(foundGuest.id, bracelet);
    setFoundGuest(null);
    setScanResult(null);
    cooldownRef.current = false;
  };

  const handleCloseSheet = () => {
    setFoundGuest(null);
    setScanResult(null);
    cooldownRef.current = false;
  };

  // ── UI: idle ──────────────────────────────────────────────────────────────
  if (camState === "idle") {
    return (
      <div className="flex flex-col items-center gap-6 py-10">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: "#e8ecf0", boxShadow: "8px 8px 18px #b8bec7, -8px -8px 18px #ffffff" }}
        >
          <ScanLine size={36} color="#26c6da" strokeWidth={1.5} />
        </div>
        <div className="text-center flex flex-col gap-2 px-4">
          <p style={{ fontSize: "18px", fontWeight: 700, color: "#3d4a5c", margin: 0 }}>
            Escáner QR
          </p>
          <p style={{ fontSize: "13px", color: "#8a9bb0", margin: 0, lineHeight: 1.6 }}>
            Apuntá la cámara al código QR de un invitado para verificar su acceso y marcarlo como presente.
          </p>
        </div>
        <button
          onClick={startCamera}
          className="flex items-center gap-2 px-8 py-4 rounded-2xl transition-all active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)",
            boxShadow: "6px 6px 14px rgba(0,172,193,0.4), -3px -3px 8px rgba(255,255,255,0.5)",
            border: "none", cursor: "pointer",
          }}
        >
          <ScanLine size={18} color="#fff" strokeWidth={2} />
          <span style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>Activar cámara</span>
        </button>
      </div>
    );
  }

  // ── UI: requesting ────────────────────────────────────────────────────────
  if (camState === "requesting") {
    return (
      <div className="flex flex-col items-center gap-5 py-16">
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center"
          style={{ background: "#e8ecf0", boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff" }}
        >
          <ScanLine size={28} color="#26c6da" strokeWidth={1.8} style={{ animation: "pulse 1.2s ease-in-out infinite" }} />
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </div>
        <p style={{ fontSize: "14px", color: "#8a9bb0", fontWeight: 500 }}>Solicitando acceso a la cámara…</p>
      </div>
    );
  }

  // ── UI: denied ────────────────────────────────────────────────────────────
  if (camState === "denied") {
    return (
      <div className="flex flex-col items-center gap-5 py-10 px-4">
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center"
          style={{ background: "rgba(229,62,62,0.10)", boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff" }}
        >
          <CameraOff size={28} color="#e53e3e" strokeWidth={1.8} />
        </div>
        <div className="text-center">
          <p style={{ fontSize: "16px", fontWeight: 700, color: "#3d4a5c", margin: 0 }}>Acceso denegado</p>
          <p style={{ fontSize: "13px", color: "#8a9bb0", margin: 0, marginTop: 6, lineHeight: 1.6 }}>
            Necesitás permitir el acceso a la cámara en la configuración del navegador para poder escanear códigos QR.
          </p>
        </div>
        <button
          onClick={startCamera}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl"
          style={{
            background: "#e8ecf0",
            boxShadow: "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff",
            border: "none", cursor: "pointer",
          }}
        >
          <RefreshCw size={15} color="#26c6da" strokeWidth={2} />
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#3d4a5c" }}>Reintentar</span>
        </button>
      </div>
    );
  }

  // ── UI: error ─────────────────────────────────────────────────────────────
  if (camState === "error") {
    return (
      <div className="flex flex-col items-center gap-5 py-10 px-4">
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center"
          style={{ background: "rgba(229,62,62,0.10)", boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff" }}
        >
          <AlertCircle size={28} color="#e53e3e" strokeWidth={1.8} />
        </div>
        <div className="text-center">
          <p style={{ fontSize: "16px", fontWeight: 700, color: "#3d4a5c", margin: 0 }}>Error de cámara</p>
          <p style={{ fontSize: "13px", color: "#8a9bb0", margin: 0, marginTop: 6, lineHeight: 1.5 }}>
            {errorText ?? "No se pudo acceder a la cámara. Verificá que no esté siendo usada por otra aplicación."}
          </p>
        </div>
        <button
          onClick={startCamera}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl"
          style={{
            background: "#e8ecf0",
            boxShadow: "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff",
            border: "none", cursor: "pointer",
          }}
        >
          <RefreshCw size={15} color="#26c6da" strokeWidth={2} />
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#3d4a5c" }}>Reintentar</span>
        </button>
      </div>
    );
  }

  // ── UI: active camera ─────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Camera viewport */}
        <div
          className="relative w-full overflow-hidden rounded-3xl"
          style={{
            height: "min(72vh, 680px)",
            minHeight: "360px",
            background: "#1a1a2e",
            boxShadow: "8px 8px 20px #b8bec7, -8px -8px 20px #ffffff",
          }}
        >
          {/* Video feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />

          {/* Viewfinder box */}
          <div
            className="absolute"
            style={{
              top: "20%", left: "20%",
              width: "60%", height: "60%",
            }}
          >
            {/* Corner markers */}
            <Corner pos="tl" />
            <Corner pos="tr" />
            <Corner pos="bl" />
            <Corner pos="br" />

            {/* Animated scan line — only when scanning */}
            {scanResult === null && (
              <div
                style={{
                  position: "absolute",
                  left: 4, right: 4,
                  top: `${scanLine}%`,
                  height: 2,
                  background: "linear-gradient(90deg, transparent, #26c6da, transparent)",
                  boxShadow: "0 0 6px #26c6da",
                  borderRadius: 2,
                  transition: "top 0.016s linear",
                }}
              />
            )}

            {/* Found overlay */}
            {scanResult === "found" && (
              <div
                className="absolute inset-0 flex items-center justify-center rounded-xl"
                style={{ background: "rgba(0,137,123,0.25)", border: "2px solid #00897b" }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(0,137,123,0.85)" }}
                >
                  <Check size={24} color="#fff" strokeWidth={2.5} />
                </div>
              </div>
            )}

            {/* Not found overlay */}
            {scanResult === "unknown" && (
              <div
                className="absolute inset-0 flex items-center justify-center rounded-xl"
                style={{ background: "rgba(229,62,62,0.20)", border: "2px solid #e53e3e" }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(229,62,62,0.85)" }}
                >
                  <X size={24} color="#fff" strokeWidth={2.5} />
                </div>
              </div>
            )}
          </div>

          {/* Status pill at bottom of viewport */}
          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full"
            style={{
              background: scanResult === "found"
                ? "rgba(0,137,123,0.85)"
                : scanResult === "unknown"
                ? "rgba(229,62,62,0.85)"
                : "rgba(30,30,50,0.65)",
              backdropFilter: "blur(4px)",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>
              {scanResult === "found"
                ? "QR reconocido"
                : scanResult === "unknown"
                ? "QR no reconocido"
                : "Buscando código QR…"}
            </span>
          </div>

          <div
            className="absolute top-3 left-3 px-2 py-1 rounded-md"
            style={{ background: "rgba(20,20,30,0.6)", backdropFilter: "blur(2px)" }}
          >
            <span style={{ fontSize: "10px", color: "#dbe3ee", fontWeight: 500 }}>{videoStats}</span>
          </div>
        </div>

        {/* Info row */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: "#e8ecf0", boxShadow: "inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff" }}
        >
          <ScanLine size={15} color="#26c6da" strokeWidth={2} />
          <p style={{ fontSize: "12px", color: "#8a9bb0", margin: 0, lineHeight: 1.5 }}>
            Encuadrá el código QR dentro del área de escaneo. Al detectar un invitado, se abrirá su perfil automáticamente.
          </p>
        </div>

        {/* Stop camera button */}
        <div className="flex gap-3">
          <button
            onClick={switchCamera}
            className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2"
            style={{
              background: "#e8ecf0",
              boxShadow: "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff",
              border: "none", cursor: "pointer",
            }}
          >
            <RefreshCw size={16} color="#26c6da" strokeWidth={2} />
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#3d4a5c" }}>
              Cambiar cámara
            </span>
          </button>

          <button
            onClick={() => { stopCamera(); setCamState("idle"); setScanResult(null); setFoundGuest(null); cooldownRef.current = false; }}
            className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2"
            style={{
              background: "#e8ecf0",
              boxShadow: "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff",
              border: "none", cursor: "pointer",
            }}
          >
            <CameraOff size={16} color="#e53e3e" strokeWidth={2} />
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#8a9bb0" }}>Detener cámara</span>
          </button>
        </div>
      </div>

      {/* Hidden canvas for frame processing */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Guest sheet modal — opens automatically on QR match */}
      {foundGuest && (
        <ScannerGuestSheet
          guest={foundGuest}
          onClose={handleCloseSheet}
          onConfirmPresence={handleMarkPresent}
        />
      )}
    </>
  );
}
