import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import { useAuthStore } from "../store/authStore";
import Layout from "../components/Layout";
import type { ChatMessage } from "../lib/types";
import { ArrowLeft, Send } from "lucide-react";

export default function CookbookChat() {
  const { cookbookId } = useParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [cookbookName, setCookbookName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const currentUser = useAuthStore((s) => s.user);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cookbookId) return;

    api.get(`/cookbooks/${cookbookId}/messages`).then((res) => {
      setMessages(res.data.messages);
    }).catch(() => {
      setError("Impossible de charger l'historique des messages");
    });

    api.get(`/cookbooks/${cookbookId}`).then((res) => {
      setCookbookName(res.data.cookbook.name);
    });

    const socket = getSocket();
    socket.emit("join-cookbook", cookbookId);

    function handleNewMessage(message: ChatMessage) {
      if (message.cookbookId === cookbookId) {
        setMessages((prev) => [...prev, message]);
      }
    }

    function handleMessageUpdated(message: ChatMessage) {
      setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
    }

    function handleMessageDeleted(data: { messageId: string; cookbookId: string }) {
      if (data.cookbookId === cookbookId) {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
      }
    }

    function handleError(err: { message: string }) {
      setError(err.message);
    }

    socket.on("new-message", handleNewMessage);
    socket.on("message-updated", handleMessageUpdated);
    socket.on("message-deleted", handleMessageDeleted);
    socket.on("error", handleError);

    return () => {
      socket.emit("leave-cookbook", cookbookId);
      socket.off("new-message", handleNewMessage);
      socket.off("message-updated", handleMessageUpdated);
      socket.off("message-deleted", handleMessageDeleted);
      socket.off("error", handleError);
    };
  }, [cookbookId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !cookbookId) return;
    const socket = getSocket();
    socket.emit("send-message", { cookbookId, content });
    setContent("");
  }

  function startEdit(m: ChatMessage) {
    setEditingId(m.id);
    setEditingContent(m.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingContent("");
  }

  function handleSaveEdit(messageId: string) {
    if (!editingContent.trim()) return;
    const socket = getSocket();
    socket.emit("edit-message", { messageId, content: editingContent });
    cancelEdit();
  }

  function handleDeleteMessage(messageId: string) {
    if (!confirm("Supprimer ce message ?")) return;
    const socket = getSocket();
    socket.emit("delete-message", { messageId });
  }

  return (
    <Layout>
      <Link to={`/cookbooks/${cookbookId}`} className="inline-flex items-center gap-1 text-sm text-ink/50 hover:text-paprika mb-4">
        <ArrowLeft size={14} /> {cookbookName}
      </Link>
      <h1 className="font-display text-3xl font-bold mb-6">Discussion</h1>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="border border-line rounded-2xl bg-paper p-4 h-[28rem] overflow-y-auto flex flex-col gap-3 mb-4">
        {messages.map((m) => {
          const isMine = m.userId === currentUser?.id;
          const isEditingThis = editingId === m.id;

          return (
            <div key={m.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
              <span className="text-xs font-mono text-ink/40 mb-0.5">{m.user.firstName} {m.user.lastName}</span>
              {isEditingThis ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="border border-line rounded px-2 py-1 text-sm"
                  />
                  <button onClick={() => handleSaveEdit(m.id)} className="text-xs text-paprika">OK</button>
                  <button onClick={cancelEdit} className="text-xs text-ink/40">Annuler</button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className={`px-3 py-1.5 rounded-2xl text-sm max-w-xs ${isMine ? "bg-indigo text-cream" : "bg-cream border border-line"}`}>
                    {m.content}
                  </span>
                  {isMine && (
                    <span className="flex gap-1 text-xs text-ink/40">
                      <button onClick={() => startEdit(m)} className="hover:text-paprika">Modifier</button>
                      <button onClick={() => handleDeleteMessage(m.id)} className="hover:text-red-500">Suppr.</button>
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {messages.length === 0 && <p className="text-ink/40 text-sm text-center mt-8">Aucun message pour l'instant.</p>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          placeholder="Écrire un message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-paprika"
        />
        <button type="submit" className="bg-indigo text-cream rounded-lg px-4 py-2.5 flex items-center gap-1.5 text-sm font-medium hover:bg-indigo-light">
          <Send size={15} /> Envoyer
        </button>
      </form>
    </Layout>
  );
}
