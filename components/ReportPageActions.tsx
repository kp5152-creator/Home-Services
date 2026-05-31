"use client";

import { Button, ButtonLink } from "@/components/ui";
import { trackAnalyticsEvent } from "@/hooks/useAnalytics";

export default function ReportPageActions({ pdfUrl }: { pdfUrl: string }) {
  function trackReportAction(target: string) {
    trackAnalyticsEvent({
      name: "workflow_step",
      screen: "Report",
      workflow: "report",
      target
    });
  }

  return (
    <div className="no-print flex flex-wrap gap-3">
      <Button
        type="button"
        onClick={() => {
          trackReportAction("print_or_save_pdf");
          window.print();
        }}
        variant="soft"
        size="lg"
      >
        Print / Save PDF
      </Button>
      <ButtonLink
        href={pdfUrl}
        onClick={() => trackReportAction("download_pdf")}
        size="lg"
        target="_blank"
        rel="noreferrer"
      >
        Download PDF File
      </ButtonLink>
      <ButtonLink href="/demo" onClick={() => trackReportAction("back_to_app")} size="lg">
        Back
      </ButtonLink>
    </div>
  );
}
