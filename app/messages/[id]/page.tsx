import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getConversation } from "@/services/messages/getConversation";
import { formatMessageTimestamp } from "@/utils/formatDate";

import { MarkReadOnView } from "./mark-read-on-view";
import { MessageInput } from "./message-input";
import { MessageListScroll } from "./message-list-scroll";

interface ConversationPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Chat – Project Atlas",
};

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const conversation = await getConversation(id, session.user.id);

  if (!conversation) {
    notFound();
  }

  return (
    <main className="mx-auto flex h-[calc(100vh-5rem)] max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <MarkReadOnView conversationId={conversation.id} />

      <div className="flex items-center gap-3 border-b pb-4">
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
          {conversation.otherParticipant.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- lokale/externe Bild-URL.
            <img src={conversation.otherParticipant.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-muted-foreground">
              {conversation.otherParticipant.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{conversation.otherParticipant.name}</p>
          {conversation.listing && (
            <p className="truncate text-xs text-muted-foreground">
              Bezüglich: {conversation.listing.cardName}
            </p>
          )}
        </div>
      </div>

      <MessageListScroll scrollKey={conversation.messages.length}>
        {conversation.messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Nachrichten. Schreib die erste!</p>
        ) : (
          conversation.messages.map((message) => {
            const isOwn = message.senderId === session.user.id;
            return (
              <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-line">{message.message}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {formatMessageTimestamp(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </MessageListScroll>

      <MessageInput conversationId={conversation.id} />
    </main>
  );
}
