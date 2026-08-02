import { prisma } from "@/lib/prisma";
import { Role } from "@/prisma/generated/prisma/client";

export type DeleteReportResult =
  | { status: "deleted" }
  | { status: "not_found" }
  | { status: "unauthorized" };

/**
 * Löscht eine Meldung endgültig. Nur ADMIN darf das – der Rollen-Check
 * läuft hier im Service selbst (Verteidigung in der Tiefe zusätzlich zum
 * Check in app/admin/reports/actions.ts, gleiches Prinzip wie
 * services/admin/getDashboard.ts).
 */
export async function deleteReport(callerId: string, reportId: string): Promise<DeleteReportResult> {
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

  await prisma.report.delete({ where: { id: reportId } });

  return { status: "deleted" };
}
