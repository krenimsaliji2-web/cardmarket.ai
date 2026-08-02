import { prisma } from "@/lib/prisma";
import { Role, type ReportStatus } from "@/prisma/generated/prisma/client";

export type UpdateReportStatusResult =
  | { status: "updated" }
  | { status: "not_found" }
  | { status: "unauthorized" };

/**
 * Ändert den Status einer Meldung. Nur ADMIN darf das – der Rollen-Check
 * läuft hier im Service selbst (Verteidigung in der Tiefe zusätzlich zum
 * Check in app/admin/reports/actions.ts, gleiches Prinzip wie
 * services/admin/getDashboard.ts).
 */
export async function updateReportStatus(
  callerId: string,
  reportId: string,
  newStatus: ReportStatus,
): Promise<UpdateReportStatusResult> {
  const caller = await prisma.user.findUnique({
    where: { id: callerId },
    select: { role: true },
  });

  if (!caller || caller.role !== Role.ADMIN) {
    return { status: "unauthorized" };
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { id: true },
  });

  if (!report) {
    return { status: "not_found" };
  }

  await prisma.report.update({
    where: { id: reportId },
    data: { status: newStatus },
  });

  return { status: "updated" };
}
