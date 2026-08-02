import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getConversations } from "@/services/messages/getConversations";
import { formatMessageTimestamp } from "@/utils/formatDate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Nachrichten – Project Atlas",
};

interface MessagesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const { page: pageParam } = await searchParams;
  const requestedPage = pageParam ? Number.parseInt(pageParam, 10) : 1;
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const conversations = await getConversations(session.user.id, { page });

  const totalPages = Math.max(1, Math.ceil(conversations.total / conversations.pageSize));
  const currentPage = Math.min(Math.max(conversations.page, 1), totalPages);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Nachrichten</h1>

      {conversations.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Du hast noch keine Chats.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.items.map((conversation) => (
            <Link key={conversation.id} href={`/messages/${conversation.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                    {conversation.otherParticipantAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element -- lokale/externe Bild-URL.
                      <img
                        src={conversation.otherParticipantAvatar}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">
                        {conversation.otherParticipantName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">{conversation.otherParticipantName}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatMessageTimestamp(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {conversation.listing && (
                        <span className="text-foreground/70">{conversation.listing.cardName}: </span>
                      )}
                      {conversation.lastMessage ?? "Noch keine Nachrichten."}
                    </p>
                  </div>

                  {conversation.unreadCount > 0 && (
                    <Badge className="shrink-0">{conversation.unreadCount}</Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4">
          {currentPage > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/messages?page=${currentPage - 1}`}>Zurück</Link>
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
              <Link href={`/messages?page=${currentPage + 1}`}>Weiter</Link>
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
