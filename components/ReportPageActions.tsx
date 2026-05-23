"use client";

export default function ReportPageActions({ pdfUrl }: { pdfUrl: string }) {
  return (
    <div className="no-print flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => window.print()}
        className="min-h-11 rounded-lg bg-sage-dark px-5 font-extrabold text-white"
      >
        Print / Save PDF
      </button>
      <a className="grid min-h-11 place-items-center rounded-lg bg-[#edf1ee] px-5 font-extrabold text-ink" href={pdfUrl}>
        Download PDF File
      </a>
      <a className="grid min-h-11 place-items-center rounded-lg bg-[#edf1ee] px-5 font-extrabold text-ink" href="/">
        Back
      </a>
    </div>
  );
}
