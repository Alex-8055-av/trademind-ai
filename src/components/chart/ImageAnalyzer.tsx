import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { analyzeChartImage } from "@/lib/ai/trade-analysis.functions";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ImageAnalyzer() {
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const analyze = useServerFn(analyzeChartImage);

  async function onPick(file: File) {
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Please upload an image under 8MB");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setPreview(dataUrl);
    setAnalysis(null);
    setLoading(true);
    try {
      const res = await analyze({ data: { imageDataUrl: dataUrl } });
      setAnalysis(res.analysis);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel rounded-3xl p-6">
      <div className="flex items-center gap-2">
        <ImagePlus className="h-4 w-4 text-emerald" />
        <p className="font-display text-sm font-semibold">Chart Image Analysis</p>
        <span className="ml-auto text-[10px] text-muted-foreground">TradingView · Zerodha · Groww · Dhan · Angel One</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Upload a chart screenshot from any broker — TradeMind AI will read structure, liquidity, order blocks and produce an institutional report.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <button
            onClick={() => inputRef.current?.click()}
            className="glass-panel flex h-56 w-full flex-col items-center justify-center gap-2 rounded-2xl border-dashed text-sm text-muted-foreground transition-colors hover:border-emerald/40 hover:text-foreground"
          >
            {preview ? (
              <img src={preview} alt="chart preview" className="max-h-full max-w-full rounded-xl object-contain" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6 text-emerald" />
                <span>Click to upload chart image</span>
                <span className="text-[10px]">PNG or JPG · up to 8MB</span>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onPick(f);
              e.target.value = "";
            }}
          />
        </div>

        <div className="glass-panel min-h-56 rounded-2xl p-4 text-sm text-muted-foreground">
          {loading && (
            <div className="flex h-full items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-emerald" />
              Reading chart structure…
            </div>
          )}
          {!loading && !analysis && (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <Sparkles className="mx-auto h-5 w-5 text-emerald" />
                <p className="mt-2">Institutional report will appear here.</p>
              </div>
            </div>
          )}
          {!loading && analysis && (
            <div className="whitespace-pre-wrap leading-relaxed">{analysis}</div>
          )}
        </div>
      </div>
    </div>
  );
}
