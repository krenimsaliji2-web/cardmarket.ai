import { prisma } from "@/lib/prisma";
import { Role, type ReportStatus, type ReportType } from "@/prisma/generated/prisma/client";

export interface ReportDetail {
  id: string;
  reporterName: string;
  reporterEmail: string;
  type: ReportType;
  targetId: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lädt eine einzelne Meldung. Gibt `null` zurück, wenn der Aufrufer nicht
 * ADMIN ist ODER die Meldung nicht existiert – beide Fälle werden bewusst
 * zu `null` zusammengefasst (kein Unterschied nach außen erkennbar),
 * gleiches Muster wie services/admin/getDashboard.ts.
 */
export async function getReport(callerId: string, reportId: string): Promise<ReportDetail | null> {
  const caller = await prisma.user.findUnique({
    where: { id: callerId },
    select: { role: true },
  });

  if (!caller || caller.role !== Role.ADMIN) {
    return null;
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      type: true,
      targetId: true,
      reason: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      reporter: { select: { name: true, email: true } },
    },
  });

  if (!report) {
    return null;
  }

  return {
    id: report.id,
    reporterName: report.reporter.name,
    reporterEmail: report.reporter.email,
    type: report.type,
    targetId: report.targetId,
    reason: report.reason,
    description: report.description,
    status: report.status,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}
