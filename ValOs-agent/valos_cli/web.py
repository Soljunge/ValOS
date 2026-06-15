"""Local browser chat for ValOs.

Serves a lightweight first-party web UI and proxies browser requests to the
existing ValOs OpenAI-compatible API server.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from datetime import datetime
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from secrets import token_urlsafe

from tools.memory_tool import MemoryStore, get_memory_dir
from valos_constants import OPENROUTER_BASE_URL
from valos_cli.auth import PROVIDER_REGISTRY
from valos_cli.config import get_env_value, get_valos_home, load_config, save_config, save_env_value

PROJECT_ROOT = Path(__file__).parent.parent.resolve()
WEB_DIST_ROOT = PROJECT_ROOT / "valos_cli" / "web_dist"
WEB_LEGACY_ROOT = PROJECT_ROOT / "webconsole"
WEB_ROOT = WEB_DIST_ROOT if (WEB_DIST_ROOT / "index.html").exists() else WEB_LEGACY_ROOT
PROVIDER_ORDER = (
    "auto",
    "openrouter",
    "openai",
    "anthropic",
    "valos",
    "openai-codex",
    "copilot",
    "zai",
    "kimi-coding",
    "deepseek",
    "alibaba",
    "huggingface",
    "minimax",
    "minimax-cn",
    "opencode-zen",
    "opencode-go",
    "kilocode",
    "ai-gateway",
    "custom",
)
PROVIDER_OVERRIDES = {
    "auto": {
        "label": "Auto",
        "base_url": "",
        "api_key_env": "",
        "base_url_env": "",
        "auth_type": "auto",
    },
    "openrouter": {
        "label": "OpenRouter",
        "base_url": OPENROUTER_BASE_URL,
        "api_key_env": "OPENROUTER_API_KEY",
        "base_url_env": "OPENROUTER_BASE_URL",
        "auth_type": "api_key",
    },
    "custom": {
        "label": "Custom endpoint",
        "base_url": "",
        "api_key_env": "OPENAI_API_KEY",
        "base_url_env": "",
        "auth_type": "api_key",
    },
}


def _provider_options() -> list[dict]:
    options = []
    for provider_id in PROVIDER_ORDER:
        override = PROVIDER_OVERRIDES.get(provider_id)
        registry = PROVIDER_REGISTRY.get(provider_id)
        if override:
            label = override["label"]
            base_url = override["base_url"]
            api_key_env = override["api_key_env"]
            base_url_env = override["base_url_env"]
            auth_type = override["auth_type"]
        elif registry:
            label = registry.name
            base_url = registry.inference_base_url
            api_key_env = registry.api_key_env_vars[0] if registry.api_key_env_vars else ""
            base_url_env = registry.base_url_env_var or ""
            auth_type = registry.auth_type
        else:
            continue
        options.append({
            "id": provider_id,
            "label": label,
            "base_url": base_url,
            "api_key_env": api_key_env,
            "base_url_env": base_url_env,
            "auth_type": auth_type,
            "custom_base_url": provider_id == "custom" or bool(base_url_env),
        })
    return options


def _provider_option(provider_id: str) -> dict:
    provider_id = (provider_id or "auto").strip().lower()
    for option in _provider_options():
        if option["id"] == provider_id:
            return option
    return _provider_options()[0]


def _api_key_sources() -> tuple[tuple[str, str], ...]:
    seen = set()
    sources = []
    for option in _provider_options():
        env_key = option.get("api_key_env") or ""
        if not env_key or env_key in seen:
            continue
        seen.add(env_key)
        sources.append((env_key, option["label"]))
    for env_key, label in (
        ("ANTHROPIC_TOKEN", "Anthropic"),
        ("CLAUDE_CODE_OAUTH_TOKEN", "Anthropic"),
        ("GH_TOKEN", "GitHub"),
        ("GITHUB_TOKEN", "GitHub"),
    ):
        if env_key not in seen:
            seen.add(env_key)
            sources.append((env_key, label))
    return tuple(sources)


def _api_base_url(host: str, port: int) -> str:
    return f"http://{host}:{port}"


def _healthcheck(host: str, port: int, timeout: float = 2.0) -> bool:
    try:
        req = urllib.request.Request(f"{_api_base_url(host, port)}/health", method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return 200 <= resp.status < 300
    except Exception:
        return False


def _ensure_api_env(api_host: str, api_port: int) -> str:
    save_env_value("API_SERVER_ENABLED", "true")
    if not (get_env_value("API_SERVER_HOST") or "").strip():
        save_env_value("API_SERVER_HOST", api_host)
    if not (get_env_value("API_SERVER_PORT") or "").strip():
        save_env_value("API_SERVER_PORT", str(api_port))

    api_key = (get_env_value("API_SERVER_KEY") or "").strip()
    if not api_key:
        api_key = token_urlsafe(24)
        save_env_value("API_SERVER_KEY", api_key)
    return api_key


def _gateway_log_path() -> Path:
    logs_dir = get_valos_home() / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    return logs_dir / "web-gateway.log"


def _resolve_web_model() -> str:
    """Return the configured ValOs model using the same config source as CLI/gateway."""
    model_cfg = _resolve_web_model_config()
    if isinstance(model_cfg, str):
        return model_cfg.strip()
    if isinstance(model_cfg, dict):
        return str(model_cfg.get("default") or model_cfg.get("model") or "").strip()
    return ""


def _resolve_web_model_config():
    try:
        cfg = load_config()
    except Exception:
        return {}

    model_cfg = cfg.get("model", {})
    return model_cfg if isinstance(model_cfg, (dict, str)) else {}


def _resolve_web_provider() -> str:
    model_cfg = _resolve_web_model_config()
    if isinstance(model_cfg, dict):
        provider = str(model_cfg.get("provider") or "").strip().lower()
        if provider:
            return provider
    env_provider = os.getenv("VALOS_INFERENCE_PROVIDER", "").strip().lower()
    return env_provider or "auto"


def _resolve_web_base_url() -> str:
    model_cfg = _resolve_web_model_config()
    if isinstance(model_cfg, dict):
        return str(model_cfg.get("base_url") or "").strip()
    return ""


def _resolve_web_api_key(preferred_env: str = "", strict: bool = False) -> str:
    """Return the active API key, redacted by the UI but useful for settings state."""
    if preferred_env and strict:
        return (get_env_value(preferred_env) or "").strip()
    sources = list(_api_key_sources())
    if preferred_env:
        sources.sort(key=lambda item: 0 if item[0] == preferred_env else 1)
    for key, _label in sources:
        value = (get_env_value(key) or "").strip()
        if value:
            return value
    return ""


def _resolve_web_api_key_source(preferred_env: str = "", strict: bool = False) -> tuple[str, str]:
    """Return the active API key env var and human label, if configured."""
    if preferred_env and strict:
        label = next((item[1] for item in _api_key_sources() if item[0] == preferred_env), "")
        return (preferred_env, label) if (get_env_value(preferred_env) or "").strip() else ("", "")
    sources = list(_api_key_sources())
    if preferred_env:
        sources.sort(key=lambda item: 0 if item[0] == preferred_env else 1)
    for env_key, label in sources:
        value = (get_env_value(env_key) or "").strip()
        if value:
            return env_key, label
    return "", ""


def _mask_api_key(api_key: str) -> str:
    api_key = (api_key or "").strip()
    if not api_key:
        return ""
    if len(api_key) < 12:
        return "***"
    return api_key[:4] + "..." + api_key[-4:]


def _settings_snapshot() -> dict:
    provider = _resolve_web_provider()
    provider_option = _provider_option(provider)
    preferred_api_key_env = provider_option.get("api_key_env") or ""
    strict_api_key = provider not in ("", "auto") and bool(preferred_api_key_env)
    api_key = _resolve_web_api_key(preferred_api_key_env, strict_api_key)
    api_key_provider, api_key_provider_label = _resolve_web_api_key_source(preferred_api_key_env, strict_api_key)
    if strict_api_key and not api_key_provider:
        api_key_provider = preferred_api_key_env
        api_key_provider_label = provider_option.get("label") or provider
    telegram_bot = (get_env_value("TELEGRAM_BOT_TOKEN") or "").strip()
    telegram_home_channel = (get_env_value("TELEGRAM_HOME_CHANNEL") or "").strip()
    base_url = _resolve_web_base_url() or provider_option.get("base_url", "")
    return {
        "model": _resolve_web_model(),
        "provider": provider,
        "provider_label": provider_option.get("label") or provider,
        "provider_base_url": base_url,
        "provider_options": _provider_options(),
        "api_key_set": bool(api_key),
        "api_key_masked": _mask_api_key(api_key),
        "api_key_provider": api_key_provider,
        "api_key_provider_label": api_key_provider_label,
        "telegram_bot_set": bool(telegram_bot),
        "telegram_bot_masked": _mask_api_key(telegram_bot),
        "telegram_home_channel": telegram_home_channel,
    }


def _memory_usage(entries: list[str], limit: int) -> str:
    if not entries:
        return f"0/{limit} chars"
    current = len("\n§\n".join(entries))
    return f"{current}/{limit} chars"


def _memory_snapshot() -> dict:
    memory_dir = get_memory_dir()
    memory_path = memory_dir / "MEMORY.md"
    user_path = memory_dir / "USER.md"
    memory_entries = MemoryStore._read_file(memory_path)
    user_entries = MemoryStore._read_file(user_path)

    return {
        "provider": "builtin",
        "provider_label": "Built-in memory (MEMORY.md / USER.md)",
        "memory_path": str(memory_dir),
        "memory": {
            "entries": memory_entries,
            "entry_count": len(memory_entries),
            "usage": _memory_usage(memory_entries, 2200),
            "file": str(memory_path),
        },
        "user": {
            "entries": user_entries,
            "entry_count": len(user_entries),
            "usage": _memory_usage(user_entries, 1375),
            "file": str(user_path),
        },
    }


def _logs_dir() -> Path:
    logs_dir = get_valos_home() / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    return logs_dir


def _logs_snapshot() -> dict:
    logs_dir = _logs_dir()
    files = []
    for path in sorted(logs_dir.glob("*.log"), key=lambda item: item.stat().st_mtime, reverse=True):
        try:
            stat = path.stat()
        except OSError:
            continue
        files.append({
            "name": path.name,
            "size": stat.st_size,
            "mtime": int(stat.st_mtime),
        })
    return {
        "logs_dir": str(logs_dir),
        "default_file": files[0]["name"] if files else "",
        "files": files,
    }


def _read_log_file(filename: str, max_chars: int = 200000) -> dict:
    safe_name = Path(filename).name
    if not safe_name.endswith(".log"):
        raise ValueError("Only .log files are supported")
    path = _logs_dir() / safe_name
    if not path.exists():
        raise FileNotFoundError(f"Log file not found: {safe_name}")
    content = path.read_text(encoding="utf-8", errors="replace")
    if len(content) > max_chars:
        content = content[-max_chars:]
        content = "[Showing last part of log]\n\n" + content
    line_count = content.count("\n") + (1 if content else 0)
    return {
        "name": safe_name,
        "content": content,
        "line_count": line_count,
        "path": str(path),
    }


def _safe_control_config(value):
    secret_markers = ("key", "token", "password", "secret", "credential")
    if isinstance(value, dict):
        return {
            str(key): ("configured" if any(marker in str(key).lower() for marker in secret_markers) and item else _safe_control_config(item))
            for key, item in value.items()
        }
    if isinstance(value, list):
        return [_safe_control_config(item) for item in value]
    return value


def _control_snapshot(section: str) -> dict:
    section = (section or "overview").strip().lower()
    from gateway.status import get_running_pid
    from valos_state import SessionDB

    db = SessionDB()
    try:
        sessions = db.list_sessions_rich(limit=100)
    finally:
        db.close()

    totals = {
        "sessions": len(sessions),
        "messages": sum(int(item.get("message_count") or 0) for item in sessions),
        "tool_calls": sum(int(item.get("tool_call_count") or 0) for item in sessions),
        "input_tokens": sum(int(item.get("input_tokens") or 0) for item in sessions),
        "output_tokens": sum(int(item.get("output_tokens") or 0) for item in sessions),
        "reasoning_tokens": sum(int(item.get("reasoning_tokens") or 0) for item in sessions),
        "estimated_cost_usd": sum(float(item.get("estimated_cost_usd") or 0) for item in sessions),
        "actual_cost_usd": sum(float(item.get("actual_cost_usd") or 0) for item in sessions),
    }
    gateway_pid = get_running_pid()

    if section == "overview":
        from cron.jobs import list_jobs
        try:
            skills = json.loads(__import__("tools.skills_tool", fromlist=["skills_list"]).skills_list()).get("skills", [])
        except Exception:
            skills = []
        jobs = list_jobs(include_disabled=True)
        return {"section": section, "gateway": {"running": bool(gateway_pid), "pid": gateway_pid}, "totals": totals, "cron_jobs": len(jobs), "skills": len(skills), "model": _resolve_web_model(), "provider": _resolve_web_provider()}

    if section == "agents":
        from valos_cli.profiles import list_profiles, get_active_profile_name
        profiles = list_profiles()
        active_profile = get_active_profile_name()
        items = []
        for item in profiles:
            identity = ""
            soul_path = item.path / "SOUL.md"
            if soul_path.exists():
                try:
                    identity = next((line.strip("# ").strip() for line in soul_path.read_text(encoding="utf-8", errors="replace").splitlines() if line.strip()), "")
                except OSError:
                    pass
            items.append({"name": item.name, "path": str(item.path), "identity": identity, "skills": item.skill_count, "model": item.model or "", "provider": item.provider or "", "gateway_running": item.gateway_running, "active": item.name == active_profile})
        return {"section": section, "active": active_profile, "items": items}

    if section == "channels":
        channel_envs = {
            "Telegram": "TELEGRAM_BOT_TOKEN", "Discord": "DISCORD_BOT_TOKEN", "WhatsApp": "WHATSAPP_ENABLED",
            "Signal": "SIGNAL_HTTP_URL", "Slack": "SLACK_BOT_TOKEN", "Matrix": "MATRIX_ACCESS_TOKEN",
            "Email": "EMAIL_ADDRESS", "SMS": "TWILIO_ACCOUNT_SID", "Feishu": "FEISHU_APP_ID", "WeCom": "WECOM_BOT_ID",
        }
        return {"section": section, "items": [{"name": name, "configured": bool(get_env_value(env_name))} for name, env_name in channel_envs.items()]}

    if section == "instances":
        return {"section": section, "items": [{"name": "Gateway", "status": "running" if gateway_pid else "stopped", "pid": gateway_pid}, {"name": "Web UI", "status": "running", "pid": os.getpid()}]}

    if section == "sessions":
        return {"section": section, "items": sessions}

    if section == "usage":
        by_source = {}
        for item in sessions:
            source = item.get("source") or "unknown"
            bucket = by_source.setdefault(source, {"source": source, "sessions": 0, "tokens": 0, "cost": 0.0})
            bucket["sessions"] += 1
            bucket["tokens"] += int(item.get("input_tokens") or 0) + int(item.get("output_tokens") or 0)
            bucket["cost"] += float(item.get("actual_cost_usd") or item.get("estimated_cost_usd") or 0)
        return {"section": section, "totals": totals, "by_source": list(by_source.values())}

    if section == "cron":
        from cron.jobs import list_jobs
        return {"section": section, "items": list_jobs(include_disabled=True)}

    if section == "skills":
        from tools.skills_tool import skills_list
        return {"section": section, **json.loads(skills_list())}

    if section == "nodes":
        from gateway.pairing import PairingStore
        store = PairingStore()
        return {"section": section, "approved": store.list_approved(), "pending": store.list_pending()}

    if section == "config":
        return {"section": section, "config": _safe_control_config(load_config()), "path": str(get_valos_home() / "config.yaml")}

    if section == "debug":
        return {"section": section, "gateway": {"running": bool(gateway_pid), "pid": gateway_pid}, "python": sys.version.split()[0], "project_root": str(PROJECT_ROOT), "valos_home": str(get_valos_home()), "time": datetime.now().astimezone().isoformat(), "health": _healthcheck("127.0.0.1", int(get_env_value("API_SERVER_PORT") or 8642))}

    if section == "logs":
        return {"section": section, **_logs_snapshot()}

    raise ValueError(f"Unknown control section: {section}")


def _normalize_message_content(content):
    if isinstance(content, list):
        normalized = []
        for part in content:
            if isinstance(part, str):
                if part.strip():
                    normalized.append(part)
            elif isinstance(part, dict):
                normalized.append(part)
        return normalized
    if content is None:
        return ""
    return str(content)


def _message_has_payload(content) -> bool:
    if isinstance(content, list):
        return len(content) > 0
    return bool(str(content or "").strip())


def _apply_settings_update(body: dict) -> dict:
    model = str(body.get("model") or "").strip()
    provider = str(body.get("provider") or "").strip().lower()
    provider_base_url = str(body.get("provider_base_url") or "").strip()
    api_key = str(body.get("api_key") or "").strip()
    api_key_provider = str(body.get("api_key_provider") or "").strip()
    telegram_bot_token = str(body.get("telegram_bot_token") or "").strip()
    telegram_home_channel = str(body.get("telegram_home_channel") or "").strip()
    clear_api_key = bool(body.get("clear_api_key"))
    clear_telegram_bot = bool(body.get("clear_telegram_bot"))
    updated = {}

    if model or provider or provider_base_url:
        _upsert_model_config(model, provider, provider_base_url)
        if model:
            updated["model"] = model
        if provider:
            updated["provider"] = provider
        if provider_base_url:
            updated["provider_base_url"] = provider_base_url

    if clear_api_key:
        provider_key = api_key_provider or _resolve_web_api_key_source()[0] or "OPENAI_API_KEY"
        save_env_value(provider_key, "")
        updated["api_key_set"] = False
        updated["api_key_provider"] = provider_key
    elif api_key:
        provider_key = api_key_provider or _provider_option(provider or _resolve_web_provider()).get("api_key_env") or _resolve_web_api_key_source()[0] or "OPENAI_API_KEY"
        save_env_value(provider_key, api_key)
        updated["api_key_set"] = True
        updated["api_key_provider"] = provider_key

    if clear_telegram_bot:
        save_env_value("TELEGRAM_BOT_TOKEN", "")
        updated["telegram_bot_set"] = False
    elif telegram_bot_token:
        save_env_value("TELEGRAM_BOT_TOKEN", telegram_bot_token)
        updated["telegram_bot_set"] = True

    if "telegram_home_channel" in body:
        save_env_value("TELEGRAM_HOME_CHANNEL", telegram_home_channel)
        updated["telegram_home_channel"] = telegram_home_channel

    return {"ok": True, **updated, **_settings_snapshot()}


def _upsert_model_config(model: str, provider: str = "", base_url: str = "") -> None:
    cfg = load_config()
    model = model.strip()
    current = cfg.get("model")
    if isinstance(current, dict):
        cfg["model"] = current
    elif isinstance(current, str):
        current = {"default": current}
        cfg["model"] = current
    else:
        current = {}
        cfg["model"] = current
    if model:
        current["default"] = model
    if provider:
        current["provider"] = provider
        if provider == "auto":
            current.pop("provider", None)
            current.pop("base_url", None)
            current.pop("api_mode", None)
        else:
            current.pop("api_mode", None)
    if provider and provider != "auto":
        option = _provider_option(provider)
        resolved_base_url = base_url or option.get("base_url") or ""
        if resolved_base_url:
            current["base_url"] = resolved_base_url.rstrip("/")
        elif provider == "custom":
            raise ValueError("Custom provider requires a base URL")
        else:
            current.pop("base_url", None)
    elif base_url:
        current["base_url"] = base_url.rstrip("/")
    save_config(cfg)


def _start_gateway_if_needed(api_host: str, api_port: int):
    if _healthcheck(api_host, api_port):
        return None

    log_path = _gateway_log_path()
    log_handle = log_path.open("a", encoding="utf-8")
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    proc = subprocess.Popen(
        [sys.executable, "-m", "valos_cli.main", "gateway", "run", "--replace"],
        cwd=str(PROJECT_ROOT),
        env=env,
        stdout=log_handle,
        stderr=subprocess.STDOUT,
        stdin=subprocess.DEVNULL,
        start_new_session=True,
    )
    log_handle.close()

    deadline = time.time() + 20
    while time.time() < deadline:
        if _healthcheck(api_host, api_port):
            return proc
        if proc.poll() is not None:
            break
        time.sleep(0.5)

    try:
        log_handle.close()
    except Exception:
        pass

    raise RuntimeError(
        f"ValOs gateway did not become ready. Check {_gateway_log_path()}"
    )


def _send_json(handler: SimpleHTTPRequestHandler, status: int, payload: dict) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


class ValosWebHandler(SimpleHTTPRequestHandler):
    def __init__(
        self,
        *args,
        directory: str,
        api_base_url: str,
        api_key: str,
        api_host: str,
        api_port: int,
        **kwargs,
    ):
        self._api_base_url = api_base_url.rstrip("/")
        self._api_key = api_key
        self._api_host = api_host
        self._api_port = api_port
        super().__init__(*args, directory=directory, **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        return

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        route_path = parsed.path or "/"

        if route_path == "/api/health":
            ok = _healthcheck(self._api_host, self._api_port)
            _send_json(self, 200, {"ok": ok, "model": _resolve_web_model()})
            return
        if route_path in {"/api/logs", "/api/logs/"}:
            _send_json(self, 200, _logs_snapshot())
            return
        if route_path.startswith("/api/logs/"):
            try:
                filename = urllib.parse.unquote(route_path[len("/api/logs/"):])
                _send_json(self, 200, _read_log_file(filename))
            except FileNotFoundError as exc:
                _send_json(self, 404, {"error": str(exc)})
            except ValueError as exc:
                _send_json(self, 400, {"error": str(exc)})
            except Exception as exc:
                _send_json(self, 500, {"error": f"Failed to read log file: {exc}"})
            return
        if route_path == "/api/memory":
            _send_json(self, 200, _memory_snapshot())
            return
        if route_path == "/api/settings":
            _send_json(self, 200, _settings_snapshot())
            return
        if route_path == "/api/control":
            try:
                query = urllib.parse.parse_qs(parsed.query)
                section = (query.get("section") or ["overview"])[0]
                _send_json(self, 200, _control_snapshot(section))
            except ValueError as exc:
                _send_json(self, 400, {"error": str(exc)})
            except Exception as exc:
                _send_json(self, 500, {"error": f"Failed to load control data: {exc}"})
            return
        if route_path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self) -> None:
        if self.path == "/api/settings":
            try:
                content_length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                content_length = 0
            raw = self.rfile.read(content_length)

            try:
                body = json.loads(raw.decode("utf-8") or "{}")
            except json.JSONDecodeError:
                _send_json(self, 400, {"error": "Invalid JSON"})
                return

            try:
                _send_json(self, 200, _apply_settings_update(body))
            except Exception as exc:
                _send_json(self, 500, {"error": f"Failed to save settings: {exc}"})
            return

        if self.path != "/api/chat":
            _send_json(self, 404, {"error": "Not found"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            content_length = 0
        raw = self.rfile.read(content_length)

        try:
            body = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            _send_json(self, 400, {"error": "Invalid JSON"})
            return

        message = _normalize_message_content(body.get("message"))
        history = body.get("history") or []
        if not _message_has_payload(message):
            _send_json(self, 400, {"error": "Message is required"})
            return

        messages = []
        if isinstance(history, list):
            for item in history:
                if not isinstance(item, dict):
                    continue
                role = str(item.get("role") or "").strip()
                content = _normalize_message_content(item.get("content"))
                if role in {"system", "user", "assistant"} and _message_has_payload(content):
                    messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": message})

        resolved_model = _resolve_web_model() or "valos-agent"

        wants_stream = bool(body.get("stream", True))
        req_body = json.dumps(
            {
                "model": resolved_model,
                "messages": messages,
                "stream": wants_stream,
            }
        ).encode("utf-8")

        req = urllib.request.Request(
            f"{self._api_base_url}/v1/chat/completions",
            data=req_body,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self._api_key}",
            },
        )

        try:
            with urllib.request.urlopen(req, timeout=600) as resp:
                if wants_stream:
                    self.send_response(200)
                    self.send_header("Content-Type", "text/event-stream; charset=utf-8")
                    self.send_header("Cache-Control", "no-cache")
                    self.send_header("X-Accel-Buffering", "no")
                    session_id = resp.headers.get("X-ValOs-Session-Id", "")
                    if session_id:
                        self.send_header("X-ValOs-Session-Id", session_id)
                    self.end_headers()
                    try:
                        while True:
                            chunk = resp.readline()
                            if not chunk:
                                break
                            self.wfile.write(chunk)
                            self.wfile.flush()
                    except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
                        pass
                    return
                payload = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            try:
                payload = json.loads(exc.read().decode("utf-8"))
            except Exception:
                payload = {"error": {"message": str(exc)}}
            message_text = payload.get("error", {}).get("message") or "ValOs API request failed"
            _send_json(self, exc.code or 502, {"error": message_text, "details": payload})
            return
        except Exception as exc:
            _send_json(self, 502, {"error": f"Cannot reach ValOs API: {exc}"})
            return

        choices = payload.get("choices") or []
        reply = ""
        if choices:
            reply = (
                choices[0].get("message", {}).get("content")
                or choices[0].get("delta", {}).get("content")
                or ""
            )
        _send_json(self, 200, {"reply": reply, "raw": payload, "model": resolved_model})


def web_command(args) -> None:
    host = getattr(args, "host", "127.0.0.1")
    port = int(getattr(args, "port", 3000))
    api_host = getattr(args, "api_host", "127.0.0.1")
    api_port = int(getattr(args, "api_port", 8642))
    no_open = bool(getattr(args, "no_open", False))
    no_gateway = bool(getattr(args, "no_gateway", False))

    api_key = _ensure_api_env(api_host, api_port)

    gateway_proc = None
    if not no_gateway:
        try:
            gateway_proc = _start_gateway_if_needed(api_host, api_port)
        except RuntimeError as exc:
            print()
            print(f"Warning: {exc}")
            print("The web UI will still open, but the backend is offline until the gateway starts.")
            print()

    handler = partial(
        ValosWebHandler,
        directory=str(WEB_ROOT),
        api_base_url=_api_base_url(api_host, api_port),
        api_key=api_key,
        api_host=api_host,
        api_port=api_port,
    )
    server = ThreadingHTTPServer((host, port), handler)
    url = f"http://{host}:{port}"

    print()
    print("ValOs web interface")
    print(f"  Web UI:   {url}")
    print(f"  API:      {_api_base_url(api_host, api_port)}")
    if gateway_proc is not None:
        print(f"  Gateway:  started automatically")
    else:
        print(f"  Gateway:  using existing backend")
    print("  Stop:     Ctrl+C")
    print()

    if not no_open:
        try:
            webbrowser.open(url)
        except Exception:
            pass

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print()
        print("Stopping ValOs web interface.")
    finally:
        server.server_close()
        if gateway_proc is not None and gateway_proc.poll() is None:
            try:
                gateway_proc.terminate()
                gateway_proc.wait(timeout=5)
            except Exception:
                try:
                    gateway_proc.kill()
                except Exception:
                    pass
