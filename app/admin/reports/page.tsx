import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { ReportStatus, ReportType } from "@/prisma/generated/prisma/client";
import { getReports } from "@/services/reports/getReports";
import { formatDate } from "@/utils/formatDate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AdminNav } from "../admin-nav";
import { ReportFilters } from "./report-filters";
import { ReportRowActions } from "./report-actions";

export const metadata: Metadata = {
  title: "Meldungen – Project Atlas",
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  [ReportStatus.OPEN]: "Offen",
  [ReportStatus.IN_PROGRESS]: "In Bearbeitung",
  [ReportStatus.RESOLVED]: "Gelöst",
  [ReportStatus.REJECTED]: "Abgelehnt",
};

const TYPE_LABELS: Record<ReportType, string> = {
  [ReportType.LISTING]: "Listing",
  [ReportType.REVIEW]: "Bewertung",
  [ReportType.USER]: "Benutzer",
};

const VALID_STATUSES: string[] = Object.values(ReportStatus);
const VALID_TYPES: string[] = Object.values(ReportType);

interface AdminReportsPageProps {
  searchParams: Promise<{ status?: string; type?: string; page?: string }>;
}

export default async function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    notFound();
  }

  const { status: statusParam, type: typeParam, page: pageParam } = await searchParams;
  const status = VALID_STATUSES.includes(statusParam ?? "") ? (statusParam as ReportStatus) : undefined;
  const type = VALID_TYPES.includes(typeParam ?? "") ? (typeParam as ReportType) : undefined;
  const requestedPage = pageParam ? Number.parseInt(pageParam, 10) : 1;
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  // Die Route ruft ausschließlich getReports() auf – keine eigenen
  // Prisma-Abfragen hier.
  const result = await getReports(session.user.id, { status, type, page });

  if (!result) {
    notFound();
  }

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const currentPage = Math.min(Math.max(result.page, 1), totalPages);

  const currentParams = new URLSearchParams();
  if (status) currentParams.set("status", status);
  if (type) currentParams.set("type", type);

  function buildPageHref(targetPage: number): string {
    const params = new URLSearchParams(currentParams);
    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }
    const qs = params.toString();
    return `/admin/reports${qs ? `?${qs}` : ""}`;
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Meldungen</h1>

      <AdminNav active="reports" />

      <Card className="w-56">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Offene Meldungen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tracking-tight">{result.openCount}</p>
        </CardContent>
      </Card>

      <ReportFilters initial={{ status: status ?? "", type: type ?? "" }} />

      {result.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Meldungen gefunden.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {result.items.map((report) => (
            <Card key={report.id}>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{TYPE_LABELS[report.type]}</Badge>
                    <Badge variant={report.status === ReportStatus.OPEN ? "default" : "outline"}>
                      {STATUS_LABELS[report.status]}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">Ziel-ID: {report.targetId}</span>
                  </div>
                  <p className="text-sm font-medium">{report.reason}</p>
                  {report.description && (
                    <p className="text-sm text-foreground/90">{report.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Gemeldet von {report.reporterName} ({report.reporterEmail}) ·{" "}
                    {formatDate(report.createdAt)}
                  </p>
                </div>

                <ReportRowActions reportId={report.id} status={report.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4">
          {currentPage > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={buildPageHref(currentPage - 1)}>Zurück</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Zurück
            </Button>
          )}

          <p className="text-sm text-muted-foreground">
            Seite {currentPage} von {totalPages}
          </p>

          {currentPage < totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={buildPageHref(currentPage + 1)}>Weiter</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Weiter
            </Button>
          )}
        </nav>
      )}
    </main>
  );
}
