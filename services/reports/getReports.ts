import { prisma } from "@/lib/prisma";
import { Role, type ReportStatus, type ReportType } from "@/prisma/generated/prisma/client";

export interface ReportListItem {
  id: string;
  reporterName: string;
  reporterEmail: string;
  type: ReportType;
  targetId: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  createdAt: Date;
}

export interface GetReportsOptions {
  status?: ReportStatus;
  type?: ReportType;
  page?: number;
  pageSize?: number;
}

export interface GetReportsResult {
  items: ReportListItem[];
  total: number;
  openCount: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Lädt Meldungen für das Admin-Dashboard (/admin/reports). Gibt `null`
 * zurück, wenn der Aufrufer nicht existiert oder `role !== ADMIN` ist –
 * gleiches Muster wie services/admin/getDashboard.ts (kein Redirect, keine
 * Informationspreisgabe; die Route zeigt in diesem Fall notFound()).
 *
 * `openCount` ist bewusst UNABHÄNGIG von status/type-Filtern (immer die
 * Gesamtzahl offener Meldungen), da die Route diese Zahl als feste
 * Kennzahl über den Filtern anzeigt.
 *
 * Echte DB-seitige Pagination + Sortierung (analog zu
 * getNotifications.ts) statt "alles laden + in JS filtern/paginieren" –
 * Reports können sich unbegrenzt ansammeln.
 */
export async function getReports(
  callerId: string,
  options: GetReportsOptions = {},
): Promise<GetReportsResult | null> {
  const caller = await prisma.user.findUnique({
    where: { id: callerId },
    select: { role: true },
  });

  if (!caller || caller.role !== Role.ADMIN) {
    return null;
  }

  const page = options.page && options.page > 0 ? options.page : 1;
  const pageSize = options.pageSize && options.pageSize > 0 ? options.pageSize : DEFAULT_PAGE_SIZE;

  const where = {
    ...(options.status ? { status: options.status } : {}),
    ...(options.type ? { type: options.type } : {}),
  };

  const [itemsRaw, total, openCount] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        type: true,
        targetId: true,
        reason: true,
        description: true,
        status: true,
        createdAt: true,
        reporter: { select: { name: true, email: true } },
      },
    }),
    prisma.report.count({ where }),
    prisma.report.count({ where: { status: "OPEN" } }),
  ]);

  return {
    items: itemsRaw.map((report) => ({
      id: report.id,
      reporterName: report.reporter.name,
      reporterEmail: report.reporter.email,
      type: report.type,
      targetId: report.targetId,
      reason: report.reason,
      description: report.description,
      status: report.status,
      createdAt: report.createdAt,
    })),
    total,
    openCount,
    page,
    pageSize,
  };
}
