"use client";

import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ChangeEvent,
  type DragEvent,
  useRef,
} from "react";
import { mostrarConfirmacion, mostrarExito, mostrarError } from "@/lib/alerts";
import { logOk, logFail } from "@/lib/bitacora";
import {
  Loader2,
  Download,
  RotateCcw,
  ShieldCheck,
  HardDrive,
  FileDown,
  FileUp,
  AlertTriangle,
} from "lucide-react";

/* ---------------- Types ---------------- */
type Me = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  permissions: string[];
};

type BackupFormat = "sql" | "dump";

/* ---------------- Utils ---------------- */
function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return "Error desconocido";
  }
}

export default function AdminBackups() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const [format, setFormat] = useState<BackupFormat>("sql");
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // metadatos para bitácora
  const userId =
    Number(
      typeof localStorage !== "undefined"
        ? localStorage.getItem("auth.userId") ?? 0
        : 0,
    ) || null;
  const ip =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("auth.ip") ?? null
      : null;

  // permisos flexibles (acepta backup.export/restore o cae a user.create)
  const has = useCallback(
    (perm: string) => Boolean(me?.permissions?.includes(perm)),
    [me],
  );
  const canExport = useMemo(
    () => has("backup.export") || has("user.create"),
    [has],
  );
  const canRestore = useMemo(
    () => has("backup.restore") || has("user.create"),
    [has],
  );

  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });
        setMe(meRes.ok ? await meRes.json() : null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ========= Exportar ========= */
  const exportNow = async () => {
    if (!canExport) return;
    setError("");

    const fmtText = format === "sql" ? ".sql.gz" : ".dump";
    const c = await mostrarConfirmacion({
      titulo: "Exportar backup",
      texto: `Se generará un backup en formato ${fmtText}.`,
      confirmText: `Exportar ${fmtText}`,
      cancelText: "Cancelar",
      icono: "info",
    });
    if (!c.isConfirmed) return;

    try {
      const qs = format === "sql" ? "sql" : "dump";
      window.location.href = `/api/backup/export?format=${qs}`;
      setLastBackupAt(new Date().toLocaleString("es-BO")); // marca visual
      await logOk(`Exportar backup ${fmtText}`, { userId, ip });
    } catch (e: unknown) {
      await logFail(`Exportar backup ${fmtText}`, { userId, ip });
      const m = errMsg(e);
      setError(m);
      mostrarError("No se pudo exportar el backup.");
    }
  };

  /* ========= Restaurar ========= */
  const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
    setError("");
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const acceptExt = [".sql", ".sql.gz", ".dump", ".dump.gz", ".custom"];
  const isValidExt = (name = "") =>
    acceptExt.some((ext) => name.toLowerCase().endsWith(ext));

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!isValidExt(f.name)) {
      setError("Extensiones válidas: .sql, .sql.gz, .dump, .dump.gz, .custom");
      mostrarError("Extensión no soportada.");
      return;
    }
    setFile(f);
  };

  const restore = async () => {
    if (!canRestore) return;
    setError("");
    if (!file) {
      setError("Selecciona un archivo .sql/.sql.gz/.dump/.dump.gz");
      mostrarError("Selecciona un archivo válido.");
      return;
    }
    if (!isValidExt(file.name)) {
      setError("Extensiones válidas: .sql, .sql.gz, .dump, .dump.gz, .custom");
      mostrarError("Extensión no soportada.");
      return;
    }

    const c = await mostrarConfirmacion({
      titulo: "Restaurar sistema",
      texto:
        "Esto sobreescribirá la base de datos. Asegúrate de tener un backup reciente.",
      confirmText: "Sí, restaurar",
      cancelText: "Cancelar",
      icono: "warning",
    });
    if (!c.isConfirmed) return;

    setRestoring(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/backup/restore", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const j = await r.json().catch(() => ({} as unknown));
      if (!r.ok) {
        await logFail("Restaurar backup", { userId, ip });
        throw new Error(
          typeof j === "object" && j !== null && "message" in j
            ? String((j as { message?: unknown }).message ?? "Error al restaurar")
            : "Error al restaurar",
        );
      }
      await logOk("Restaurar backup", { userId, ip });
      mostrarExito("Restauración completada.");
    } catch (e: unknown) {
      const m = errMsg(e);
      setError(m);
      mostrarError(m);
    } finally {
      setRestoring(false);
    }
  };

  /* ========= Render ========= */
  if (loading) {
    return (
      <div className="mt-6 flex items-center gap-2 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
      </div>
    );
  }
  if (!me || (!canExport && !canRestore)) return <p className="mt-6">No autorizado.</p>;

  return (
    <section className="mt-3 md:mt-5 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-emerald-600" />
          <div>
            <h1 className="text-xl font-semibold leading-tight">Backups del sistema</h1>
            <div className="mt-1 h-0.5 w-24 rounded bg-emerald-600/70" />
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="hidden md:inline-flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50"
          title="Refrescar"
        >
          <RotateCcw className="h-4 w-4" /> Refrescar
        </button>
      </header>

      {/* GRID: Exportar / Restaurar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ======= Card Exportar ======= */}
        <div className="rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold">Crear Backup</h2>
            </div>
            {lastBackupAt && (
              <span className="text-xs text-gray-500">Último: {lastBackupAt}</span>
            )}
          </div>

          <div className="mt-4 grid gap-4">
            {/* Selector formato */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">Formato</label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="fmt"
                    className="accent-blue-600"
                    checked={format === "sql"}
                    onChange={() => setFormat("sql")}
                  />
                  <span className="text-sm">SQL comprimido (.sql.gz)</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="fmt"
                    className="accent-indigo-600"
                    checked={format === "dump"}
                    onChange={() => setFormat("dump")}
                  />
                  <span className="text-sm">Custom dump (.dump)</span>
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                <b>.dump</b> se restaura más rápido con <code>pg_restore</code>.{" "}
                <b>.sql.gz</b> es portable y legible.
              </p>
            </div>

            {/* Botón exportar */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Descarga directa al dispositivo (stream) sin almacenamiento temporal.
              </div>
              {canExport && (
                <button
                  onClick={exportNow}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-2 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  Exportar {format === "sql" ? ".sql.gz" : ".dump"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ======= Card Restaurar ======= */}
        <div className="rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-emerald-600" />
            <h2 className="font-semibold">Restaurar Backup</h2>
          </div>

          <div className="mt-4 grid gap-4">
            {/* Dropzone */}
            <label
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(false);
              }}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={[
                "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition cursor-pointer",
                dragOver
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-gray-300 hover:bg-gray-50",
              ].join(" ")}
            >
              <FileUp className="h-6 w-6 text-gray-500" />
              <div className="text-sm">
                Arrastra tu archivo aquí o{" "}
                <span className="text-emerald-600 font-medium">
                  haz clic para seleccionar
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Acepta: .sql, .sql.gz, .dump, .dump.gz, .custom
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".sql,.sql.gz,.dump,.dump.gz,.custom"
                className="hidden"
                onChange={onPickFile}
              />
            </label>

            {/* Selección/Acción */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-gray-700 truncate">
                {file ? (
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Archivo:{" "}
                    <b className="truncate max-w-[240px]">{file.name}</b>
                    {file.size ? (
                      <span className="text-xs text-gray-500">
                        ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-gray-500">Ningún archivo seleccionado</span>
                )}
              </div>

              {canRestore && (
                <button
                  onClick={restore}
                  disabled={restoring || !file}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 text-white px-3 py-2 disabled:opacity-60 hover:bg-emerald-700"
                >
                  {restoring ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  {restoring ? "Restaurando…" : "Restaurar"}
                </button>
              )}
            </div>

            <div className="flex items-start gap-2 text-xs text-gray-600">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
              <p>
                La restauración sobrescribe la BD. Verifica ambiente y credenciales antes de
                proceder. Para cargas pesadas, prefiere <b>.dump</b> (más rápido con{" "}
                <code>pg_restore</code>).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer acciones y errores */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <button
          onClick={() => {
            setFormat("sql");
            setFile(null);
            setError("");
          }}
          className="inline-flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50"
        >
          <RotateCcw className="h-4 w-4" /> Limpiar selección
        </button>

        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>
    </section>
  );
}
