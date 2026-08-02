import { prisma } from "@/lib/prisma";
import { Role } from "@/prisma/generated/prisma/client";

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  username: string;
  role: Role;
  banned: boolean;
  isSeller: boolean;
  createdAt: Date;
}

export interface GetUsersOptions {
  /** Teiltreffer auf Name, E-Mail oder Username. */
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface GetUsersResult {
  items: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Lädt die Benutzerübersicht für /admin/users. Gibt `null` zurück, wenn der
 * Aufrufer nicht existiert oder `role !== ADMIN` ist – identisches Muster
 * wie services/admin/getDashboard.ts/services/reports/getReports.ts (kein
 * Redirect, keine Informationspreisgabe; die Route zeigt notFound()).
 *
 * Echte DB-seitige Suche/Pagination (kein "alles laden + in JS filtern").
 * "Ist Verkäufer?" wird über EINE zusätzliche, leichte Batch-Query ermittelt
 * (SellerProfile.userId IN (...) der aktuellen Seite) statt einer Query pro
 * Zeile – kein N+1.
 */
export async function getUsers(
  callerId: string,
  options: GetUsersOptions = {},
): Promise<GetUsersResult | null> {
  const caller = await prisma.user.findUnique({
    where: { id: callerId },
    select: { role: true },
  });

  if (!caller || caller.role !== Role.ADMIN) {
    return null;
  }

  const page = options.page && options.page > 0 ? options.page : 1;
  const pageSize = options.pageSize && options.pageSize > 0 ? options.pageSize : DEFAULT_PAGE_SIZE;

  const search = options.search?.trim();
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { username: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [usersRaw, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        banned: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const sellerProfiles = await prisma.sellerProfile.findMany({
    where: { userId: { in: usersRaw.map((user) => user.id) } },
    select: { userId: true },
  });
  const sellerUserIds = new Set(sellerProfiles.map((profile) => profile.userId));

  return {
    items: usersRaw.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      banned: user.banned,
      isSeller: sellerUserIds.has(user.id),
      createdAt: user.createdAt,
    })),
    total,
    page,
    pageSize,
  };
}
