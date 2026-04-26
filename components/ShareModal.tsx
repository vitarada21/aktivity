"use client";

import { useEffect, useState } from "react";

export function ShareModal() {
  const [open, setOpen] = useState(false);
  const [fontSize, setFontSize] = useState(220);
  const [fontSizeInput, setFontSizeInput] = useState("220");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const previewUrl = `/api/snapshot?fontSize=${fontSize}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium uppercase tracking-wider rounded-lg border-2 border-foreground/30 hover:border-foreground hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
      >
        Share Snapshot
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/10">
              <h3 className="font-bold uppercase tracking-wider text-sm">
                Snapshot Preview
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-2xl leading-none text-foreground/60 hover:text-foreground w-8 h-8 flex items-center justify-center"
                aria-label="Zavřít"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-foreground/5">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-[60vh] w-auto shadow-lg"
              />
            </div>

            <div className="px-6 py-4 border-t border-foreground/10 flex flex-col gap-4">
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="text-xs uppercase tracking-wider font-medium">
                    Velikost měsíce
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={50}
                      max={500}
                      step={1}
                      value={fontSizeInput}
                      onChange={(e) => {
                        setFontSizeInput(e.target.value);
                        const v = Number(e.target.value);
                        if (!Number.isNaN(v) && v >= 50 && v <= 500) {
                          setFontSize(v);
                        }
                      }}
                      onBlur={() => {
                        const v = Number(fontSizeInput);
                        const clamped = Number.isNaN(v)
                          ? fontSize
                          : Math.max(50, Math.min(500, v));
                        setFontSize(clamped);
                        setFontSizeInput(String(clamped));
                      }}
                      className="w-20 px-2 py-1 text-sm text-right tabular-nums border border-foreground/20 rounded focus:outline-none focus:border-foreground"
                    />
                    <span className="text-sm text-foreground/60">px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={100}
                  max={400}
                  step={1}
                  value={fontSize}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setFontSize(v);
                    setFontSizeInput(String(v));
                  }}
                  className="w-full accent-accent"
                />
              </div>

              <a
                href={previewUrl}
                download="snapshot.png"
                className="block text-center px-6 py-3 text-sm font-medium uppercase tracking-wider rounded-lg bg-foreground text-white hover:opacity-90 transition-opacity"
              >
                Stáhnout PNG
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
