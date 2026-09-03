import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Send, ShieldAlert } from "lucide-react";
import { api, ApiError } from "../lib/api";
import type { ChatMessage, Conversation } from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function otherPerson(conversation: Conversation, userId: string) {
  return conversation.starter.id === userId ? conversation.recipient : conversation.starter;
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
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
  const [conversationSearch, setConversationSearch] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const visibleConversations = conversations.filter((conversation) => {
    const person = otherPerson(conversation, user?.id || "");
    const search = conversationSearch.trim().toLowerCase();
    return !search || person.name.toLowerCase().includes(search) || conversation.listing.title.toLowerCase().includes(search);
  });

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
    setMessages([]);
    loadMessages(selected.id);
    const interval = window.setInterval(() => loadMessages(selected.id), 3000);
    return () => window.clearInterval(interval);
  }, [selected?.id]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [messages, selected?.id]);

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
      <div className="mb-6"><h1 className="font-display text-2xl font-semibold text-ink">Messages</h1><p className="mt-1 text-sm text-ink-soft">Your conversations about properties and flatmates.</p></div>
      <div className="grid min-h-[620px] flex-1 overflow-hidden rounded-2xl border border-line bg-white shadow-sm lg:grid-cols-[340px_1fr]">
        <aside className={`border-line bg-white lg:border-r ${selected ? "hidden lg:block" : "block"}`}>
          <div className="border-b border-line p-4">
            <p className="mb-3 font-display text-lg font-semibold text-ink">Chats</p>
            <input value={conversationSearch} onChange={(event) => setConversationSearch(event.target.value)} placeholder="Search chats" className="w-full rounded-full bg-canvas px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          {loading ? <p className="p-5 text-sm text-ink-soft">Loading conversations...</p> : conversations.length === 0 ? <div className="p-6"><p className="text-sm font-medium text-ink">No conversations yet</p><p className="mt-1 text-sm text-ink-soft">Open a property and tap “I want flatmates” to start chatting.</p><Link to="/flatmates" className="mt-4 inline-block text-sm font-semibold text-primary">Find a property</Link></div> : visibleConversations.length === 0 ? <p className="p-5 text-sm text-ink-soft">No chats match your search.</p> : visibleConversations.map((conversation) => {
            const person = otherPerson(conversation, user!.id);
            const last = conversation.messages[0];
            const wantsToFlatmate = last?.body.includes("want to flatmate");
            const unread = last && last.senderId !== user!.id && last.status !== "READ";
            return <button key={conversation.id} onClick={() => setSelected(conversation)} className={`flex w-full items-center gap-3 border-b border-line p-4 text-left transition-colors hover:bg-canvas ${selected?.id === conversation.id ? "bg-primary-soft" : ""}`}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">{initials(person.name)}</div>
              <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate font-semibold text-ink">{person.name}</p>{unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}</div>{wantsToFlatmate && <p className="mt-0.5 text-xs font-semibold text-verified">Wants to flatmate</p>}<p className="mt-0.5 truncate text-xs text-ink-soft">{last?.body || conversation.listing.title}</p><p className="mt-0.5 truncate text-xs text-primary">{conversation.listing.title}</p></div>
            </button>;
          })}
        </aside>
        <section className={`${selected ? "flex" : "hidden lg:flex"} min-w-0 flex-col bg-canvas`}>
          {!selected ? <div className="m-auto text-center"><div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary"><Send size={24} /></div><p className="font-medium text-ink">Select a chat</p><p className="mt-1 text-sm text-ink-soft">Your messages will appear here.</p></div> : <>
            <header className="flex items-center justify-between border-b border-line bg-white p-4"><div className="flex min-w-0 items-center gap-3"><button onClick={() => setSelected(null)} className="lg:hidden" aria-label="Back to conversations"><ArrowLeft size={18} /></button><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{initials(otherPerson(selected, user!.id).name)}</div><div className="min-w-0"><p className="truncate font-semibold text-ink">{otherPerson(selected, user!.id).name}</p><Link to={`/property/${selected.listing.slug}`} className="block truncate text-xs text-primary">{selected.listing.title}</Link></div></div><button onClick={blockUser} title="Block user" className="text-ink-soft hover:text-danger"><ShieldAlert size={18} /></button></header>
            <div ref={messagesContainerRef} className="flex flex-1 flex-col gap-2 overflow-y-auto p-4 sm:p-6">{messages.length === 0 ? <p className="m-auto text-center text-sm text-ink-soft">Say hello about this listing.</p> : messages.map((message) => { const mine = message.senderId === user!.id; return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] px-3.5 py-2.5 text-sm shadow-sm sm:max-w-[65%] ${mine ? "rounded-2xl rounded-br-md bg-primary text-white" : "rounded-2xl rounded-bl-md border border-line bg-white text-ink"}`}><p className="whitespace-pre-wrap break-words">{message.body}</p><p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-ink-soft"}`}>{new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}{mine ? ` · ${message.status.toLowerCase()}` : ""}</p></div></div>; })}</div>
            <form onSubmit={sendMessage} className="flex gap-2 border-t border-line bg-white p-3"><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Message..." className="min-w-0 flex-1 rounded-full border border-line px-4 py-2.5 text-sm outline-none focus:border-primary" /><button aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50" disabled={!draft.trim()}><Send size={16} /></button></form>
          </>}
        </section>
      </div>
    </div>
  );
}
