import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { NotificationType } from "@/prisma/generated/prisma/client";
import { getNotifications } from "@/services/notifications/getNotifications";
import { getUnreadNotificationCount } from "@/services/notifications/getUnreadNotificationCount";
import { formatDate } from "@/utils/formatDate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { MarkAllReadButton } from "./mark-all-read-button";
import { NotificationActions } from "./notification-actions";

export const metadata: Metadata = {
  title: "Meine Benachrichtigungen – Project Atlas",
};

const TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.ORDER]: "Bestellung",
  [NotificationType.REVIEW]: "Bewertung",
  [NotificationType.PRICE_ALERT]: "Preisalarm",
  [NotificationType.SYSTEM]: "System",
  [NotificationType.ADMIN]: "Admin",
  [NotificationType.MESSAGE]: "Nachricht",
};

interface MyNotificationsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function MyNotificationsPage({ searchParams }: MyNotificationsPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const { page: pageParam } = await searchParams;
  const requestedPage = pageParam ? Number.parseInt(pageParam, 10) : 1;

  const [unreadCount, notifications] = await Promise.all([
    getUnreadNotificationCount(session.user.id),
    getNotifications(session.user.id, {
      page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(notifications.total / notifications.pageSize));
  const currentPage = Math.min(Math.max(notifications.page, 1), totalPages);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Meine Benachrichtigungen</h1>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      <Card className="w-fit">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Ungelesen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tracking-tight">{unreadCount}</p>
        </CardContent>
      </Card>

      {notifications.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Du hast noch keine Benachrichtigungen.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.items.map((notification) => (
            <Card key={notification.id} className={notification.isRead ? "opacity-70" : undefined}>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{notification.title}</p>
                    <Badge variant="secondary">{TYPE_LABELS[notification.type]}</Badge>
                    <Badge variant={notification.isRead ? "outline" : "default"}>
                      {notification.isRead ? "Gelesen" : "Ungelesen"}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground/90">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(notification.createdAt)}</p>
                  {notification.link && (
                    <Link
                      href={notification.link}
                      className="text-sm text-primary underline-offset-4 hover:underline"
                    >
                      Ansehen
                    </Link>
                  )}
                </div>

                <NotificationActions notificationId={notification.id} isRead={notification.isRead} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4">
          {currentPage > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/my-notifications?page=${currentPage - 1}`}>Zurück</Link>
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
              <Link href={`/my-notifications?page=${currentPage + 1}`}>Weiter</Link>
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
