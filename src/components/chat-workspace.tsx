"use client";

import {
  CheckCheck,
  ChevronLeft,
  ImagePlus,
  Mic,
  MoreVertical,
  Paperclip,
  Play,
  Search,
  Send,
  Square,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useSessionHandler } from "@/lib/session";

type Conversation = {
  id: string;
  type: "DIRECT" | "COMMUNITY";
  title: string | null;
  communityId: string | null;
  community?: { name: string } | null;
  updatedAt: string;
  members: Array<{
    userId: string;
    user: { firstName: string; lastName: string; email: string };
  }>;
  messages?: Array<{
    body: string | null;
    type: string;
    createdAt: string;
    senderId: string;
  }>;
  _count?: { messages: number };
};
type Message = {
  id: string;
  senderId: string;
  body: string | null;
  type: "TEXT" | "IMAGE" | "AUDIO" | "DOCUMENT";
  status: "SENT" | "DELIVERED" | "READ";
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  attachments: Array<{
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
  }>;
};
type Contact = { userId: string; firstName: string; lastName: string; email: string | null };
type CommunityOption = { id: string; name: string; type: string };
const apiUrl = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
})();

function apiRequest(path: string, token: string, options?: RequestInit, onUnauthorized?: () => void) {
  return fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options?.headers ?? {}) },
  }).then(async (response) => {
    if (response.status === 401 && onUnauthorized) {
      onUnauthorized();
      throw new Error("Session expired");
    }
    return response;
  });
}

function MediaAttachment({
  attachment,
  token,
}: {
  attachment: Message["attachments"][number];
  token: string;
}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let objectUrl = "";
    apiRequest(`/v1/communications/attachments/${attachment.id}`, token)
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => {
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch(() => undefined);
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.id, token]);
  if (!url) return <span className="media-loading">Loading media...</span>;
  return attachment.mimeType.startsWith("image/") ? (
    <img src={url} alt={attachment.originalName} />
  ) : attachment.mimeType.startsWith("video/") ? (
    <span className="video-message">
      <video controls src={url} />
    </span>
  ) : (
    <span className="audio-message">
      <audio controls src={url} />
    </span>
  );
}

export function ChatWorkspace() {
  const { handleUnauthorizedResponse } = useSessionHandler();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [communityOptions, setCommunityOptions] = useState<CommunityOption[]>([]);
  const [newConversation, setNewConversation] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [messageMenuId, setMessageMenuId] = useState("");
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [conversationSearch, setConversationSearch] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const userId =
    typeof window === "undefined"
      ? ""
      : (() => {
          try {
            return (
              JSON.parse(localStorage.getItem("pfm.user") ?? "{}")?.id ?? ""
            );
          } catch {
            return "";
          }
        })();
  const token =
    typeof window === "undefined"
      ? ""
      : (localStorage.getItem("pfm.accessToken") ?? "");
  useEffect(() => {
    apiRequest("/v1/communications/conversations", token, undefined, () => handleUnauthorizedResponse(401))
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load conversations");
        return response.json() as Promise<Conversation[]>;
      })
      .then((items) => {
        setConversations(items);
        setSelectedId(items[0]?.id ?? "");
      })
      .catch((requestError: unknown) =>
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load conversations",
        ),
      )
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    Promise.all([
      apiRequest("/v1/communications/contacts", token, undefined, () => handleUnauthorizedResponse(401)),
      apiRequest("/v1/communities", token, undefined, () => handleUnauthorizedResponse(401)),
    ])
      .then(async ([contactResponse, communityResponse]) => {
        if (!contactResponse.ok || !communityResponse.ok) throw new Error("Unable to load permitted contacts");
        return Promise.all([contactResponse.json() as Promise<Contact[]>, communityResponse.json() as Promise<CommunityOption[]>]);
      })
      .then(([contactItems, communityItems]) => { setContacts(contactItems); setCommunityOptions(communityItems); })
      .catch(() => undefined);
  }, [token]);

  async function createConversation(value: string, kind: "userId" | "communityId") {
    const response = await apiRequest("/v1/communications/conversations", token, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ [kind]: value }) }, () => handleUnauthorizedResponse(401));
    if (!response.ok) { setError("Conversation could not be started"); return; }
    const conversation = await response.json() as Conversation;
    setConversations((current) => [conversation, ...current.filter((item) => item.id !== conversation.id)]);
    setSelectedId(conversation.id); setNewConversation(false);
  }

  useEffect(() => {
    if (!selectedId) return;
    void apiRequest(`/v1/communications/conversations/${selectedId}/read`, token, { method: "POST" }, () => handleUnauthorizedResponse(401));
    apiRequest(`/v1/communications/conversations/${selectedId}/messages`, token, undefined, () => handleUnauthorizedResponse(401))
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load messages");
        return response.json() as Promise<Message[]>;
      })
      .then(setMessages)
      .catch((requestError: unknown) =>
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load messages",
        ),
      );
  }, [selectedId, token]);

  async function sendText() {
    if (!selectedId || !draft.trim() || sending) return;
    setSending(true);
    setError("");
    const response = await apiRequest(
      `/v1/communications/conversations/${selectedId}/messages`,
      token,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: draft }),
      },
      () => handleUnauthorizedResponse(401),
    );
    if (!response.ok) {
      setError("Message could not be sent");
      setSending(false);
      return;
    }
    const message = (await response.json()) as Message;
    setMessages((current) => [...current, message]);
    setDraft("");
    setSending(false);
  }

  async function loadOlderMessages() {
    if (!selectedId || !messages.length || loadingOlder) return;
    setLoadingOlder(true);
    const oldest = messages[0];
    const response = await apiRequest(`/v1/communications/conversations/${selectedId}/messages?before=${encodeURIComponent(oldest.id)}`, token, undefined, () => handleUnauthorizedResponse(401));
    if (response.ok) {
      const older = await response.json() as Message[];
      setMessages((current) => [...older, ...current]);
    }
    setLoadingOlder(false);
  }

  async function sendFile() {
    if (!selectedId || !file || sending) return;
    setSending(true);
    setError("");
    const data = new FormData();
    data.append("file", file);
    if (draft.trim()) data.append("caption", draft);
    const response = await apiRequest(
      `/v1/communications/conversations/${selectedId}/media`,
      token,
      { method: "POST", body: data },
      () => handleUnauthorizedResponse(401),
    );
    if (!response.ok) {
      setError("Media could not be sent");
      setSending(false);
      return;
    }
    const message = (await response.json()) as Message;
    setMessages((current) => [...current, message]);
    setFile(null);
    setDraft("");
    setSending(false);
  }

  async function updateMessage(messageId: string) {
    const body = draft.trim();
    if (!body) return;
    const response = await apiRequest(`/v1/communications/messages/${messageId}`, token, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ body }) }, () => handleUnauthorizedResponse(401));
    if (!response.ok) { setError("Message could not be updated"); return; }
    const updated = await response.json() as Message;
    setMessages((current) => current.map((message) => message.id === updated.id ? { ...message, ...updated } : message)); setEditingId(""); setDraft("");
  }

  async function removeMessage(messageId: string) {
    const response = await apiRequest(`/v1/communications/messages/${messageId}`, token, { method: "DELETE" }, () => handleUnauthorizedResponse(401));
    if (!response.ok) { setError("Message could not be deleted"); return; }
    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, body: null, deletedAt: new Date().toISOString() } : message));
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Audio recording is not supported in this browser");
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks.current = [];
    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
    const activeRecorder = new MediaRecorder(stream, { mimeType });
    recorder.current = activeRecorder;
    activeRecorder.ondataavailable = (event) => {
      if (event.data.size) chunks.current.push(event.data);
    };
    activeRecorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      setFile(
        new File(
          [new Blob(chunks.current, { type: mimeType })],
          `voice-message.${mimeType === "audio/ogg" ? "ogg" : "webm"}`,
          { type: mimeType },
        ),
      );
    };
    activeRecorder.start();
    setRecording(true);
  }
  function stopRecording() {
    recorder.current?.stop();
    setRecording(false);
  }
  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  }
  const selected = conversations.find(
    (conversation) => conversation.id === selectedId,
  );
  const title =
    selected?.community?.name ??
    selected?.title ??
    selected?.members.find((member) => member.userId !== userId)?.user
      .firstName ??
    "Conversation";
  const initials = title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const visibleConversations = conversations.filter((conversation) => {
    const name = conversation.community?.name ?? conversation.title ?? "Direct conversation";
    return name.toLowerCase().includes(conversationSearch.toLowerCase());
  });

  return (
    <section className={`chat-shell ${selectedId ? "thread-open" : "list-open"}`}>
      <aside className="chat-list">
        <div className="chat-list-head">
          <div>
            <span className="eyebrow">Secure workspace</span>
            <h2>Messages</h2>
          </div>
          <button className="icon-button" aria-label="New conversation" onClick={() => setNewConversation((open) => !open)}>
            <UserPlus size={18} />
          </button>
        </div>
        {newConversation && <div className="new-conversation"><strong>Start a conversation</strong><label>Direct contact<select defaultValue="" onChange={(event) => { if (event.target.value) void createConversation(event.target.value, "userId"); }}><option value="">Choose a permitted contact</option>{contacts.map((contact) => <option value={contact.userId} key={contact.userId}>{contact.firstName} {contact.lastName}</option>)}</select></label><label>Community<select defaultValue="" onChange={(event) => { if (event.target.value) void createConversation(event.target.value, "communityId"); }}><option value="">Choose a permitted community</option>{communityOptions.map((community) => <option value={community.id} key={community.id}>{community.name}</option>)}</select></label></div>}
        <label className="chat-search">
          <Search size={16} />
          <input placeholder="Search or start new chat" value={conversationSearch} onChange={(event) => setConversationSearch(event.target.value)} />
        </label>
        {loading ? (
          <div className="chat-empty">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="chat-empty">
            <Users size={22} />
            <strong>No conversations yet</strong>
            <span>
              Scoped community and direct conversations will appear here.
            </span>
          </div>
        ) : (
          <div className="conversation-list">
            {visibleConversations.map((conversation) => (
              <button
                className={`conversation-row ${conversation.id === selectedId ? "selected" : ""}`}
                key={conversation.id}
                onClick={() => setSelectedId(conversation.id)}
              >
                <span className="conversation-avatar">
                  {conversation.type === "COMMUNITY" ? (
                    <Users size={16} />
                  ) : (
                    (conversation.title?.slice(0, 2) ?? "P").toUpperCase()
                  )}
                </span>
                <span>
                  <strong>{conversation.community?.name ?? conversation.title ?? "Direct conversation"}</strong>
                  <small>{conversation.messages?.[0]?.body ?? "No messages yet"}</small>
                </span>
                <time>
                  {new Date(conversation.updatedAt).toLocaleDateString()}
                </time>
                {conversation._count?.messages ? <b className="unread-count">{conversation._count.messages}</b> : null}
              </button>
            ))}
          </div>
        )}
      </aside>
      <div className="chat-thread">
        <header className="chat-thread-head">
          <button className="chat-mobile-back" aria-label="Back to conversations" onClick={() => setSelectedId("")}><ChevronLeft size={21} /></button>
          <span className="conversation-avatar">
            {selected?.type === "COMMUNITY" ? (
              <Users size={16} />
            ) : (
              initials || "P"
            )}
          </span>
          <span>
            <strong>{title}</strong>
            <small>
              {selected?.type === "COMMUNITY"
                ? "Community conversation"
                : "Private conversation"}
            </small>
          </span>
            <div className="thread-actions">
              <button className="icon-button" aria-label="Search in conversation"><Search size={18} /></button>
              <button className="icon-button" aria-label="More conversation options"><MoreVertical size={19} /></button>
            </div>
        </header>
        {error && (
          <div className="chat-error" role="alert">
            {error}
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              <X size={14} />
            </button>
          </div>
        )}
        <div className="message-stream">
          {!selectedId ? (
            <div className="chat-empty thread-empty">
              <Users size={28} />
              <strong>Select a conversation</strong>
              <span>
                Your permitted conversations stay private to your organization.
              </span>
            </div>
          ) : (
            <>
            {messages.length >= 100 && <button className="load-older-button" onClick={() => void loadOlderMessages()} disabled={loadingOlder}>{loadingOlder ? "Loading older messages..." : "Load older messages"}</button>}
            {messages.map((message, index) => (
              <div className="message-group" key={`${message.id}-group`}>
                {(index === 0 || new Date(messages[index - 1].createdAt).toDateString() !== new Date(message.createdAt).toDateString()) && (
                  <time className="message-date">{new Date(message.createdAt).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}</time>
                )}
              <article
                className={`message-bubble ${message.senderId === userId ? "outgoing" : "incoming"}`}
                key={message.id}
              >
                {message.deletedAt ? <p className="deleted-message">This message was deleted</p> : editingId === message.id ? <div className="edit-message"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} /><button className="small-action" onClick={() => void updateMessage(message.id)}>Save</button><button className="icon-button" aria-label="Cancel editing" onClick={() => { setEditingId(""); setDraft(""); }}><X size={14} /></button></div> : message.body && <p>{message.body}</p>}
                {message.attachments.map((attachment) =>
                  <MediaAttachment
                    attachment={attachment}
                    token={token}
                    key={attachment.id}
                  />,
                )}
                <footer>
                  <time>
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                  {message.senderId === userId && <CheckCheck size={14} />}
                </footer>
                {message.senderId === userId && !message.deletedAt && <div className="message-tools"><button className="message-menu-trigger" onClick={() => setMessageMenuId((current) => current === message.id ? "" : message.id)} aria-label="Message options"><MoreVertical size={15} /></button>{messageMenuId === message.id && <div className="message-menu"><button onClick={() => { setEditingId(message.id); setDraft(message.body ?? ""); setMessageMenuId(""); }}>Edit</button><button className="danger" onClick={() => { void removeMessage(message.id); setMessageMenuId(""); }}><Trash2 size={12} />Delete</button></div>}</div>}
              </article>
              </div>
            ))}
            </>
          )}
        </div>
        <div className="chat-composer">
          {file && (
            <div className="attachment-preview">
              <span>
                {file.type.startsWith("image/") ? (
                  <ImagePlus size={15} />
                ) : (
                  <Mic size={15} />
                )}{" "}
                {file.name}
              </span>
              <button
                aria-label="Remove attachment"
                onClick={() => setFile(null)}
              >
                <X size={15} />
              </button>
            </div>
          )}
          <div className="composer-row">
            <label className="attach-button" aria-label="Attach image or audio">
              <Paperclip size={19} />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm"
                onChange={selectFile}
              />
            </label>
            <button
              className={`icon-button ${recording ? "recording" : ""}`}
              aria-label={recording ? "Stop recording" : "Record audio"}
              onClick={recording ? stopRecording : startRecording}
            >
              {recording ? <Square size={18} /> : <Mic size={19} />}
            </button>
            <textarea
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (file) sendFile();
                  else sendText();
                }
              }}
              placeholder="Write a message"
            />
            <button
              className="send-button"
              aria-label="Send message"
              disabled={sending || (!draft.trim() && !file)}
              onClick={file ? sendFile : sendText}
            >
              {file ? <Play size={17} /> : <Send size={17} />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
