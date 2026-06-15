const logsSelectEl = document.getElementById("logs-select");
const logsOutputEl = document.getElementById("logs-output");
const logsMetaEl = document.getElementById("logs-meta");
const logsDetailEl = document.getElementById("logs-detail");
const refreshLogsBtn = document.getElementById("refresh-logs-btn");
const copyLogsBtn = document.getElementById("copy-logs-btn");
const logsSearchEl = document.getElementById("logs-search");
const logsWrapToggleEl = document.getElementById("logs-wrap-toggle");
const logsFollowToggleEl = document.getElementById("logs-follow-toggle");
const logsFileListEl = document.getElementById("logs-file-list");
const logsCountEl = document.getElementById("logs-count");

let logFiles = [];
let selectedLog = "";
let selectedLogContent = "";
let refreshTimer = null;

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  const precision = size >= 100 || unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
}

function formatTime(unixSeconds) {
  if (!unixSeconds) {
    return "";
  }
  try {
    return new Date(unixSeconds * 1000).toLocaleString();
  } catch {
    return "";
  }
}

function getSelectedFile() {
  return logFiles.find((item) => item.name === selectedLog) || null;
}

function applyWrapMode() {
  if (!logsOutputEl || !logsWrapToggleEl) {
    return;
  }
  logsOutputEl.classList.toggle("nowrap", !logsWrapToggleEl.checked);
}

function updateRefreshLoop() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  if (!logsFollowToggleEl?.checked) {
    return;
  }
  refreshTimer = window.setInterval(() => {
    if (selectedLog) {
      loadLogContent(selectedLog, { preserveScroll: true, silentLoading: true });
    } else {
      loadLogIndex("", { preserveSelection: true, silentLoading: true });
    }
  }, 5000);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderLogOptions() {
  if (!logsSelectEl) {
    return;
  }
  logsSelectEl.innerHTML = logFiles
    .map((item) => `<option value="${item.name}">${item.name}</option>`)
    .join("");
  if (selectedLog) {
    logsSelectEl.value = selectedLog;
  }
}

function renderFileList() {
  if (!logsFileListEl) {
    return;
  }
  if (logsCountEl) {
    logsCountEl.textContent = String(logFiles.length);
  }
  if (!logFiles.length) {
    logsFileListEl.innerHTML = `<div class="logs-empty">No log files found.</div>`;
    return;
  }
  logsFileListEl.innerHTML = logFiles
    .map((item) => {
      const activeClass = item.name === selectedLog ? " active" : "";
      const mtime = formatTime(item.mtime);
      return `
        <button class="logs-file-item${activeClass}" type="button" data-log-name="${item.name}">
          <span class="logs-file-name">${item.name}</span>
          <span class="logs-file-meta">${formatBytes(item.size)}${mtime ? ` • ${mtime}` : ""}</span>
        </button>
      `;
    })
    .join("");
}

function renderLogContent() {
  if (!logsOutputEl) {
    return;
  }
  const filter = logsSearchEl?.value.trim().toLowerCase() || "";
  const lines = selectedLogContent ? selectedLogContent.split("\n") : [];
  const visibleLines = filter
    ? lines.filter((line) => line.toLowerCase().includes(filter))
    : lines;
  const content = visibleLines.join("\n");
  logsOutputEl.textContent = content || (selectedLogContent ? "No lines match the current filter." : "Log file is empty.");
  const file = getSelectedFile();
  const detailParts = [];
  if (file) {
    detailParts.push(formatBytes(file.size));
    const mtime = formatTime(file.mtime);
    if (mtime) {
      detailParts.push(`updated ${mtime}`);
    }
  }
  detailParts.push(`${visibleLines.length} visible line${visibleLines.length === 1 ? "" : "s"}`);
  if (filter) {
    detailParts.push(`filtered by "${filter}"`);
  }
  if (logsDetailEl) {
    logsDetailEl.textContent = detailParts.join(" • ");
  }
  if (logsMetaEl) {
    logsMetaEl.textContent = selectedLog
      ? `Viewing ${selectedLog}`
      : "Select a log file to inspect";
  }
  if (logsFollowToggleEl?.checked) {
    logsOutputEl.scrollTop = logsOutputEl.scrollHeight;
  }
}

async function loadLogIndex(preferredName = "", options = {}) {
  const { preserveSelection = false, silentLoading = false } = options;
  try {
    const res = await fetch("/api/logs");
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to load logs");
    }
    logFiles = Array.isArray(data.files) ? data.files : [];
    const nextSelection =
      preferredName ||
      (preserveSelection ? selectedLog : "") ||
      data.default_file ||
      logFiles[0]?.name ||
      "";
    selectedLog = nextSelection;
    renderLogOptions();
    renderFileList();
    if (selectedLog) {
      await loadLogContent(selectedLog, { preserveScroll: true, silentLoading });
    } else {
      selectedLogContent = "";
      renderLogContent();
    }
  } catch (error) {
    if (logsMetaEl) {
      logsMetaEl.textContent = `Failed to load logs: ${error.message}`;
    }
    if (logsDetailEl) {
      logsDetailEl.textContent = "Unable to load log index.";
    }
    if (logsOutputEl) {
      logsOutputEl.textContent = "Unable to load log index.";
    }
  }
}

async function loadLogContent(filename, options = {}) {
  if (!filename) {
    return;
  }
  const { preserveScroll = false, silentLoading = false } = options;
  selectedLog = filename;
  renderLogOptions();
  renderFileList();
  const previousScrollTop = logsOutputEl?.scrollTop || 0;
  const previousScrollHeight = logsOutputEl?.scrollHeight || 0;
  if (logsOutputEl && !silentLoading) {
    logsOutputEl.textContent = "Loading log file...";
  }
  try {
    const res = await fetch(`/api/logs/${encodeURIComponent(filename)}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to load log file");
    }
    selectedLogContent = data.content || "";
    renderLogContent();
    if (preserveScroll && logsOutputEl && !logsFollowToggleEl?.checked) {
      const nextScrollHeight = logsOutputEl.scrollHeight;
      logsOutputEl.scrollTop = Math.max(0, previousScrollTop + (nextScrollHeight - previousScrollHeight));
    }
  } catch (error) {
    if (logsMetaEl) {
      logsMetaEl.textContent = `Failed to load ${filename}: ${error.message}`;
    }
    if (logsDetailEl) {
      logsDetailEl.textContent = "Unable to load log file.";
    }
    if (logsOutputEl) {
      logsOutputEl.textContent = "Unable to load log file.";
    }
  }
}

logsSelectEl?.addEventListener("change", (event) => {
  loadLogContent(event.target.value);
});

logsFileListEl?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-log-name]");
  if (!button) {
    return;
  }
  loadLogContent(button.getAttribute("data-log-name") || "");
});

refreshLogsBtn?.addEventListener("click", () => {
  loadLogIndex(selectedLog, { preserveSelection: true });
});

copyLogsBtn?.addEventListener("click", async () => {
  if (!logsOutputEl) {
    return;
  }
  try {
    await navigator.clipboard.writeText(logsOutputEl.textContent || "");
    if (logsDetailEl) {
      logsDetailEl.textContent = "Visible log output copied to clipboard.";
    }
  } catch {
    if (logsDetailEl) {
      logsDetailEl.textContent = "Copy failed. Clipboard permission may be blocked.";
    }
  }
});

logsSearchEl?.addEventListener("input", () => {
  renderLogContent();
});

logsWrapToggleEl?.addEventListener("change", () => {
  applyWrapMode();
});

logsFollowToggleEl?.addEventListener("change", () => {
  updateRefreshLoop();
  if (logsFollowToggleEl.checked && logsOutputEl) {
    logsOutputEl.scrollTop = logsOutputEl.scrollHeight;
  }
});

applyWrapMode();
updateRefreshLoop();
loadLogIndex();
