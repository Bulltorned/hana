"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { downloadCSVTemplate } from "@/lib/utils/csv-template";
import { Upload, Download, CheckCircle, XCircle } from "lucide-react";

interface CSVImportDialogProps {
  tenantId: string;
  onSuccess?: () => void;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  results: { row: number; status: "ok" | "error"; error?: string }[];
}

export function CSVImportDialog({ tenantId, onSuccess }: CSVImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith(".csv")) {
      setFile(droppedFile);
      setResult(null);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) {
        setFile(selected);
        setResult(null);
      }
    },
    []
  );

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setProgress(10);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setProgress(40);
        const rows = results.data as Record<string, string>[];

        try {
          const res = await fetch("/api/employees/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tenant_id: tenantId, rows }),
          });

          setProgress(90);
          const data: ImportResult = await res.json();
          setResult(data);
          setProgress(100);

          if (data.success > 0) {
            onSuccess?.();
          }
        } catch {
          setResult({
            total: rows.length,
            success: 0,
            failed: rows.length,
            results: [],
          });
        } finally {
          setImporting(false);
        }
      },
    });
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    setProgress(0);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) handleReset();
      }}
    >
      <DialogTrigger className="inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-[13px] font-[500] bg-white/70 border border-white/90 text-muted-foreground hover:text-foreground backdrop-blur-sm shadow-sm transition-all cursor-pointer">
        <Upload className="h-3.5 w-3.5" />
        Import CSV
      </DialogTrigger>
      <DialogContent className="glass sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Karyawan dari CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Template download */}
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCSVTemplate}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Template CSV
          </Button>

          {/* Drop zone */}
          {!result && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-brand-indigo/20 rounded-[var(--radius-md)] p-8 text-center hover:border-brand-indigo/40 transition-colors"
            >
              {file ? (
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-tertiary mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 mx-auto text-tertiary mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop file CSV di sini
                  </p>
                  <label className="text-xs text-brand-indigo hover:underline cursor-pointer mt-1 inline-block">
                    atau pilih file
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-tertiary text-center">
                Mengimpor data...
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 bg-brand-teal/10 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-brand-teal font-mono">
                    {result.success}
                  </div>
                  <div className="text-[10px] text-tertiary">Berhasil</div>
                </div>
                <div className="flex-1 bg-brand-coral/10 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-brand-coral font-mono">
                    {result.failed}
                  </div>
                  <div className="text-[10px] text-tertiary">Gagal</div>
                </div>
              </div>

              {result.results.filter((r) => r.status === "error").length >
                0 && (
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {result.results
                    .filter((r) => r.status === "error")
                    .map((r) => (
                      <div
                        key={r.row}
                        className="flex items-start gap-2 text-xs"
                      >
                        <XCircle className="h-3.5 w-3.5 text-brand-coral shrink-0 mt-0.5" />
                        <span>
                          Baris {r.row}: {r.error}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {result.success > 0 && (
                <div className="flex items-center gap-2 text-sm text-brand-teal">
                  <CheckCircle className="h-4 w-4" />
                  {result.success} karyawan berhasil diimpor
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            {result ? (
              <Button onClick={() => setOpen(false)}>Selesai</Button>
            ) : (
              <Button
                onClick={handleImport}
                disabled={!file || importing}
                className="bg-gradient-to-r from-brand-indigo to-brand-violet text-white"
              >
                {importing ? "Mengimpor..." : "Import"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
