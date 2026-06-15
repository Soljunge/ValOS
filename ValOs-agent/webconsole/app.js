const messagesEl = document.getElementById("messages-inner");
const formEl = document.getElementById("composer");
const inputEl = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const attachBtn = document.getElementById("attach-btn");
const fileInputEl = document.getElementById("file-input");
const composerAttachmentsEl = document.getElementById("composer-attachments");
const composerDropzoneEl = document.getElementById("composer-dropzone");
const clearBtn = document.getElementById("clear-btn");
const newChatBtn = document.getElementById("new-chat-btn");
const logoMenuBtn = document.getElementById("logo-menu-btn");
const logoDropdown = document.getElementById("logo-dropdown");
const template = document.getElementById("message-template");
const healthDot = document.getElementById("health-dot");
const healthText = document.getElementById("health-text");
const backendStatus = document.getElementById("backend-status");
const activeModelPill = document.getElementById("active-model-pill");
const providerSelect = document.getElementById("provider-select");
const providerBaseUrlWrap = document.getElementById("provider-base-url-wrap");
const providerBaseUrlInput = document.getElementById("provider-base-url-input");
const modelSelect = document.getElementById("model-select");
const apiKeySummary = document.getElementById("api-key-summary");
const apiKeyInput = document.getElementById("api-key-input");
const apiKeyEditor = document.getElementById("api-key-editor");
const changeApiKeyBtn = document.getElementById("change-api-key-btn");
const clearApiKeyBtn = document.getElementById("clear-api-key-btn");
const cancelApiKeyBtn = document.getElementById("cancel-api-key-btn");
const telegramHomeChannelInput = document.getElementById("telegram-home-channel-input");
const telegramBotSummary = document.getElementById("telegram-bot-summary");
const telegramBotInput = document.getElementById("telegram-bot-input");
const telegramBotEditor = document.getElementById("telegram-bot-editor");
const changeTelegramBotBtn = document.getElementById("change-telegram-bot-btn");
const clearTelegramBotBtn = document.getElementById("clear-telegram-bot-btn");
const cancelTelegramBotBtn = document.getElementById("cancel-telegram-bot-btn");
const openLogsBtn = document.getElementById("open-logs-btn");
const saveSettingsBtn = document.getElementById("save-settings-btn");
const settingsNote = document.getElementById("settings-note");
const themeSelect = document.getElementById("theme-select");
const densitySelect = document.getElementById("density-select");
const accentSelect = document.getElementById("accent-select");
const sidebarWidthInput = document.getElementById("sidebar-width-input");
const resetDesignBtn = document.getElementById("reset-design-btn");
const emptyStateEl = document.getElementById("empty-state");
const sidebarTabsEl = document.getElementById("sidebar-tabs");
const topbarTitleEl = document.getElementById("topbar-title");
const topbarMetaEl = document.getElementById("topbar-meta");
const sessionEmptyEl = document.getElementById("session-empty");
const sessionItemsEl = document.getElementById("session-items");
const panelViews = Array.from(document.querySelectorAll(".panel-view"));
const memoryProviderLabel = document.getElementById("memory-provider-label");
const memoryStatusEl = document.getElementById("memory-status");
const refreshMemoryBtn = document.getElementById("refresh-memory-btn");
const memoryListNotesEl = document.getElementById("memory-list-notes");
const memoryListUserEl = document.getElementById("memory-list-user");
const memoryEmptyNotesEl = document.getElementById("memory-empty-notes");
const memoryEmptyUserEl = document.getElementById("memory-empty-user");
const memoryUsageNotesEl = document.getElementById("memory-usage-notes");
const memoryUsageUserEl = document.getElementById("memory-usage-user");
const walletListEl = document.getElementById("wallet-list");
const messagesScrollEl = document.getElementById("messages");
const focusBtn = document.getElementById("focus-btn");
const stopBtn = document.getElementById("stop-btn");
const queueBar = document.getElementById("queue-bar");
const queueLabel = document.getElementById("queue-label");
const clearQueueBtn = document.getElementById("clear-queue-btn");
const newMessagesBtn = document.getElementById("new-messages-btn");
const outputSidebar = document.getElementById("output-sidebar");
const outputDivider = document.getElementById("output-divider");
const outputSidebarTitle = document.getElementById("output-sidebar-title");
const outputSidebarMeta = document.getElementById("output-sidebar-meta");
const outputSidebarContent = document.getElementById("output-sidebar-content");
const outputCloseBtn = document.getElementById("output-close-btn");
const thinkingBtn = document.getElementById("thinking-btn");
const executionStatus = document.getElementById("execution-status");
const executionStatusText = document.getElementById("execution-status-text");
const controlWorkspace = document.getElementById("control-workspace");
const controlSideNav = document.getElementById("control-side-nav");
const controlContent = document.getElementById("control-content");
const controlTitle = document.getElementById("control-title");
const controlSubtitle = document.getElementById("control-subtitle");
const controlRefreshBtn = document.getElementById("control-refresh-btn");
const loadingScreenEl = document.getElementById("loading-screen");
const loadingStartedAt = performance.now();

let history = [];
let apiKeyProvider = "";
let providerOptions = [];
let apiKeyEditing = false;
let telegramBotEditing = false;
let memoryLoaded = false;
let currentTab = "chat";
let savedConversations = [];
let activeConversationId = "";
let pendingAttachments = [];
let dragDepth = 0;
let currentRequestController = null;
let messageQueue = [];
let isGenerating = false;
let userNearBottom = true;
let outputSidebarWidth = 420;
let showThinking = false;
let activeControlSection = "overview";

const CONTROL_SECTIONS = [
  ["overview", "Overview", "Gateway status and system summary."],
  ["agents", "Agents", "Profiles, identities, models, and workspaces."],
  ["channels", "Channels", "Messaging channel configuration state."],
  ["instances", "Instances", "Running ValOs processes and services."],
  ["sessions", "Sessions", "Persistent sessions across every surface."],
  ["usage", "Usage", "Token consumption and API cost estimates."],
  ["cron", "Cron Jobs", "Scheduled and recurring agent runs."],
  ["skills", "Skills", "Installed agent capabilities."],
  ["nodes", "Nodes", "Paired users, devices, and pending approvals."],
  ["config", "Configuration", "Sanitized runtime configuration."],
  ["debug", "Debug", "Runtime paths, versions, and health signals."],
  ["logs", "Logs", "Gateway and agent log files."],
];

const STORAGE_KEY = "valos-web-conversations";
const DESIGN_STORAGE_KEY = "valos-web-design";
const DEFAULT_DESIGN = {
  theme: "dark",
  density: "comfortable",
  accent: "neutral",
  sidebarWidth: 300,
};
const MAX_TEXT_ATTACHMENT_CHARS = 120000;
const AGENTIC_WALLETS = [
  {
    name: "Bankr",
    emoji: "🏦",
    network: "Base / EVM",
    status: "Agentic wallet rail for on-chain actions and payments",
    prompt: "Help me connect Bankr as my ValOs agentic wallet.",
  },
  {
    name: "Coinbase",
    emoji: "🔵",
    network: "Base / EVM",
    status: "Agentic wallet option for Base USDC funding and wallet tools",
    prompt: "Help me connect Coinbase as my ValOs agentic wallet.",
  },
  {
    name: "Sponge",
    emoji: "🧽",
    network: "Agentic wallet",
    status: "Agentic wallet rail for autonomous spend and payment workflows",
    prompt: "Help me connect Sponge as my ValOs agentic wallet.",
  },
  {
    name: "More coming soon",
    emoji: "+",
    network: "Additional agentic wallets",
    status: "More supported agentic wallet connectors will appear here.",
    comingSoon: true,
  },
];
const TEXT_EXTENSIONS = new Set([
  "txt", "md", "markdown", "json", "csv", "tsv", "py", "js", "ts", "jsx", "tsx",
  "html", "htm", "css", "xml", "yml", "yaml", "toml", "ini", "cfg", "conf",
  "sh", "zsh", "bash", "sql", "log", "rst",
]);

function syncEmptyState() {
  if (!emptyStateEl) {
    return;
  }
  const hasMessages = messagesEl.children.length > 0;
  emptyStateEl.hidden = hasMessages;
  if (clearBtn) {
    clearBtn.style.display = hasMessages ? "inline-flex" : "none";
  }
  updateTopbarCopy();
  renderConversationList();
}

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeDesign(value) {
  const design = { ...DEFAULT_DESIGN, ...(value || {}) };
  if (!["dark", "midnight", "light"].includes(design.theme)) {
    design.theme = DEFAULT_DESIGN.theme;
  }
  if (!["comfortable", "compact", "spacious"].includes(design.density)) {
    design.density = DEFAULT_DESIGN.density;
  }
  if (!["neutral", "blue", "green", "rose", "amber", "cyan", "violet", "orange"].includes(design.accent)) {
    design.accent = DEFAULT_DESIGN.accent;
  }
  const width = Number(design.sidebarWidth);
  design.sidebarWidth = Number.isFinite(width)
    ? Math.min(420, Math.max(260, width))
    : DEFAULT_DESIGN.sidebarWidth;
  return design;
}

function readDesignSettings() {
  return normalizeDesign(safeJsonParse(safeStorageRead(DESIGN_STORAGE_KEY), DEFAULT_DESIGN));
}

function writeDesignSettings(design) {
  safeStorageWrite(JSON.stringify(normalizeDesign(design)), DESIGN_STORAGE_KEY);
}

function applyDesignSettings(design) {
  const next = normalizeDesign(design);
  document.body.dataset.theme = next.theme;
  document.body.dataset.density = next.density;
  document.body.dataset.accent = next.accent;
  document.documentElement.style.setProperty("--sidebar-width", `${next.sidebarWidth}px`);
  if (themeSelect) {
    themeSelect.value = next.theme;
  }
  if (densitySelect) {
    densitySelect.value = next.density;
  }
  if (accentSelect) {
    accentSelect.value = next.accent;
  }
  if (sidebarWidthInput) {
    sidebarWidthInput.value = String(next.sidebarWidth);
  }
}

function updateDesignFromControls() {
  const next = normalizeDesign({
    theme: themeSelect?.value,
    density: densitySelect?.value,
    accent: accentSelect?.value,
    sidebarWidth: sidebarWidthInput?.value,
  });
  applyDesignSettings(next);
  writeDesignSettings(next);
}

function setLogoMenuOpen(open) {
  if (!logoMenuBtn || !logoDropdown) {
    return;
  }
  logoDropdown.hidden = !open;
  logoMenuBtn.setAttribute("aria-expanded", open ? "true" : "false");
}

function setActiveModel(model) {
  const label = model && model.trim() ? model.trim() : "Configured model";
  if (activeModelPill) {
    activeModelPill.textContent = label;
  }
  if (modelSelect) {
    modelSelect.value = label === "Configured model" ? "" : label;
  }
}

function currentProviderOption() {
  const selected = providerSelect?.value || "auto";
  return providerOptions.find((option) => option.id === selected) || null;
}

function renderProviderOptions(options, selectedProvider) {
  if (!providerSelect) {
    return;
  }
  providerOptions = Array.isArray(options) ? options : [];
  if (!providerOptions.length) {
    providerOptions = [{ id: "auto", label: "Auto", base_url: "", api_key_env: "", custom_base_url: false }];
  }
  providerSelect.innerHTML = providerOptions
    .map((option) => `<option value="${escapeHtml(option.id)}">${escapeHtml(option.label || option.id)}</option>`)
    .join("");
  providerSelect.value = providerOptions.some((option) => option.id === selectedProvider)
    ? selectedProvider
    : "auto";
}

function syncProviderControls(data = null) {
  const option = currentProviderOption();
  const needsBaseUrl = Boolean(option?.custom_base_url);
  if (providerBaseUrlWrap) {
    providerBaseUrlWrap.hidden = !needsBaseUrl;
  }
  if (providerBaseUrlInput && document.activeElement !== providerBaseUrlInput) {
    providerBaseUrlInput.value = data?.provider_base_url || option?.base_url || "";
  }
  if (!apiKeyEditing) {
    apiKeyProvider = option?.api_key_env || data?.api_key_provider || "";
  }
}

function filenameExtension(name) {
  const parts = String(name || "").toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function isImageFile(file) {
  return String(file?.type || "").startsWith("image/");
}

function isTextDocument(file) {
  const mime = String(file?.type || "");
  if (mime.startsWith("text/")) {
    return true;
  }
  return TEXT_EXTENSIONS.has(filenameExtension(file?.name || ""));
}

function attachmentBadgeLabel(attachment) {
  if (attachment.kind === "image") {
    return "Image";
  }
  if (attachment.kind === "text") {
    return "Document";
  }
  return "File";
}

function summarizeContent(content) {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }
  const parts = [];
  let imageCount = 0;
  for (const part of content) {
    if (typeof part === "string" && part.trim()) {
      parts.push(part.trim());
      continue;
    }
    if (!part || typeof part !== "object") {
      continue;
    }
    if (part.type === "input_text" || part.type === "text" || part.type === "output_text") {
      const text = String(part.text || "").trim();
      if (text) {
        parts.push(text);
      }
      continue;
    }
    if (part.type === "image_url" || part.type === "input_image") {
      imageCount += 1;
    }
  }
  if (imageCount) {
    parts.push(`[Attached ${imageCount} image${imageCount === 1 ? "" : "s"}]`);
  }
  return parts.join("\n\n").trim();
}

function renderPendingAttachments() {
  if (!composerAttachmentsEl) {
    return;
  }
  composerAttachmentsEl.hidden = pendingAttachments.length === 0;
  if (!pendingAttachments.length) {
    composerAttachmentsEl.innerHTML = "";
    return;
  }
  composerAttachmentsEl.innerHTML = pendingAttachments
    .map((attachment, index) => `<div class="attachment-chip${attachment.kind === "image" ? " attachment-chip-image" : ""}">${attachment.kind === "image" ? `<img src="${attachment.dataUrl}" alt="">` : ""}<span class="attachment-chip-kind">${attachmentBadgeLabel(attachment)}</span><span class="attachment-chip-name">${escapeHtml(attachment.name)}</span><button class="attachment-chip-remove" type="button" data-attachment-index="${index}" aria-label="Remove attachment">×</button></div>`)
    .join("");
}

function setDropzoneVisible(visible) {
  if (composerDropzoneEl) {
    composerDropzoneEl.hidden = !visible;
  }
}

function clearPendingAttachments() {
  pendingAttachments = [];
  renderPendingAttachments();
}

async function fileToDataUrl(file) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function normalizeAttachment(file) {
  if (isImageFile(file)) {
    const dataUrl = await fileToDataUrl(file);
    return {
      kind: "image",
      name: file.name,
      dataUrl,
      content: {
        type: "image_url",
        image_url: { url: dataUrl },
      },
    };
  }

  if (isTextDocument(file)) {
    const raw = await file.text();
    const text = raw.length > MAX_TEXT_ATTACHMENT_CHARS
      ? `${raw.slice(0, MAX_TEXT_ATTACHMENT_CHARS)}\n\n[Document truncated in WebUI after ${MAX_TEXT_ATTACHMENT_CHARS} characters.]`
      : raw;
    return {
      kind: "text",
      name: file.name,
      content: {
        type: "input_text",
        text: `[Attached document: ${file.name}]\n${text}`,
      },
    };
  }

  return {
    kind: "unsupported",
    name: file.name,
    content: {
      type: "input_text",
      text: `[Attached file: ${file.name}]\nThis file type cannot be parsed directly in the current WebUI. Ask the agent how to inspect it in the workspace.`,
    },
  };
}

async function addFiles(files) {
  const list = Array.from(files || []);
  if (!list.length) {
    return;
  }
  const next = [];
  for (const file of list) {
    next.push(await normalizeAttachment(file));
  }
  pendingAttachments = [...pendingAttachments, ...next];
  renderPendingAttachments();
}

function buildOutgoingMessage() {
  const text = inputEl.value.trim();
  if (!pendingAttachments.length) {
    return text;
  }
  const parts = [];
  if (text) {
    parts.push({ type: "input_text", text });
  }
  pendingAttachments.forEach((attachment) => {
    parts.push(attachment.content);
  });
  return parts;
}

function safeStorageRead(key = STORAGE_KEY) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageWrite(value, key = STORAGE_KEY) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function makeConversationTitle(messages) {
  const firstUserMessage = messages.find((item) => item.role === "user" && item.content);
  const firstUser = summarizeContent(firstUserMessage?.content || "").trim();
  if (!firstUser) {
    return "New conversation";
  }
  return firstUser.length > 40 ? `${firstUser.slice(0, 40)}...` : firstUser;
}

function timestampLabel(value) {
  try {
    return new Date(value).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function currentConversationRecord() {
  if (!activeConversationId) {
    return null;
  }
  return savedConversations.find((item) => item.id === activeConversationId) || null;
}

function persistCurrentConversation() {
  if (!history.length) {
    return;
  }
  const now = new Date().toISOString();
  const existing = currentConversationRecord();
  const record = {
    id: activeConversationId || `conv_${Date.now()}`,
    title: makeConversationTitle(history),
    updatedAt: now,
    messages: history.map((item) => ({ role: item.role, content: item.content, tools: item.tools || [], reasoning: item.reasoning || "" })),
  };

  activeConversationId = record.id;
  if (existing) {
    savedConversations = savedConversations.map((item) => (item.id === record.id ? record : item));
  } else {
    savedConversations = [record, ...savedConversations];
  }
  savedConversations.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  safeStorageWrite(JSON.stringify(savedConversations));
  renderConversationList();
}

function loadSavedConversations() {
  const raw = safeStorageRead();
  if (!raw) {
    savedConversations = [];
    renderConversationList();
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    savedConversations = Array.isArray(parsed) ? parsed : [];
  } catch {
    savedConversations = [];
  }
  renderConversationList();
}

function renderConversationList() {
  if (!sessionItemsEl || !sessionEmptyEl) {
    return;
  }
  const hasSaved = savedConversations.length > 0;
  sessionEmptyEl.hidden = hasSaved;
  sessionItemsEl.innerHTML = "";
  if (!hasSaved) {
    return;
  }
  sessionItemsEl.innerHTML = savedConversations
    .map((item) => {
      const active = item.id === activeConversationId ? " active" : "";
      const count = Array.isArray(item.messages) ? item.messages.length : 0;
      return `<button class="session-item${active}" type="button" data-conversation-id="${item.id}"><span class="session-item-title">${escapeHtml(item.title || "Conversation")}</span><span class="session-item-meta">${count} messages • ${escapeHtml(timestampLabel(item.updatedAt))}</span></button>`;
    })
    .join("");
}

function loadConversation(conversationId) {
  const record = savedConversations.find((item) => item.id === conversationId);
  if (!record) {
    return;
  }
  currentRequestController?.abort();
  messageQueue = [];
  renderQueue();
  activeConversationId = record.id;
  history = Array.isArray(record.messages) ? record.messages.map((item) => ({ role: item.role, content: item.content, tools: item.tools || [], reasoning: item.reasoning || "" })) : [];
  messagesEl.innerHTML = "";
  history.forEach((item) => addMessage(item.role, item.content, item.tools || [], item.reasoning || ""));
  inputEl.value = "";
  clearPendingAttachments();
  autoResizeInput();
  setActiveTab("chat");
  renderConversationList();
}

function setSettingsState(data) {
  renderProviderOptions(data.provider_options, data.provider || "auto");
  syncProviderControls(data);
  if (modelSelect && data.model) {
    modelSelect.value = data.model;
  }
  if (telegramHomeChannelInput) {
    telegramHomeChannelInput.value = data.telegram_home_channel || "";
  }
  apiKeyProvider = currentProviderOption()?.api_key_env || data.api_key_provider || "";
  if (apiKeySummary) {
    const option = currentProviderOption();
    const apiLabel = option?.api_key_env
      ? `${option.label || data.api_key_provider_label || "Provider"} key`
      : "API key";
    apiKeySummary.dataset.state = data.api_key_set ? "set" : "empty";
    apiKeySummary.innerHTML = data.api_key_set
      ? `<span>${data.api_key_provider_label || "API"} key saved</span><small>${data.api_key_masked || "stored"}</small>`
      : `<span>No ${escapeHtml(apiLabel)} saved</span><small>Paste one to start chatting</small>`;
  }
  if (changeApiKeyBtn) {
    changeApiKeyBtn.textContent = data.api_key_set ? "Change key" : "Add key";
  }
  if (clearApiKeyBtn) {
    clearApiKeyBtn.disabled = !data.api_key_set;
  }
  if (apiKeyInput) {
    apiKeyInput.value = "";
    apiKeyInput.dataset.hasKey = data.api_key_set ? "true" : "false";
  }
  if (settingsNote) {
    if (data.telegram_bot_set) {
      settingsNote.textContent = "Telegram bot is configured";
    } else if (data.api_key_set) {
      settingsNote.textContent = `${data.api_key_provider_label || "API"} key is configured`;
    } else {
      settingsNote.textContent = "No API key saved yet";
    }
  }
  if (telegramBotSummary) {
    telegramBotSummary.dataset.state = data.telegram_bot_set ? "set" : "empty";
    telegramBotSummary.innerHTML = data.telegram_bot_set
      ? `<span>BotFather token saved</span><small>${data.telegram_bot_masked || "stored"}</small>`
      : "<span>No BotFather token saved</span><small>Not configured</small>";
  }
  if (changeTelegramBotBtn) {
    changeTelegramBotBtn.textContent = data.telegram_bot_set ? "Change bot" : "Add bot";
  }
  if (clearTelegramBotBtn) {
    clearTelegramBotBtn.disabled = !data.telegram_bot_set;
  }
  if (telegramBotInput) {
    telegramBotInput.value = "";
  }
  closeApiKeyEditor(false);
  closeTelegramBotEditor(false);
}

function openApiKeyEditor() {
  apiKeyEditing = true;
  if (apiKeyEditor) {
    apiKeyEditor.hidden = false;
  }
  if (changeApiKeyBtn) {
    changeApiKeyBtn.disabled = true;
  }
  if (apiKeyInput) {
    apiKeyInput.value = "";
    apiKeyInput.focus();
  }
}

function closeApiKeyEditor(clearInput = true) {
  apiKeyEditing = false;
  if (apiKeyEditor) {
    apiKeyEditor.hidden = true;
  }
  if (clearInput && apiKeyInput) {
    apiKeyInput.value = "";
  }
  if (changeApiKeyBtn) {
    changeApiKeyBtn.disabled = false;
  }
}

function openTelegramBotEditor() {
  telegramBotEditing = true;
  if (telegramBotEditor) {
    telegramBotEditor.hidden = false;
  }
  if (changeTelegramBotBtn) {
    changeTelegramBotBtn.disabled = true;
  }
  if (telegramBotInput) {
    telegramBotInput.value = "";
    telegramBotInput.focus();
  }
}

function closeTelegramBotEditor(clearInput = true) {
  telegramBotEditing = false;
  if (telegramBotEditor) {
    telegramBotEditor.hidden = true;
  }
  if (clearInput && telegramBotInput) {
    telegramBotInput.value = "";
  }
  if (changeTelegramBotBtn) {
    changeTelegramBotBtn.disabled = false;
  }
}

function scrollMessagesToBottom(force = false) {
  if (!messagesScrollEl || (!force && !userNearBottom)) {
    if (newMessagesBtn && !force) {
      newMessagesBtn.hidden = false;
    }
    return;
  }
  messagesScrollEl.scrollTop = messagesScrollEl.scrollHeight;
  userNearBottom = true;
  if (newMessagesBtn) {
    newMessagesBtn.hidden = true;
  }
}

function addMessage(role, content, tools = [], reasoning = "") {
  const node = template.content.firstElementChild.cloneNode(true);
  node.classList.add(role);
  node.querySelector(".message-role").textContent = role === "user" ? "You" : "ValOs";
  node.querySelector(".role-icon").textContent = role === "user" ? "Y" : "AI";
  node.querySelector(".message-time").textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  node.querySelector(".message-content").textContent = summarizeContent(content);
  messagesEl.appendChild(node);
  tools.forEach((tool) => renderToolCard(node, tool));
  if (reasoning) {
    const reasoningEl = document.createElement("pre");
    reasoningEl.className = "message-reasoning";
    reasoningEl.textContent = reasoning;
    reasoningEl.hidden = !showThinking;
    node.querySelector(".msg-body").after(reasoningEl);
  }
  scrollMessagesToBottom(role === "user");
  syncEmptyState();
  return node;
}

function formatToolArguments(args) {
  if (typeof args === "string") {
    return args;
  }
  try {
    return JSON.stringify(args || {}, null, 2);
  } catch {
    return String(args || "");
  }
}

function openToolOutput(tool) {
  outputSidebarTitle.textContent = tool.name || "Tool output";
  outputSidebarMeta.textContent = tool.status === "complete" ? "Completed" : "Running";
  outputSidebarContent.textContent = tool.output || formatToolArguments(tool.arguments) || "No output yet.";
  outputSidebar.style.width = `${outputSidebarWidth}px`;
  outputSidebar.hidden = false;
  outputDivider.hidden = false;
}

function closeToolOutput() {
  outputSidebar.hidden = true;
  outputDivider.hidden = true;
}

function renderToolCard(messageNode, tool) {
  const container = messageNode?.querySelector(".tool-cards");
  if (!container) {
    return null;
  }
  let card = container.querySelector(`[data-tool-call-id="${CSS.escape(String(tool.call_id || ""))}"]`);
  if (!card) {
    card = document.createElement("button");
    card.type = "button";
    card.className = "tool-card";
    card.dataset.toolCallId = tool.call_id || `tool_${Date.now()}`;
    container.appendChild(card);
  }
  const status = tool.status || "running";
  card.classList.toggle("complete", status === "complete");
  card.classList.toggle("running", status !== "complete");
  card.innerHTML = `<span class="tool-card-status"></span><span class="tool-card-copy"><strong>${escapeHtml(tool.name || "Tool")}</strong><small>${escapeHtml(status === "complete" ? "Completed" : "Running...")}</small></span><span class="tool-card-action">View</span>`;
  card.onclick = () => openToolOutput(tool);
  return card;
}

function applyToolEvent(messageNode, tools, event) {
  const callId = String(event.call_id || `${event.name || "tool"}_${tools.length}`);
  let tool = tools.find((item) => item.call_id === callId);
  if (!tool) {
    tool = { call_id: callId, name: event.name || "Tool", arguments: event.arguments || {}, output: "", status: "running" };
    tools.push(tool);
  }
  tool.name = event.name || tool.name;
  tool.arguments = event.arguments ?? tool.arguments;
  if (event.type === "tool_complete") {
    tool.output = typeof event.output === "string" ? event.output : formatToolArguments(event.output);
    tool.status = "complete";
  }
  renderToolCard(messageNode, tool);
  scrollMessagesToBottom();
}

function setExecutionStatus(message, kind = "thinking") {
  if (!executionStatus || !executionStatusText) {
    return;
  }
  executionStatus.hidden = !message;
  executionStatus.dataset.kind = kind;
  executionStatusText.textContent = message || "";
}

function applyExecutionEvent(messageNode, assistantEntry, event) {
  if (event.type === "tool_start" || event.type === "tool_complete") {
    applyToolEvent(messageNode, assistantEntry.tools, event);
    setExecutionStatus(event.type === "tool_complete" ? `${event.name} completed` : `Running ${event.name}...`, "tool");
    return;
  }
  if (event.type === "reasoning") {
    assistantEntry.reasoning = `${assistantEntry.reasoning || ""}${event.message || ""}`;
    let reasoningEl = messageNode.querySelector(".message-reasoning");
    if (!reasoningEl) {
      reasoningEl = document.createElement("pre");
      reasoningEl.className = "message-reasoning";
      messageNode.querySelector(".msg-body").after(reasoningEl);
    }
    reasoningEl.textContent = assistantEntry.reasoning;
    reasoningEl.hidden = !showThinking;
    return;
  }
  if (event.type === "thinking") {
    setExecutionStatus(event.message || "Thinking...", "thinking");
    return;
  }
  if (event.type === "fallback" || event.type === "compaction" || event.type === "status") {
    setExecutionStatus(event.message || event.type, event.type);
  }
}

function setHealth(ok) {
  if (backendStatus) {
    backendStatus.classList.toggle("online", ok);
    backendStatus.classList.toggle("offline", !ok);
  }
  healthDot.classList.toggle("ok", ok);
  healthText.textContent = ok ? "Backend ready" : "Backend offline";
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function formatUsage(summary) {
  if (!summary) {
    return "0 entries";
  }
  const count = Number(summary.entry_count || 0);
  const usage = summary.usage || "";
  return usage ? `${count} entries • ${usage}` : `${count} entries`;
}

function renderMemoryEntries(container, emptyEl, entries) {
  if (!container || !emptyEl) {
    return;
  }
  container.innerHTML = "";
  const items = Array.isArray(entries) ? entries : [];
  emptyEl.hidden = items.length > 0;
  if (!items.length) {
    return;
  }
  container.innerHTML = items
    .map((entry, index) => `<article class="memory-entry"><div class="memory-entry-index">${index + 1}</div><pre class="memory-entry-body">${escapeHtml(entry)}</pre></article>`)
    .join("");
}

function renderWalletCards() {
  if (!walletListEl) {
    return;
  }
  walletListEl.innerHTML = AGENTIC_WALLETS
    .map((wallet) => `
      <article class="wallet-card${wallet.comingSoon ? " wallet-card-muted" : ""}">
        <div class="wallet-card-icon" aria-hidden="true">${wallet.emoji}</div>
        <div class="wallet-card-body">
          <div class="wallet-card-header">
            <div>
              <h2>${escapeHtml(wallet.name)}</h2>
              <div class="wallet-card-network">${escapeHtml(wallet.network)}</div>
            </div>
          </div>
          <p>${escapeHtml(wallet.status)}</p>
          ${wallet.comingSoon
            ? `<div class="wallet-coming-soon">Coming soon</div>`
            : `<button class="settings-btn secondary wallet-connect-btn" type="button" data-wallet-name="${escapeHtml(wallet.name)}">Connect</button>`}
        </div>
      </article>
    `)
    .join("");
}

function startWalletConnect(walletName) {
  const wallet = AGENTIC_WALLETS.find((item) => item.name === walletName);
  if (!wallet) {
    return;
  }
  setActiveTab("chat");
  inputEl.value = wallet.prompt;
  autoResizeInput();
  inputEl.focus();
}

function activeTabButton() {
  return sidebarTabsEl?.querySelector(`.nav-tab[data-tab="${currentTab}"]`) || null;
}

function updateTopbarCopy() {
  const tabButton = activeTabButton();
  const defaultTitle = tabButton?.dataset.title || "ValOs";
  let meta = tabButton?.dataset.meta || "";

  if (currentTab === "chat") {
    meta = messagesEl.children.length > 0 ? "Conversation in progress" : "Start a new conversation";
  }

  if (topbarTitleEl) {
    topbarTitleEl.textContent = defaultTitle;
  }
  if (topbarMetaEl) {
    topbarMetaEl.textContent = meta;
  }
}

function setActiveTab(tab) {
  currentTab = tab;
  sidebarTabsEl?.querySelectorAll(".nav-tab").forEach((node) => {
    node.classList.toggle("active", node.dataset.tab === tab);
  });
  panelViews.forEach((panel, index) => {
    const panelName = panel.dataset.panel || (index === 0 ? "chat" : "");
    const isActive = panelName === tab;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });
  const controlActive = tab === "control";
  document.body.classList.toggle("control-mode", controlActive);
  if (controlWorkspace) {
    controlWorkspace.hidden = !controlActive;
  }
  if (controlActive) {
    loadControlSection(activeControlSection);
  }
  updateTopbarCopy();
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value || 0));
}

function formatCost(value) {
  return `$${Number(value || 0).toFixed(4)}`;
}

function controlCard(title, value, meta = "") {
  return `<article class="control-stat"><span>${escapeHtml(title)}</span><strong>${escapeHtml(value)}</strong>${meta ? `<small>${escapeHtml(meta)}</small>` : ""}</article>`;
}

function controlTable(columns, rows) {
  if (!rows.length) {
    return `<div class="control-empty">No data available.</div>`;
  }
  return `<div class="control-table-wrap"><table class="control-table"><thead><tr>${columns.map(([key, label]) => `<th>${escapeHtml(label)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${columns.map(([key]) => `<td>${escapeHtml(row[key] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function renderControlData(section, data) {
  if (section === "overview") {
    const totals = data.totals || {};
    controlContent.innerHTML = `<div class="control-stats">${controlCard("Gateway", data.gateway?.running ? "Running" : "Stopped", data.gateway?.pid ? `PID ${data.gateway.pid}` : "")}${controlCard("Sessions", formatNumber(totals.sessions))}${controlCard("Messages", formatNumber(totals.messages))}${controlCard("Tool calls", formatNumber(totals.tool_calls))}${controlCard("Tokens", formatNumber((totals.input_tokens || 0) + (totals.output_tokens || 0)))}${controlCard("Estimated cost", formatCost(totals.estimated_cost_usd))}${controlCard("Cron jobs", formatNumber(data.cron_jobs))}${controlCard("Skills", formatNumber(data.skills))}</div><div class="control-detail-card"><h3>Runtime</h3><dl><dt>Model</dt><dd>${escapeHtml(data.model || "Not configured")}</dd><dt>Provider</dt><dd>${escapeHtml(data.provider || "auto")}</dd></dl></div>`;
    return;
  }
  if (section === "agents") {
    controlContent.innerHTML = `<div class="control-grid">${(data.items || []).map((item) => `<article class="control-item"><div class="control-item-head"><strong>${escapeHtml(item.name)}</strong><span class="status-pill ${item.active ? "online" : ""}">${item.active ? "Active" : "Profile"}</span></div><p>${escapeHtml(item.identity || item.path)}</p><dl><dt>Model</dt><dd>${escapeHtml(item.model || "Default")}</dd><dt>Provider</dt><dd>${escapeHtml(item.provider || "Auto")}</dd><dt>Skills</dt><dd>${formatNumber(item.skills)}</dd><dt>Gateway</dt><dd>${item.gateway_running ? "Running" : "Stopped"}</dd></dl></article>`).join("")}</div>`;
    return;
  }
  if (section === "channels") {
    controlContent.innerHTML = `<div class="control-grid compact">${(data.items || []).map((item) => `<article class="control-item channel-item"><span class="status-dot ${item.configured ? "online" : ""}"></span><div><strong>${escapeHtml(item.name)}</strong><p>${item.configured ? "Configured" : "Not configured"}</p></div></article>`).join("")}</div>`;
    return;
  }
  if (section === "instances") {
    controlContent.innerHTML = controlTable([["name", "Instance"], ["status", "Status"], ["pid", "PID"]], data.items || []);
    return;
  }
  if (section === "sessions") {
    const rows = (data.items || []).map((item) => ({ title: item.title || item.preview || item.id, source: item.source, model: item.model || "", messages: item.message_count || 0, tools: item.tool_call_count || 0, tokens: (item.input_tokens || 0) + (item.output_tokens || 0) }));
    controlContent.innerHTML = controlTable([["title", "Session"], ["source", "Source"], ["model", "Model"], ["messages", "Messages"], ["tools", "Tools"], ["tokens", "Tokens"]], rows);
    return;
  }
  if (section === "usage") {
    const totals = data.totals || {};
    const rows = (data.by_source || []).map((item) => ({ ...item, tokens: formatNumber(item.tokens), cost: formatCost(item.cost) }));
    controlContent.innerHTML = `<div class="control-stats">${controlCard("Input tokens", formatNumber(totals.input_tokens))}${controlCard("Output tokens", formatNumber(totals.output_tokens))}${controlCard("Reasoning tokens", formatNumber(totals.reasoning_tokens))}${controlCard("Estimated cost", formatCost(totals.estimated_cost_usd))}${controlCard("Actual cost", formatCost(totals.actual_cost_usd))}</div>${controlTable([["source", "Source"], ["sessions", "Sessions"], ["tokens", "Tokens"], ["cost", "Cost"]], rows)}`;
    return;
  }
  if (section === "cron") {
    const rows = (data.items || []).map((item) => ({ name: item.name || item.id, schedule: item.schedule?.expr || item.schedule?.kind || item.schedule || "", enabled: item.enabled === false ? "Paused" : "Active", next: item.next_run_at || "", model: item.model || "Default" }));
    controlContent.innerHTML = controlTable([["name", "Job"], ["schedule", "Schedule"], ["enabled", "Status"], ["next", "Next run"], ["model", "Model"]], rows);
    return;
  }
  if (section === "skills") {
    controlContent.innerHTML = `<div class="control-grid">${(data.skills || []).map((item) => `<article class="control-item"><div class="control-item-head"><strong>${escapeHtml(item.name)}</strong><span class="status-pill">${escapeHtml(item.category || "skill")}</span></div><p>${escapeHtml(item.description || "No description")}</p></article>`).join("")}</div>`;
    return;
  }
  if (section === "nodes") {
    const approved = (data.approved || []).map((item) => ({ platform: item.platform, user: item.user_name || item.user_id, state: "Approved" }));
    const pending = (data.pending || []).map((item) => ({ platform: item.platform, user: item.user_name || item.user_id, state: `Pending (${item.age_minutes}m)` }));
    controlContent.innerHTML = controlTable([["platform", "Platform"], ["user", "Node / User"], ["state", "State"]], [...approved, ...pending]);
    return;
  }
  if (section === "config") {
    controlContent.innerHTML = `<div class="control-actions"><button class="settings-btn secondary" type="button" data-control-action="settings">Open editable settings</button></div><div class="control-detail-card"><h3>${escapeHtml(data.path || "config.yaml")}</h3><pre class="control-json">${escapeHtml(JSON.stringify(data.config || {}, null, 2))}</pre></div>`;
    return;
  }
  if (section === "debug") {
    controlContent.innerHTML = `<div class="control-stats">${controlCard("Gateway", data.gateway?.running ? "Running" : "Stopped", data.gateway?.pid ? `PID ${data.gateway.pid}` : "")}${controlCard("API health", data.health ? "Healthy" : "Unavailable")}${controlCard("Python", data.python || "")}</div><div class="control-detail-card"><dl><dt>Project root</dt><dd>${escapeHtml(data.project_root || "")}</dd><dt>ValOs home</dt><dd>${escapeHtml(data.valos_home || "")}</dd><dt>Snapshot time</dt><dd>${escapeHtml(data.time || "")}</dd></dl></div>`;
    return;
  }
  if (section === "logs") {
    controlContent.innerHTML = `<div class="control-actions"><button class="settings-btn secondary" type="button" data-control-action="logs">Open live logs</button></div>${controlTable([["name", "Log file"], ["size", "Bytes"], ["mtime", "Modified"]], data.files || [])}`;
  }
}

async function loadControlSection(section, force = false) {
  activeControlSection = section;
  const definition = CONTROL_SECTIONS.find(([id]) => id === section) || CONTROL_SECTIONS[0];
  controlTitle.textContent = definition[1];
  controlSubtitle.textContent = definition[2];
  controlSideNav?.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.section === section));
  controlContent.innerHTML = `<div class="control-loading">Loading ${escapeHtml(definition[1].toLowerCase())}...</div>`;
  controlRefreshBtn.disabled = true;
  try {
    const res = await fetch(`/api/control?section=${encodeURIComponent(section)}${force ? `&t=${Date.now()}` : ""}`);
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("The Web UI server is outdated. Restart `valos-agent web` and refresh this page.");
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to load control data");
    }
    renderControlData(section, data);
  } catch (error) {
    controlContent.innerHTML = `<div class="control-error">${escapeHtml(error.message)}</div>`;
  } finally {
    controlRefreshBtn.disabled = false;
  }
}

async function loadMemory(force = false) {
  if (!force && memoryLoaded) {
    return;
  }
  if (memoryStatusEl) {
    memoryStatusEl.textContent = "Loading saved memory...";
  }
  if (refreshMemoryBtn) {
    refreshMemoryBtn.disabled = true;
  }
  try {
    const res = await fetch("/api/memory");
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to load memory");
    }
    memoryLoaded = true;
    if (memoryProviderLabel) {
      memoryProviderLabel.textContent = data.provider_label || "Built-in memory";
    }
    if (memoryStatusEl) {
      memoryStatusEl.textContent = data.memory_path
        ? `Reading from ${data.memory_path}`
        : "Showing persisted memory";
    }
    if (memoryUsageNotesEl) {
      memoryUsageNotesEl.textContent = formatUsage(data.memory);
    }
    if (memoryUsageUserEl) {
      memoryUsageUserEl.textContent = formatUsage(data.user);
    }
    renderMemoryEntries(memoryListNotesEl, memoryEmptyNotesEl, data.memory?.entries);
    renderMemoryEntries(memoryListUserEl, memoryEmptyUserEl, data.user?.entries);
  } catch (error) {
    if (memoryStatusEl) {
      memoryStatusEl.textContent = `Failed to load memory: ${error.message}`;
    }
  } finally {
    if (refreshMemoryBtn) {
      refreshMemoryBtn.disabled = false;
    }
  }
}

async function checkHealth() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    setHealth(Boolean(data.ok));
    setActiveModel(data.model || "");
  } catch {
    setHealth(false);
  }
}

async function loadSettings() {
  try {
    const res = await fetch("/api/settings");
    const data = await res.json();
    if (res.ok) {
      setActiveModel(data.model || "");
      setSettingsState(data);
    }
  } catch {
    if (settingsNote) {
      settingsNote.textContent = "Unable to load settings";
    }
  }
}

async function saveSettings() {
  const payload = {
    provider: providerSelect ? providerSelect.value : "auto",
    provider_base_url: providerBaseUrlInput ? providerBaseUrlInput.value.trim() : "",
    model: modelSelect ? modelSelect.value.trim() : "",
    telegram_home_channel: telegramHomeChannelInput ? telegramHomeChannelInput.value.trim() : "",
  };
  if (apiKeyEditing && apiKeyInput) {
    payload.api_key = apiKeyInput.value.trim();
    payload.api_key_provider = apiKeyProvider;
  }
  if (telegramBotEditing && telegramBotInput) {
    payload.telegram_bot_token = telegramBotInput.value.trim();
  }

  if (saveSettingsBtn) {
    saveSettingsBtn.disabled = true;
  }
  try {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to save settings");
    }
    await loadSettings();
    await checkHealth();
    if (settingsNote) {
      settingsNote.textContent = "Settings saved";
    }
    closeApiKeyEditor();
    closeTelegramBotEditor();
  } catch (error) {
    if (settingsNote) {
      settingsNote.textContent = `Save failed: ${error.message}`;
    }
  } finally {
    if (saveSettingsBtn) {
      saveSettingsBtn.disabled = false;
    }
  }
}

saveSettingsBtn?.addEventListener("click", saveSettings);
providerSelect?.addEventListener("change", () => {
  syncProviderControls();
  const option = currentProviderOption();
  if (settingsNote) {
    settingsNote.textContent = option
      ? `Provider selected: ${option.label || option.id}`
      : "Provider selected";
  }
});
changeApiKeyBtn?.addEventListener("click", openApiKeyEditor);
cancelApiKeyBtn?.addEventListener("click", () => closeApiKeyEditor());
changeTelegramBotBtn?.addEventListener("click", openTelegramBotEditor);
cancelTelegramBotBtn?.addEventListener("click", () => closeTelegramBotEditor());
clearApiKeyBtn?.addEventListener("click", async () => {
  if (clearApiKeyBtn.disabled) {
    return;
  }
  clearApiKeyBtn.disabled = true;
  saveSettingsBtn.disabled = true;
  try {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clear_api_key: true,
        api_key_provider: apiKeyProvider,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to clear API key");
    }
    await loadSettings();
    await checkHealth();
    if (settingsNote) {
      settingsNote.textContent = "API key cleared";
    }
  } catch (error) {
    if (settingsNote) {
      settingsNote.textContent = `Clear failed: ${error.message}`;
    }
  } finally {
    clearApiKeyBtn.disabled = false;
    saveSettingsBtn.disabled = false;
  }
});
clearTelegramBotBtn?.addEventListener("click", async () => {
  if (clearTelegramBotBtn.disabled) {
    return;
  }
  clearTelegramBotBtn.disabled = true;
  saveSettingsBtn.disabled = true;
  try {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clear_telegram_bot: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to clear Telegram bot");
    }
    await loadSettings();
    if (settingsNote) {
      settingsNote.textContent = "Telegram bot cleared";
    }
  } catch (error) {
    if (settingsNote) {
      settingsNote.textContent = `Clear failed: ${error.message}`;
    }
  } finally {
    clearTelegramBotBtn.disabled = false;
    saveSettingsBtn.disabled = false;
  }
});
openLogsBtn?.addEventListener("click", () => {
  window.open("/logs.html?v=20260601d", "_blank", "noopener");
});
apiKeyInput?.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    saveSettings();
  }
  if (event.key === "Escape") {
    closeApiKeyEditor();
  }
});
telegramBotInput?.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    saveSettings();
  }
  if (event.key === "Escape") {
    closeTelegramBotEditor();
  }
});

function setGenerating(active) {
  isGenerating = active;
  sendBtn.disabled = false;
  stopBtn.hidden = !active;
  sendBtn.hidden = active;
  inputEl.placeholder = active ? "Type another message to queue it..." : "Message ValOs...";
}

function renderQueue() {
  const count = messageQueue.length;
  queueBar.hidden = count === 0;
  queueLabel.textContent = `${count} message${count === 1 ? "" : "s"} queued`;
}

function enqueueMessage(message) {
  messageQueue.push(message);
  renderQueue();
}

async function readChatStream(response, messageNode, assistantEntry) {
  if (!response.body) {
    throw new Error("Streaming response is unavailable");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let reply = "";
  const contentEl = messageNode.querySelector(".message-content");

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";
    for (const eventBlock of events) {
      const dataLine = eventBlock.split("\n").find((line) => line.startsWith("data:"));
      if (!dataLine) {
        continue;
      }
      const raw = dataLine.slice(5).trim();
      if (!raw || raw === "[DONE]") {
        continue;
      }
      let payload;
      try {
        payload = JSON.parse(raw);
      } catch {
        continue;
      }
      const delta = payload.choices?.[0]?.delta || {};
      if (delta.valos_event) {
        applyExecutionEvent(messageNode, assistantEntry, delta.valos_event);
        continue;
      }
      const text = delta.content || "";
      if (/^\n?`[^`]+`\n?$/.test(text)) {
        continue;
      }
      reply += text;
      assistantEntry.content = reply;
      contentEl.textContent = reply;
      scrollMessagesToBottom();
    }
    if (done) {
      break;
    }
  }
  return reply;
}

async function sendMessage(message) {
  const requestConversationId = activeConversationId;
  setGenerating(true);
  setExecutionStatus("Thinking...", "thinking");
  addMessage("user", message);
  history.push({ role: "user", content: message });
  const assistantEntry = { role: "assistant", content: "", tools: [] };
  const assistantNode = addMessage("assistant", "");
  assistantNode.classList.add("streaming");
  persistCurrentConversation();
  const requestController = new AbortController();
  currentRequestController = requestController;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: history.slice(0, -1), stream: true }),
      signal: requestController.signal,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Request failed");
    }
    const reply = await readChatStream(res, assistantNode, assistantEntry);
    assistantEntry.content = reply || "(No response)";
    assistantNode.querySelector(".message-content").textContent = assistantEntry.content;
    if (activeConversationId === requestConversationId) {
      history.push(assistantEntry);
      persistCurrentConversation();
    }
    setHealth(true);
  } catch (error) {
    const stopped = error.name === "AbortError";
    const text = stopped ? "Generation stopped." : `Error: ${error.message}`;
    assistantEntry.content = assistantEntry.content || text;
    assistantNode.querySelector(".message-content").textContent = assistantEntry.content;
    if (activeConversationId === requestConversationId) {
      history.push(assistantEntry);
      persistCurrentConversation();
    }
    if (!stopped) {
      setHealth(false);
    }
  } finally {
    assistantNode.classList.remove("streaming");
    if (currentRequestController === requestController) {
      currentRequestController = null;
      setGenerating(false);
      window.setTimeout(() => setExecutionStatus(""), 1400);
      inputEl.focus();
      const next = messageQueue.shift();
      renderQueue();
      if (next) {
        await sendMessage(next);
      }
    }
  }
}

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = buildOutgoingMessage();
  const hasMessage = typeof message === "string"
    ? Boolean(message.trim())
    : Array.isArray(message) && message.length > 0;
  if (!hasMessage) {
    return;
  }
  inputEl.value = "";
  autoResizeInput();
  clearPendingAttachments();
  if (isGenerating) {
    enqueueMessage(message);
    return;
  }
  await sendMessage(message);
});

function resetConversation() {
  currentRequestController?.abort();
  messageQueue = [];
  renderQueue();
  if (history.length) {
    persistCurrentConversation();
  }
  activeConversationId = `conv_${Date.now()}`;
  history = [];
  messagesEl.innerHTML = "";
  inputEl.value = "";
  clearPendingAttachments();
  autoResizeInput();
  inputEl.focus();
  syncEmptyState();
}

clearBtn.addEventListener("click", resetConversation);
newChatBtn.addEventListener("click", resetConversation);
sessionItemsEl?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-conversation-id]");
  if (!button) {
    return;
  }
  loadConversation(button.dataset.conversationId || "");
});

sidebarTabsEl?.addEventListener("click", (event) => {
  const button = event.target.closest(".nav-tab");
  if (!button) {
    return;
  }
  const tab = button.dataset.tab || "chat";
  setActiveTab(tab);
  if (tab === "memory") {
    loadMemory();
  }
});

logoMenuBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  setLogoMenuOpen(Boolean(logoDropdown?.hidden));
});

logoDropdown?.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-logo-action]");
  if (!actionButton) {
    return;
  }
  const action = actionButton.dataset.logoAction || "chat";
  setLogoMenuOpen(false);
  setActiveTab(action === "settings" ? "files" : "chat");
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".logo-menu")) {
    setLogoMenuOpen(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setLogoMenuOpen(false);
  }
});

walletListEl?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-wallet-name]");
  if (!button) {
    return;
  }
  startWalletConnect(button.dataset.walletName || "");
});

refreshMemoryBtn?.addEventListener("click", () => {
  loadMemory(true);
});

attachBtn?.addEventListener("click", () => {
  fileInputEl?.click();
});

fileInputEl?.addEventListener("change", async () => {
  await addFiles(fileInputEl.files);
  fileInputEl.value = "";
});

composerAttachmentsEl?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-attachment-index]");
  if (!button) {
    return;
  }
  const index = Number(button.dataset.attachmentIndex);
  if (Number.isNaN(index)) {
    return;
  }
  pendingAttachments.splice(index, 1);
  renderPendingAttachments();
});

formEl.addEventListener("dragenter", (event) => {
  event.preventDefault();
  dragDepth += 1;
  setDropzoneVisible(true);
});

formEl.addEventListener("dragover", (event) => {
  event.preventDefault();
  setDropzoneVisible(true);
});

formEl.addEventListener("dragleave", (event) => {
  event.preventDefault();
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0 && !formEl.contains(event.relatedTarget)) {
    setDropzoneVisible(false);
  }
});

formEl.addEventListener("drop", async (event) => {
  event.preventDefault();
  dragDepth = 0;
  setDropzoneVisible(false);
  await addFiles(event.dataTransfer?.files);
});

inputEl.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    formEl.requestSubmit();
  }
});

inputEl.addEventListener("paste", async (event) => {
  const imageFiles = Array.from(event.clipboardData?.items || [])
    .filter((item) => item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter(Boolean);
  if (!imageFiles.length) {
    return;
  }
  event.preventDefault();
  await addFiles(imageFiles);
});

stopBtn?.addEventListener("click", () => {
  currentRequestController?.abort();
});

clearQueueBtn?.addEventListener("click", () => {
  messageQueue = [];
  renderQueue();
});

focusBtn?.addEventListener("click", () => {
  const active = !document.body.classList.contains("focus-mode");
  document.body.classList.toggle("focus-mode", active);
  focusBtn.setAttribute("aria-pressed", active ? "true" : "false");
  focusBtn.textContent = active ? "Exit focus" : "Focus";
});

thinkingBtn?.addEventListener("click", () => {
  showThinking = !showThinking;
  thinkingBtn.setAttribute("aria-pressed", showThinking ? "true" : "false");
  thinkingBtn.textContent = showThinking ? "Hide thinking" : "Thinking";
  document.querySelectorAll(".message-reasoning").forEach((node) => {
    node.hidden = !showThinking;
  });
});

controlSideNav?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-section]");
  if (button) {
    loadControlSection(button.dataset.section || "overview");
  }
});

controlRefreshBtn?.addEventListener("click", () => loadControlSection(activeControlSection, true));

controlContent?.addEventListener("click", (event) => {
  const action = event.target.closest("[data-control-action]")?.dataset.controlAction;
  if (action === "settings") {
    setActiveTab("files");
  } else if (action === "logs") {
    window.open("/logs.html?v=20260601d", "_blank", "noopener");
  }
});

messagesScrollEl?.addEventListener("scroll", () => {
  const distance = messagesScrollEl.scrollHeight - messagesScrollEl.scrollTop - messagesScrollEl.clientHeight;
  userNearBottom = distance < 80;
  if (userNearBottom && newMessagesBtn) {
    newMessagesBtn.hidden = true;
  }
});

newMessagesBtn?.addEventListener("click", () => scrollMessagesToBottom(true));
outputCloseBtn?.addEventListener("click", closeToolOutput);

outputDivider?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  const startX = event.clientX;
  const startWidth = outputSidebar.getBoundingClientRect().width;
  const onMove = (moveEvent) => {
    outputSidebarWidth = Math.min(720, Math.max(280, startWidth + startX - moveEvent.clientX));
    outputSidebar.style.width = `${outputSidebarWidth}px`;
  };
  const onUp = () => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
  };
  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
});

function autoResizeInput() {
  inputEl.style.height = "auto";
  inputEl.style.height = `${Math.min(inputEl.scrollHeight, 200)}px`;
}

inputEl.addEventListener("input", autoResizeInput);

themeSelect?.addEventListener("change", updateDesignFromControls);
densitySelect?.addEventListener("change", updateDesignFromControls);
accentSelect?.addEventListener("change", updateDesignFromControls);
sidebarWidthInput?.addEventListener("input", updateDesignFromControls);
resetDesignBtn?.addEventListener("click", () => {
  applyDesignSettings(DEFAULT_DESIGN);
  writeDesignSettings(DEFAULT_DESIGN);
  if (settingsNote) {
    settingsNote.textContent = "Design reset";
  }
});

applyDesignSettings(readDesignSettings());
if (controlSideNav) {
  controlSideNav.innerHTML = CONTROL_SECTIONS.map(([id, label]) => `<button type="button" data-section="${id}" class="${id === activeControlSection ? "active" : ""}">${escapeHtml(label)}</button>`).join("");
}
syncEmptyState();
autoResizeInput();
renderWalletCards();
setActiveTab("chat");
loadSavedConversations();
if (!activeConversationId) {
  activeConversationId = `conv_${Date.now()}`;
}
loadSettings();
checkHealth();
setInterval(checkHealth, 5000);

window.addEventListener("load", () => {
  const minimumDisplayTime = 900;
  const remainingTime = Math.max(0, minimumDisplayTime - (performance.now() - loadingStartedAt));
  window.setTimeout(() => {
    loadingScreenEl?.classList.add("is-hidden");
  }, remainingTime);
}, { once: true });
