"use client";

import { Download, FileText, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ReportActions({ reportId }: { reportId: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer /> Export PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          window.location.href = `/wellbeing/reports/${reportId}/export?format=csv`;
        }}
      >
        <FileText /> CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          window.location.href = `/wellbeing/reports/${reportId}/export?format=xlsx`;
        }}
      >
        <Download /> XLSX
      </Button>
    </div>
  );
}
