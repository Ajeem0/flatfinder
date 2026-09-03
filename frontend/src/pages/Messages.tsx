import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Send, ShieldAlert } from "lucide-react";
import { api, ApiError } from "../lib/api";
import type { ChatMessage, Conversation } from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function otherPerson(conversation: Conversation, userId: string) {
  return conversation.starter.id === userId ? conversation.recipient : conversation.starter;
}

export default function Messages() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadConversations() {
    try {
      const response = await api.chats.list();
      setConversations(response.results);
      setSelected((current) => current ? response.results.find((item) => item.id === current.id) || current : response.results.find((item) => item.id === searchParams.get("conversation")) || response.results[0] || null);
    } catch { notify("Could not load your messages.", "error"); }
    finally { setLoading(false); }
  }

  async function loadMessages(id: string) {
    try { setMessages((await api.chats.messages(id)).results); }
    catch { notify("Could not load this conversation.", "error"); }
  }

  useEffect(() => {
    loadConversations();
    const interval = window.setInterval(loadConversations, 3000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!selected) return;
    loadMessages(selected.id);
    const interval = window.setInterval(() => loadMessages(selected.id), 3000);
    return () => window.clearInterval(interval);
  }, [selected?.id]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !draft.trim()) return;
    try {
      const response = await api.chats.send(selected.id, draft.trim());
      setMessages((current) => [...current, response.message]);
      setDraft("");
      loadConversations();
    } catch (err) { notify(err instanceof ApiError ? err.message : "Message could not be sent.", "error"); }
  }

  async function blockUser() {
    if (!selected) return;
    try { await api.chats.block(selected.id); notify("User blocked.", "success"); setSelected(null); await loadConversations(); }
    catch { notify("Could not block this user.", "error"); }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-1 flex-col px-4 py-8 pb-24 sm:px-6 lg:pb-8">
      <div className="mb-6"><h1 className="font-display text-2xl font-semibold text-ink">Messages</h1><p className="mt-1 text-sm text-ink-soft">Discuss listings safely before you meet.</p></div>
      <div className="grid min-h-[560px] flex-1 overflow-hidden rounded-2xl border border-line bg-white lg:grid-cols-[320px_1fr]">
        <aside className={`border-line lg:border-r ${selected ? "hidden lg:block" : "block"}`}>
          {loading ? <p className="p-5 text-sm text-ink-soft">Loading conversations...</p> : conversations.length === 0 ? <div className="p-6"><p className="text-sm font-medium text-ink">No conversations yet</p><p className="mt-1 text-sm text-ink-soft">Open a flatmate listing and start a chat.</p><Link to="/flatmates" className="mt-4 inline-block text-sm font-semibold text-primary">Find a flatmate</Link></div> : conversations.map((conversation) => { const person = otherPerson(conversation, user!.id); const last = conversation.messages[0]; return <button key={conversation.id} onClick={() => setSelected(conversation)} className={`w-full border-b border-line p-4 text-left hover:bg-canvas ${selected?.id === conversation.id ? "bg-primary-soft" : ""}`}><p className="font-semibold text-ink">{person.name}</p><p className="mt-1 truncate text-xs text-ink-soft">{last?.body || conversation.listing.title}</p><p className="mt-1 truncate text-xs text-primary">{conversation.listing.title}</p></button>; })}
        </aside>
        <section className={`${selected ? "flex" : "hidden lg:flex"} min-w-0 flex-col`}>
          {!selected ? <div className="m-auto text-center text-sm text-ink-soft">Select a conversation to start chatting.</div> : <>
            <header className="flex items-center justify-between border-b border-line p-4"><div className="flex min-w-0 items-center gap-3"><button onClick={() => setSelected(null)} className="lg:hidden" aria-label="Back to conversations"><ArrowLeft size={18} /></button><div className="min-w-0"><p className="font-semibold text-ink">{otherPerson(selected, user!.id).name}</p><Link to={`/property/${selected.listing.slug}`} className="block truncate text-xs text-primary">Chat regarding: {selected.listing.title}</Link></div></div><button onClick={blockUser} title="Block user" className="text-ink-soft hover:text-danger"><ShieldAlert size={18} /></button></header>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-canvas p-4">{messages.length === 0 ? <p className="m-auto text-center text-sm text-ink-soft">Say hello about this listing.</p> : messages.map((message) => <div key={message.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${message.senderId === user!.id ? "self-end bg-primary text-white" : "self-start border border-line bg-white text-ink"}`}><p>{message.body}</p><p className={`mt-1 text-[10px] ${message.senderId === user!.id ? "text-white/70" : "text-ink-soft"}`}>{new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} {message.senderId === user!.id ? `· ${message.status.toLowerCase()}` : ""}</p></div>)}</div>
            <form onSubmit={sendMessage} className="flex gap-2 border-t border-line p-3"><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message..." className="min-w-0 flex-1 rounded-full border border-line px-4 py-2.5 text-sm outline-none focus:border-primary" /><button aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50" disabled={!draft.trim()}><Send size={16} /></button></form>
          </>}
        </section>
      </div>
    </div>
  );
}
