"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import type { ReportStatus } from "@/prisma/generated/prisma/client";
import { deleteReport } from "@/services/reports/deleteReport";
import { updateReportStatus } from "@/services/reports/updateReportStatus";

export interface ReportActionResult {
  success: boolean;
  error?: string;
}

/**
 * Wie app/admin/page.tsx: kein Redirect bei fehlender Session, sondern
 * notFound() – "Nicht-Admins erhalten 404. Kein Redirect." gilt auch für
 * Actions, nicht nur für den Seitenaufruf.
 */
async function requireSessionUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    notFound();
  }

  return session.user.id;
}

export async function updateReportStatusAction(
  reportId: string,
  status: ReportStatus,
): Promise<ReportActionResult> {
  const userId = await requireSessionUserId();
  const result = await updateReportStatus(userId, reportId, status);

  if (result.status === "unauthorized") {
    notFound();
  }

  if (result.status === "not_found") {
    return { success: false, error: "Diese Meldung wurde nicht gefunden." };
  }

  revalidatePath("/admin/reports");
  return { success: true };
}

export async function deleteReportAction(reportId: string): Promise<ReportActionResult> {
  const userId = await requireSessionUserId();
  const result = await deleteReport(userId, reportId);

  if (result.status === "unauthorized") {
    notFound();
  }

  if (result.status === "not_found") {
    return { success: false, error: "Diese Meldung wurde nicht gefunden." };
  }

  revalidatePath("/admin/reports");
  return { success: true };
}
