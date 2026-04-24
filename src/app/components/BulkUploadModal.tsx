import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Download,
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  X,
  Users,
} from "lucide-react";

export interface ParsedGuest {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface BulkUploadModalProps {
  eventName: string;
  onClose: () => void;
  onSuccess: (guests: ParsedGuest[]) => void;
}

type Step = "options" | "uploading" | "success" | "error";

// ── Download template ─────────────────────────────────────────────────────────
function downloadTemplate() {
  const data = [
    { ID: "001", Nombre: "Juan Pérez",  Correo: "juan@ejemplo.com",  Telefono: "+54 9 11 1234-5678" },
    { ID: "002", Nombre: "Ana García",  Correo: "ana@ejemplo.com",   Telefono: "+54 9 11 8765-4321" },
    { ID: "003", Nombre: "Luis Moreno", Correo: "luis@ejemplo.com",  Telefono: "+54 9 11 5555-9999" },
  ];
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  ws["!cols"] = [{ wch: 8 }, { wch: 22 }, { wch: 28 }, { wch: 22 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Invitados");
  XLSX.writeFile(wb, "plantilla_invitados.xlsx");
}

// ── Parse uploaded Excel ──────────────────────────────────────────────────────
function parseExcel(file: File): Promise<ParsedGuest[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

        const guests: ParsedGuest[] = rows
          .filter((row) => row["Nombre"] && String(row["Nombre"]).trim())
          .map((row, i) => ({
            id: parseInt(String(row["ID"] ?? "")) || i + 1,
            name: String(row["Nombre"] ?? "").trim(),
            email: String(row["Correo"] ?? "").trim(),
            phone: String(row["Telefono"] ?? "").trim(),
          }));

        resolve(guests);
      } catch {
        reject(new Error("No se pudo leer el archivo. Asegurate de usar la plantilla correcta."));
      }
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo."));
    reader.readAsArrayBuffer(file);
  });
}

// ── Neumorphic button ─────────────────────────────────────────────────────────
function NeuButton({
  children,
  onClick,
  accent = false,
  disabled = false,
  fullWidth = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  accent?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: fullWidth ? "100%" : undefined,
        background: disabled
          ? "#e8ecf0"
          : accent
          ? "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)"
          : "#e8ecf0",
        boxShadow: disabled
          ? "inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff"
          : accent
          ? "5px 5px 12px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.5)"
          : "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff",
        border: "none",
        borderRadius: "16px",
        padding: "14px 20px",
        cursor: disabled ? "default" : "pointer",
        fontSize: "14px",
        fontWeight: 600,
        color: disabled ? "#a0aec0" : accent ? "#fff" : "#3d4a5c",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export function BulkUploadModal({ eventName, onClose, onSuccess }: BulkUploadModalProps) {
  const [step, setStep]           = useState<Step>("options");
  const [parsedGuests, setParsed] = useState<ParsedGuest[]>([]);
  const [errorMsg, setErrorMsg]   = useState("");
  const [dragOver, setDragOver]   = useState(false);
  const fileRef                   = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setErrorMsg("Solo se aceptan archivos .xlsx o .xls");
      setStep("error");
      return;
    }
    setStep("uploading");
    try {
      const guests = await parseExcel(file);
      if (guests.length === 0) {
        setErrorMsg("El archivo no contiene invitados válidos. Usá la plantilla.");
        setStep("error");
        return;
      }
      setParsed(guests);
      setStep("success");
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStep("error");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleAccept = () => {
    onSuccess(parsedGuests);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(60,80,100,0.22)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
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

        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#e8ecf0", boxShadow: "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff" }}
          >
            <FileSpreadsheet size={18} color="#26c6da" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#3d4a5c", margin: 0 }}>
              Carga Masiva
            </h2>
            <p style={{ fontSize: "11px", color: "#8a9bb0", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {eventName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
          >
            <X size={18} color="#a0aec0" strokeWidth={2} />
          </button>
        </div>

        {/* ── STEP: OPTIONS ── */}
        {step === "options" && (
          <>
            {/* Download template */}
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-4 px-4 py-4 rounded-2xl text-left w-full transition-all active:scale-[0.98]"
              style={{
                background: "#e8ecf0",
                boxShadow: "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff",
                border: "none",
                cursor: "pointer",
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,137,123,0.10)" }}
              >
                <Download size={20} color="#00897b" strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#3d4a5c", margin: 0 }}>
                  Descargar Plantilla
                </p>
                <p style={{ fontSize: "11px", color: "#8a9bb0", margin: 0, marginTop: 2 }}>
                  Archivo Excel con las columnas requeridas
                </p>
              </div>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "#d0d6de" }} />
              <span style={{ fontSize: "11px", color: "#a0aec0", fontWeight: 500 }}>o</span>
              <div className="flex-1 h-px" style={{ background: "#d0d6de" }} />
            </div>

            {/* Upload area */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center gap-3 py-8 rounded-2xl cursor-pointer transition-all"
              style={{
                background: "#e8ecf0",
                boxShadow: dragOver
                  ? "inset 5px 5px 10px #b8bec7, inset -5px -5px 10px #ffffff"
                  : "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff",
                border: dragOver ? "2px dashed #26c6da" : "2px dashed #c8d0da",
                transition: "all 0.2s",
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: dragOver ? "rgba(38,198,218,0.12)" : "rgba(160,174,192,0.10)",
                }}
              >
                <Upload size={24} color={dragOver ? "#26c6da" : "#a0aec0"} strokeWidth={1.8} />
              </div>
              <div className="text-center">
                <p style={{ fontSize: "14px", fontWeight: 600, color: dragOver ? "#26c6da" : "#3d4a5c", margin: 0 }}>
                  Subir Listado
                </p>
                <p style={{ fontSize: "11px", color: "#8a9bb0", margin: 0, marginTop: 4 }}>
                  Arrastrá o tocá para seleccionar un .xlsx
                </p>
              </div>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </>
        )}

        {/* ── STEP: UPLOADING ── */}
        {step === "uploading" && (
          <div className="flex flex-col items-center gap-5 py-8">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center"
              style={{ background: "#e8ecf0", boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff" }}
            >
              <FileSpreadsheet size={28} color="#26c6da" strokeWidth={1.8} />
            </div>
            <div className="text-center">
              <p style={{ fontSize: "15px", fontWeight: 600, color: "#3d4a5c", margin: 0 }}>
                Procesando archivo...
              </p>
              <p style={{ fontSize: "12px", color: "#8a9bb0", margin: 0, marginTop: 4 }}>
                Leyendo invitados del Excel
              </p>
            </div>
            {/* Animated bar */}
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#d0d6de" }}>
              <div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #26c6da, #00acc1)",
                  animation: "slideBar 1.2s ease-in-out infinite",
                  width: "60%",
                }}
              />
            </div>
            <style>{`
              @keyframes slideBar {
                0%   { transform: translateX(-100%); }
                100% { transform: translateX(220%); }
              }
            `}</style>
          </div>
        )}

        {/* ── STEP: SUCCESS ── */}
        {step === "success" && (
          <div className="flex flex-col gap-5">
            {/* Success icon */}
            <div className="flex flex-col items-center gap-3 py-4">
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center"
                style={{ background: "rgba(0,137,123,0.12)", boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff" }}
              >
                <Check size={30} color="#00897b" strokeWidth={2.5} />
              </div>
              <div className="text-center">
                <p style={{ fontSize: "22px", fontWeight: 700, color: "#00897b", margin: 0 }}>
                  {parsedGuests.length}
                </p>
                <p style={{ fontSize: "14px", color: "#3d4a5c", margin: 0, marginTop: 2, fontWeight: 600 }}>
                  {parsedGuests.length === 1
                    ? "invitado encontrado"
                    : "invitados encontrados"}
                </p>
                <p style={{ fontSize: "12px", color: "#8a9bb0", margin: 0, marginTop: 4 }}>
                  Se agregarán al evento al confirmar
                </p>
              </div>
            </div>

            {/* Preview list (max 4) */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }}
            >
              {parsedGuests.slice(0, 4).map((g, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < Math.min(parsedGuests.length, 4) - 1 ? "1px solid #d8dfe8" : "none" }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(38,198,218,0.10)" }}
                  >
                    <Users size={13} color="#26c6da" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#3d4a5c", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {g.name}
                    </p>
                    {g.email && (
                      <p style={{ fontSize: "10px", color: "#8a9bb0", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {g.email}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {parsedGuests.length > 4 && (
                <div className="flex items-center justify-center px-4 py-2">
                  <span style={{ fontSize: "11px", color: "#a0aec0" }}>
                    +{parsedGuests.length - 4} invitados más
                  </span>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <NeuButton onClick={onClose} fullWidth={false} style={{ flex: 1 } as React.CSSProperties}>
                Cancelar
              </NeuButton>
              <button
                onClick={handleAccept}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)",
                  boxShadow: "5px 5px 12px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.5)",
                  border: "none",
                  borderRadius: "16px",
                  padding: "14px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                Aceptar
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: ERROR ── */}
        {step === "error" && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-3 py-4">
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center"
                style={{ background: "rgba(229,62,62,0.10)", boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff" }}
              >
                <AlertCircle size={28} color="#e53e3e" strokeWidth={2} />
              </div>
              <div className="text-center">
                <p style={{ fontSize: "15px", fontWeight: 600, color: "#3d4a5c", margin: 0 }}>
                  Error al procesar
                </p>
                <p style={{ fontSize: "12px", color: "#e53e3e", margin: 0, marginTop: 6, lineHeight: 1.5 }}>
                  {errorMsg}
                </p>
              </div>
            </div>
            <NeuButton onClick={() => setStep("options")} fullWidth accent={false}>
              Intentar de nuevo
            </NeuButton>
          </div>
        )}
      </div>
    </div>
  );
}
