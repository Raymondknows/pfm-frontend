"use client";

import {
  CheckCheck,
  ImagePlus,
  Mic,
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
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";
function apiRequest(path: string, token: string, options?: RequestInit) {
  return fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options?.headers ?? {}) },
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
  ) : (
    <span className="audio-message">
      <audio controls src={url} />
      <small>{attachment.originalName}</small>
    </span>
  );
}

export function ChatWorkspace() {
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
    apiRequest("/v1/communications/conversations", token)
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
      apiRequest("/v1/communications/contacts", token),
      apiRequest("/v1/communities", token),
    ])
      .then(async ([contactResponse, communityResponse]) => {
        if (!contactResponse.ok || !communityResponse.ok) throw new Error("Unable to load permitted contacts");
        return Promise.all([contactResponse.json() as Promise<Contact[]>, communityResponse.json() as Promise<CommunityOption[]>]);
      })
      .then(([contactItems, communityItems]) => { setContacts(contactItems); setCommunityOptions(communityItems); })
      .catch(() => undefined);
  }, [token]);

  async function createConversation(value: string, kind: "userId" | "communityId") {
    const response = await apiRequest("/v1/communications/conversations", token, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ [kind]: value }) });
    if (!response.ok) { setError("Conversation could not be started"); return; }
    const conversation = await response.json() as Conversation;
    setConversations((current) => [conversation, ...current.filter((item) => item.id !== conversation.id)]);
    setSelectedId(conversation.id); setNewConversation(false);
  }

  useEffect(() => {
    if (!selectedId) return;
    void apiRequest(`/v1/communications/conversations/${selectedId}/read`, token, { method: "POST" });
    apiRequest(`/v1/communications/conversations/${selectedId}/messages`, token)
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
    const response = await apiRequest(`/v1/communications/messages/${messageId}`, token, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ body }) });
    if (!response.ok) { setError("Message could not be updated"); return; }
    const updated = await response.json() as Message;
    setMessages((current) => current.map((message) => message.id === updated.id ? { ...message, ...updated } : message)); setEditingId(""); setDraft("");
  }

  async function removeMessage(messageId: string) {
    const response = await apiRequest(`/v1/communications/messages/${messageId}`, token, { method: "DELETE" });
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

  return (
    <section className="chat-shell">
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
          <input placeholder="Search conversations" />
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
            {conversations.map((conversation) => (
              <button
                className={`conversation-row ${conversation.id === selectedId ? "selected" : ""}`}
                key={conversation.id}
                onClick={() => setSelectedId(conversation.id)}
              >
                <span className="conversation-avatar">
                  {conversation.type === "COMMUNITY" ? (
                    <Users size={16} />
                  ) : (
                    (conversation.title?.slice(0, 1) ?? "P")
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
          <span className="conversation-avatar">
            {selected?.type === "COMMUNITY" ? (
              <Users size={16} />
            ) : (
              title.slice(0, 1)
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
            messages.map((message) => (
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
                {message.senderId === userId && !message.deletedAt && <div className="message-tools"><button onClick={() => { setEditingId(message.id); setDraft(message.body ?? ""); }} aria-label="Edit message">Edit</button><button onClick={() => void removeMessage(message.id)} aria-label="Delete message"><Trash2 size={12} /></button></div>}
              </article>
            ))
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
