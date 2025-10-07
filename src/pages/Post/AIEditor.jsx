// src/app/pages/Post/AIEditor.jsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Segment, Message, Input } from "semantic-ui-react";
import styles from "./AIEditor.module.css";
import { aiAssist } from "../../api/ai";

/* ---------- Minimal Markdown preview for assistant bubbles ---------- */
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark as prismOneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const MarkdownPreview = ({ value = "" }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      code({ inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || "");
        if (inline)
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        return (
          <SyntaxHighlighter
            style={prismOneDark}
            language={match ? match[1] : undefined}
            PreTag="div"
            showLineNumbers
            wrapLongLines
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        );
      },
    }}
  >
    {value}
  </ReactMarkdown>
);

/* ---------- Helpers ---------- */

const sanitizeTag = (s) =>
  s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9+-]/g, "")
    .trim();

const parseTags = (raw) => {
  if (!raw) return [];
  let s = raw.trim();
  s = s.replace(/^#?\s*tags?\s*:\s*/i, "");
  s = s.replace(/^[\s>*-]*[-*•]\s*/gim, "");
  s = s.replace(/\n+/g, ",");
  const parts = s
    .split(/[,|;]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const fallback = parts.length <= 1 ? s.split(/\s+/).filter(Boolean) : parts;
  return fallback.map(sanitizeTag);
};

const sectionGrab = (text, name) => {
  const re = new RegExp(`#${name}\\s*\\n([\\s\\S]*?)(?=\\n#\\w+\\b|$)`, "i");
  const m = text.match(re);
  return m ? m[1].trim() : null;
};

const parseAiSections = (text) => ({
  title: sectionGrab(text, "TITLE"),
  abstract: sectionGrab(text, "ABSTRACT"),
  body: sectionGrab(text, "BODY_MD") || sectionGrab(text, "BODY"),
  tags: parseTags(sectionGrab(text, "TAGS")),
});

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const stripActionBlocks = (text = "") =>
  text
    .replace(/```json\s*([\s\S]*?)\s*```/gi, (match, body) => {
      try {
        const parsed = JSON.parse(body);
        if (
          parsed &&
          typeof parsed === "object" &&
          Array.isArray(parsed.actions)
        ) {
          return "";
        }
      } catch (e) {
        // ignore malformed blocks
      }
      return match;
    })
    .trim();

/* ============================ Component ============================ */

export default function AIEditor({
  /** Function that returns a snapshot string of the current editing context. */
  getContext,

  /** "article" | "question" (affects some prompts) */
  postType,

  /** Latest field values so we can preview/apply edits. */
  values = {},

  /** Apply callbacks into parent state */
  onApplyTitle,
  onApplyAbstract,
  onReplaceBody,
  onAppendBody,
  onApplyTags,
}) {
  const { title = "", abstract = "", body = "", tags = [] } = values;

  const [portalNode, setPortalNode] = useState(null);
  useEffect(() => {
    let node = document.getElementById("ai-editor-portal");
    if (!node) {
      node = document.createElement("div");
      node.id = "ai-editor-portal";
      document.body.appendChild(node);
    }
    setPortalNode(node);
  }, []);

  // UI/state for dock and chat
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [quota, setQuota] = useState(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // {id, role, text, sections?, changes?}
  const [appliedSnapshots, setAppliedSnapshots] = useState({}); // changeId -> previous value

  // Resizable dock
  const [dockHeight, setDockHeight] = useState(480);
  const startResize = (e) => {
    const startY = e.clientY;
    const startH = dockHeight;
    const MIN = 260;
    const MAX = Math.max(360, window.innerHeight - 140);
    const onMove = (ev) =>
      setDockHeight(clamp(startH + (startY - ev.clientY), MIN, MAX));
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const mergeTags = (existing = [], add = []) =>
    Array.from(new Set([...(existing || []), ...add.map(sanitizeTag)]));
  const arraysEqual = (a = [], b = []) =>
    a.length === b.length && a.every((item, idx) => item === b[idx]);
  const makeId = () =>
    `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const shortText = (value = "", max = 160) => {
    const trimmed = value.trim();
    return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
  };

  const buildChanges = (actions = [], sections) => {
    const items = [];
    const seen = new Set();

    const push = (change) => {
      if (!change || change.value === undefined || change.value === null)
        return;
      const key = `${change.field}:${change.kind}`;
      if (seen.has(key)) return;
      seen.add(key);
      items.push({
        ...change,
        id: `${key}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      });
    };

    actions.forEach((a) => {
      switch (a.type) {
        case "REPLACE_BODY": {
          const next = a.body_md?.trim();
          if (next && next !== body.trim()) {
            push({
              field: "body",
              kind: "replace",
              label: "Body",
              value: next,
              preview: shortText(next, 220),
            });
          }
          break;
        }
        case "APPEND_BODY": {
          const next = a.body_md?.trim();
          if (next) {
            push({
              field: "body",
              kind: "append",
              label: "Body",
              value: next,
              preview: shortText(next, 220),
            });
          }
          break;
        }
        case "APPLY_TITLE": {
          const next = a.title?.trim();
          if (next && next !== title.trim()) {
            push({
              field: "title",
              kind: "replace",
              label: "Title",
              value: next,
              preview: next,
            });
          }
          break;
        }
        case "APPLY_ABSTRACT": {
          const next = a.abstract?.trim();
          if (next && next !== abstract.trim()) {
            push({
              field: "abstract",
              kind: "replace",
              label: "Abstract",
              value: next,
              preview: shortText(next, 180),
            });
          }
          break;
        }
        case "APPLY_TAGS": {
          if (Array.isArray(a.tags) && a.tags.length) {
            const merged = mergeTags(tags, a.tags);
            if (!arraysEqual(merged, tags)) {
              push({
                field: "tags",
                kind: "replace",
                label: "Tags",
                value: merged,
                preview: merged.join(", "),
              });
            }
          }
          break;
        }
        default:
          break;
      }
    });

    if (sections) {
      if (
        sections.title &&
        sections.title.trim() &&
        sections.title.trim() !== title.trim()
      ) {
        push({
          field: "title",
          kind: "replace",
          label: "Title",
          value: sections.title.trim(),
          preview: sections.title.trim(),
        });
      }
      if (
        sections.abstract &&
        sections.abstract.trim() &&
        sections.abstract.trim() !== abstract.trim()
      ) {
        push({
          field: "abstract",
          kind: "replace",
          label: "Abstract",
          value: sections.abstract.trim(),
          preview: shortText(sections.abstract.trim(), 180),
        });
      }
      if (
        sections.body &&
        sections.body.trim() &&
        sections.body.trim() !== body.trim()
      ) {
        push({
          field: "body",
          kind: "replace",
          label: "Body",
          value: sections.body.trim(),
          preview: shortText(sections.body.trim(), 220),
        });
      }
      if (Array.isArray(sections.tags) && sections.tags.length) {
        const merged = mergeTags(tags, sections.tags);
        if (!arraysEqual(merged, tags)) {
          push({
            field: "tags",
            kind: "replace",
            label: "Tags",
            value: merged,
            preview: merged.join(", "),
          });
        }
      }
    }

    return items;
  };

  /* ---------- Conversational-first intent with action JSON guidance ---------- */
  const intentPrompt = (raw) => {
    const ctx = (typeof getContext === "function" ? getContext() : "") || "";
    const m = raw.trim().match(/^\/(\w+)\s*(.*)$/);

    const actionGuide = [
      "After your natural-language reply, include one fenced JSON block describing every concrete edit you want applied:",
      "```json",
      '{"actions":[{"type":"REPLACE_BODY","body_md":"..."},{"type":"APPEND_BODY","body_md":"..."},{"type":"APPLY_TITLE","title":"..."},{"type":"APPLY_ABSTRACT","abstract":"..."},{"type":"APPLY_TAGS","tags":["..."]},{"type":"CONFIRM","question":"..."}],"confidence":0.0}',
      "```",
      "Always include an action whenever you change title, abstract, body, or tags. Use APPEND_BODY for additive snippets and REPLACE_BODY when overwriting.",
      "Match the user's instruction exactly; only ask for clarification if you truly cannot act.",
    ].join("\n");

    // Default conversation: comply directly with user's request
    if (!m) {
      return {
        feature: "editor",
        prompt: [
          "You are a compliant writing assistant embedded in an editor. Do exactly what the user requests.",
          "Respond briefly (2-3 sentences max) acknowledging the action you took, then provide the new content in #TITLE, #ABSTRACT, #BODY_MD, and/or #TAGS sections as appropriate.",
          "If the user only mentions one field (e.g. title), only change that field.",
          "When appending content, clearly indicate the new material in #BODY_MD and use APPEND_BODY in actions.",
          "If the user asks to apply everything, include actions for every field you touched so the UI can apply them automatically.",
          "",
          "User message:",
          raw,
          "",
          actionGuide,
        ].join("\n"),
        context: ctx,
      };
    }

    const cmd = m[1].toLowerCase();
    const rest = (m[2] || "").trim();

    if (cmd === "title") {
      return {
        feature: "editor",
        prompt:
          "Write the exact title the user would like. Return #TITLE with the final text and include an APPLY_TITLE action only.\n" +
          actionGuide,
        context: ctx + "\nReturn #TITLE only.",
      };
    }
    if (cmd === "abstract") {
      return {
        feature: "editor",
        prompt:
          "Produce the requested abstract verbatim. Return #ABSTRACT only and include APPLY_ABSTRACT.\n" +
          actionGuide,
        context: ctx + "\nReturn #ABSTRACT only.",
      };
    }
    if (cmd === "tags") {
      return {
        feature: "editor",
        prompt:
          "Return a final tag list (3-6 tags) in #TAGS and include APPLY_TAGS. Tags must be lowercase, hyphenated.\n" +
          actionGuide,
        context: ctx + "\nReturn #TAGS only.",
      };
    }
    if (cmd === "write") {
      return {
        feature: "editor",
        prompt:
          `Write the full content requested: ${rest}. Provide #TITLE, #ABSTRACT, #BODY_MD (Markdown), and #TAGS.\n` +
          actionGuide,
        context:
          ctx + "\nReturn #BODY_MD (and optionally #TITLE, #ABSTRACT, #TAGS).",
      };
    }
    if (cmd === "code") {
      return {
        feature: "editor",
        prompt:
          `Write the code or snippet requested: ${rest}. Return it inside #BODY_MD (Markdown) and include APPEND_BODY unless asked to replace.\n` +
          actionGuide,
        context: ctx + "\nReturn #BODY_MD only.",
      };
    }
    if (cmd === "improve") {
      return {
        feature: "editor",
        prompt:
          `Rewrite the current ${postType === "article" ? "article body" : "question description"} as instructed. Return the full replacement in #BODY_MD and include REPLACE_BODY. Preserve Markdown structure.\n` +
          actionGuide,
        context: ctx + "\nReturn #BODY_MD only.",
      };
    }

    // Unknown slash → conversational edit
    return {
      feature: "editor",
      prompt:
        `Acknowledge briefly, then provide concrete suggestions.\nUser message: ${raw}\n` +
        actionGuide,
      context: ctx,
    };
  };

  /* ---------- Action JSON parsing & application ---------- */

  const extractActionsFromText = (t) => {
    if (!t) return [];
    const blocks = [...t.matchAll(/```json\s*([\s\S]*?)\s*```/gi)];
    if (blocks.length === 0) return [];
    const last = blocks[blocks.length - 1][1];
    try {
      const parsed = JSON.parse(last);
      return Array.isArray(parsed.actions) ? parsed.actions : [];
    } catch {
      return [];
    }
  };

  const handleApplyChange = (change) => {
    if (!change || appliedSnapshots[change.id]) return;

    let previous;
    switch (change.field) {
      case "title":
        if (!onApplyTitle) return;
        previous = title;
        onApplyTitle(change.value);
        break;
      case "abstract":
        if (!onApplyAbstract) return;
        previous = abstract;
        onApplyAbstract(change.value);
        break;
      case "body":
        previous = body;
        if (change.kind === "append") {
          if (!onAppendBody) return;
          onAppendBody(change.value);
        } else {
          if (!onReplaceBody) return;
          onReplaceBody(change.value);
        }
        break;
      case "tags":
        if (!onApplyTags) return;
        previous = Array.isArray(tags) ? [...tags] : [];
        onApplyTags(change.value);
        break;
      default:
        return;
    }

    setAppliedSnapshots((prev) => ({
      ...prev,
      [change.id]: {
        previous,
        field: change.field,
        kind: change.kind,
      },
    }));
  };

  const handleUndoChange = (change) => {
    const snapshot = appliedSnapshots[change.id];
    if (!snapshot) return;

    switch (snapshot.field) {
      case "title":
        if (onApplyTitle) onApplyTitle(snapshot.previous);
        break;
      case "abstract":
        if (onApplyAbstract) onApplyAbstract(snapshot.previous);
        break;
      case "body":
        if (onReplaceBody) onReplaceBody(snapshot.previous);
        break;
      case "tags":
        if (onApplyTags)
          onApplyTags(
            Array.isArray(snapshot.previous) ? [...snapshot.previous] : []
          );
        break;
      default:
        break;
    }

    setAppliedSnapshots((prev) => {
      const next = { ...prev };
      delete next[change.id];
      return next;
    });
  };

  const sendAi = async () => {
    const raw = input.trim();
    if (!raw || busy) return;
    setError("");
    setBusy(true);
    const userMessage = { id: makeId(), role: "user", text: raw };
    setMessages((m) => [...m, userMessage]);
    setInput("");

    try {
      const { feature, prompt, context } = intentPrompt(raw);
      const r = await aiAssist({ feature, prompt, context });
      const text = r.text || "";
      const sections = parseAiSections(text);
      const actions = extractActionsFromText(text);
      const changes = buildChanges(actions, sections);

      const assistantMessage = {
        id: makeId(),
        role: "assistant",
        text: stripActionBlocks(text),
        sections,
        changes,
      };

      setMessages((m) => [...m, assistantMessage]);

      if (changes.length) {
        // Apply immediately so the editor updates in real time.
        changes.forEach((change) => handleApplyChange(change));
      }

      if (r.quota) setQuota(r.quota);
    } catch (e) {
      setError(e.message || "AI request failed");
    } finally {
      setBusy(false);
    }
  };

  if (!portalNode) return null;

  return createPortal(
    <>
      {/* Floating toggle */}
      <Button
        circular
        icon="magic"
        title="AI Editor"
        onClick={() => setOpen((v) => !v)}
        className={`${styles.aiToggleBtn} ${open ? styles.aiToggleBtnOpen : styles.aiToggleBtnClosed}`}
        style={{ "--dock-height": `${dockHeight}px` }}
      />

      {/* Dock */}
      {open && (
        <Segment
          basic
          className={styles.aiDock}
          style={{ "--dock-height": `${dockHeight}px` }}
        >
          {/* Resize handle */}
          <div
            className={styles.aiResizeHandle}
            onMouseDown={startResize}
            title="Drag to resize"
          >
            <div className={styles.aiResizeGrip} />
          </div>

          {/* Header */}
          <div className={styles.aiHeader}>
            <strong>AI Editor</strong>
            <div className={styles.aiHeaderRight}>
              {quota && (
                <small>
                  Usage today: {quota.used}/{quota.limit}
                </small>
              )}
              <Button
                icon="close"
                circular
                size="mini"
                onClick={() => setOpen(false)}
              />
            </div>
          </div>

          {/* Body */}
          <div className={styles.aiGrid}>
            {/* Messages */}
            <div className={styles.aiMessages}>
              {messages.length === 0 && (
                <Message size="small">
                  Ask for any change and it&apos;ll be applied immediately. Undo
                  is available on each AI change.
                </Message>
              )}

              {messages.map((m) => {
                const isAssistant = m.role === "assistant";
                return (
                  <div
                    key={m.id}
                    className={`${styles.aiMessageRow} ${isAssistant ? styles.aiRowAssistant : styles.aiRowUser}`}
                  >
                    <div
                      className={`${styles.aiMessageBubble} ${
                        isAssistant
                          ? styles.aiMessageBubbleAssistant
                          : styles.aiMessageBubbleUser
                      }`}
                    >
                      {isAssistant ? (
                        <MarkdownPreview value={m.text} />
                      ) : (
                        <div>{m.text}</div>
                      )}

                      {isAssistant && m.changes?.length > 0 && (
                        <div className={styles.aiChangeList}>
                          {m.changes.map((change) => {
                            const applied = Boolean(
                              appliedSnapshots[change.id]
                            );
                            return (
                              <div
                                key={change.id}
                                className={styles.aiChangeCard}
                              >
                                <div className={styles.aiChangeHeader}>
                                  <div className={styles.aiChangeTitle}>
                                    <strong>{change.label}</strong>
                                    <span className={styles.aiChangeMeta}>
                                      {change.kind === "append"
                                        ? "Append"
                                        : "Replace"}
                                    </span>
                                  </div>
                                  {applied && (
                                    <span className={styles.aiChangeApplied}>
                                      Applied
                                    </span>
                                  )}
                                </div>
                                {change.preview && (
                                  <div className={styles.aiChangePreview}>
                                    {change.preview}
                                  </div>
                                )}
                                <div className={styles.aiChangeActions}>
                                  {!applied ? (
                                    <Button
                                      size="mini"
                                      className={`btn-primary ${styles.aiApplyButton}`}
                                      onClick={() => handleApplyChange(change)}
                                    >
                                      Apply Change
                                    </Button>
                                  ) : (
                                    <Button
                                      size="mini"
                                      basic
                                      className={styles.aiUndoButton}
                                      onClick={() => handleUndoChange(change)}
                                    >
                                      Undo
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {error && <Message negative>{error}</Message>}
            </div>

            {/* Composer */}
            <div className={styles.aiComposerBar}>
              <div className={styles.aiComposerRow}>
                <div className={styles.aiComposerInput}>
                  <Input
                    fluid
                    placeholder="Talk to the editor… e.g., “help me write an intro”, “suggest tags”, or “replace the body with this: ```md ... ```”"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendAi();
                      }
                    }}
                  />
                </div>
                <Button
                  primary
                  className="btn-primary"
                  loading={busy}
                  disabled={busy || !input.trim()}
                  onClick={sendAi}
                  content="Send"
                />
              </div>
            </div>
          </div>
        </Segment>
      )}
    </>,
    portalNode
  );
}
