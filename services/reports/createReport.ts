import { prisma } from "@/lib/prisma";
import { ReportStatus, ReportType } from "@/prisma/generated/prisma/client";

export interface CreateReportInput {
  reporterId: string;
  type: ReportType;
  targetId: string;
  reason: string;
  description?: string;
}

export interface CreateReportResult {
  id: string;
}

/**
 * Legt eine Meldung an. Dies ist die EINZIGE Stelle, über die zukünftige
 * Features (Marketplace, Reviews, Profile, ...) Meldungen erzeugen sollen
 * ("Spätere Features sollen createReport() verwenden") – dieses Feature
 * selbst ruft die Funktion an keiner Stelle automatisch auf (reine
 * Foundation, keine Melde-Buttons irgendwo).
 *
 * `reporterId` kommt ausschließlich aus der Server-Session des Aufrufers
 * (siehe app/admin/reports/actions.ts), niemals aus Client-Eingaben – so
 * ist sichergestellt, dass ausschließlich die eigene Reporter-ID
 * gespeichert wird. Jeder eingeloggte Benutzer darf melden, kein
 * Rollen-Check nötig.
 */
export async function createReport(input: CreateReportInput): Promise<CreateReportResult> {
  return prisma.report.create({
    data: {
      reporterId: input.reporterId,
      type: input.type,
      targetId: input.targetId,
      reason: input.reason,
      description: input.description ?? null,
      status: ReportStatus.OPEN,
    },
    select: { id: true },
  });
}

export { ReportType, ReportStatus };
