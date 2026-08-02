import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { getUsers } from "@/services/admin/getUsers";
import { formatDate } from "@/utils/formatDate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { AdminNav } from "../admin-nav";
import { UserSearch } from "./user-search";

export const metadata: Metadata = {
  title: "Benutzer – Project Atlas",
};

interface AdminUsersPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    notFound();
  }

  const { search: searchParam, page: pageParam } = await searchParams;
  const search = searchParam ?? "";
  const requestedPage = pageParam ? Number.parseInt(pageParam, 10) : 1;
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  // Die Route ruft ausschließlich getUsers() auf – keine eigenen
  // Prisma-Abfragen hier.
  const result = await getUsers(session.user.id, { search: search || undefined, page });

  if (!result) {
    notFound();
  }

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const currentPage = Math.min(Math.max(result.page, 1), totalPages);

  function buildPageHref(targetPage: number): string {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return `/admin/users${qs ? `?${qs}` : ""}`;
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Benutzer</h1>

      <AdminNav active="users" />

      <UserSearch initial={search} />

      <p className="text-sm text-muted-foreground">
        {result.total} {result.total === 1 ? "Benutzer" : "Benutzer"} gefunden
      </p>

      {result.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Benutzer gefunden.</p>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">E-Mail</th>
                  <th className="py-2 pr-4 font-medium">Rolle</th>
                  <th className="py-2 pr-4 font-medium">Verkäufer</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">Registriert</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      {user.name}
                      <span className="block text-xs text-muted-foreground">@{user.username}</span>
                    </td>
                    <td className="py-2 pr-4">{user.email}</td>
                    <td className="py-2 pr-4">
                      <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>{user.role}</Badge>
                    </td>
                    <td className="py-2 pr-4">
                      {user.isSeller ? <Badge variant="secondary">Verkäufer</Badge> : "–"}
                    </td>
                    <td className="py-2 pr-4">
                      {user.banned ? (
                        <Badge variant="destructive">Gesperrt</Badge>
                      ) : (
                        <Badge variant="outline">Aktiv</Badge>
                      )}
                    </td>
                    <td className="py-2 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
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
