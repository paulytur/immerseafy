"use client";

import { useState } from "react";
import { AlertCircle, Check, FileDown, Loader2 } from "lucide-react";

type BookingSummaryDownloadProps = {
  reference: string;
  token: string;
  className?: string;
};

export default function BookingSummaryDownload({
  reference,
  token,
  className = "btn-primary w-full justify-center",
}: BookingSummaryDownloadProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );

  async function downloadPdf() {
    setStatus("loading");

    try {
      const params = new URLSearchParams({ ref: reference, token });
      const response = await fetch(`/api/bookings/summary?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      if (blob.type && !blob.type.includes("pdf")) {
        throw new Error("Invalid PDF response");
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Immerseafy-${reference}.pdf`;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setStatus("done");
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={downloadPdf}
        disabled={status === "loading"}
        className={`${className} inline-flex items-center gap-2`}
      >
        {status === "loading" ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Preparing PDF…
          </>
        ) : status === "done" ? (
          <>
            <Check size={18} />
            Downloaded
          </>
        ) : (
          <>
            <FileDown size={18} />
            Download booking summary
          </>
        )}
      </button>

      {status === "error" ? (
        <p className="flex items-start gap-2 text-sm text-red-400">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          Couldn&apos;t download the PDF. Try again or contact us with your
          booking reference.
        </p>
      ) : null}
    </div>
  );
}
