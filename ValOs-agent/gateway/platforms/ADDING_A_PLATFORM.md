# Adding a New Messaging Platform

Checklist for integrating a new messaging platform into the ValOs gateway.
Use this as a reference when building a new adapter — every item here is a
real integration point that exists in the codebase. Missing any of them will
cause broken functionality, missing features, or inconsistent behavior.

---

## 1. Core Adapter (`gateway/platforms/<platform>.py`)

The adapter is a subclass of `BasePlatformAdapter` from `gateway/platforms/base.py`.

### Required methods

| Method | Purpose |
|--------|---------|
| `__init__(self, config)` | Parse config, init state. Call `super().__init__(config, Platform.YOUR_PLATFORM)` |
| `connect() -> bool` | Connect to the platform, start listeners. Return True on success |
| `disconnect()` | Stop listeners, close connections, cancel tasks |
| `send(chat_id, text, ...) -> SendResult` | Send a text message |
| `send_typing(chat_id)` | Send typing indicator |
| `send_image(chat_id, image_url, caption) -> SendResult` | Send an image |
| `get_chat_info(chat_id) -> dict` | Return `{name, type, chat_id}` for a chat |

### Optional methods (have default stubs in base)

| Method | Purpose |
|--------|---------|
| `send_document(chat_id, path, caption)` | Send a file attachment |
| `send_voice(chat_id, path)` | Send a voice message |
| `send_video(chat_id, path, caption)` | Send a video |
| `send_animation(chat_id, path, caption)` | Send a GIF/animation |
| `send_image_file(chat_id, path, caption)` | Send image from local file |

### Required function

```python
def check_<platform>_requirements() -> bool:
    """Check if this platform's dependencies are available."""
```

### Key patterns to follow

- Use `self.build_source(...)` to construct `SessionSource` objects
- Call `self.handle_message(event)` to dispatch inbound messages to the gateway
- Use `MessageEvent`, `MessageType`, `SendResult` from base
- Use `cache_image_from_bytes`, `cache_audio_from_bytes`, `cache_document_from_bytes` for attachments
- Filter self-messages (prevent reply loops)
- Filter sync/echo messages if the platform has them
- Redact sensitive identifiers (phone numbers, tokens) in all log output
- Implement reconnection with exponential backoff + jitter for streaming connections
- Set `MAX_MESSAGE_LENGTH` if the platform has message size limits

---

## 2. Platform Enum (`gateway/config.py`)

Add the platform to the `Platform` enum:

```python
class Platform(Enum):
    ...
    YOUR_PLATFORM = "your_platform"
```

Add env var loading in `_apply_env_overrides()`:

```python
# Your Platform
your_token = os.getenv("YOUR_PLATFORM_TOKEN")
if your_token:
    if Platform.YOUR_PLATFORM not in config.platforms:
        config.platforms[Platform.YOUR_PLATFORM] = PlatformConfig()
    config.platforms[Platform.YOUR_PLATFORM].enabled = True
    config.platforms[Platform.YOUR_PLATFORM].token = your_token
```

Update `get_connected_platforms()` if your platform doesn't use token/api_key
(e.g., WhatsApp uses `enabled` flag, Signal uses `extra` dict).

---

## 3. Channel Registry (`gateway/channel_registry.py`)

Add one `ChannelRegistration` entry for the platform. This is the shared
source of truth for:

- Adapter import path and class name
- Dependency check function and warning
- `*_ALLOWED_USERS` / `*_ALLOW_ALL_USERS` env vars
- Home channel env vars
- Whether channel-directory discovery falls back to session history
- Whether the platform is `supported` or `planned`

OpenClaw-imported channels without ValOs adapters should be registered as
`planned` so the catalog is visible without pretending they can connect.
External/bundled plugins can call `register_channel(ChannelRegistration(...))`
during startup instead of editing the static registry directly.

---

## 4. Adapter Factory (`gateway/run.py`)

`GatewayRunner._create_adapter()` reads `gateway/channel_registry.py`. Avoid
adding a new hard-coded `elif` unless the platform genuinely needs special
construction beyond `Adapter(config)`.

Legacy reference:

Older code added to `_create_adapter()` like this:

```python
elif platform == Platform.YOUR_PLATFORM:
    from gateway.platforms.your_platform import YourAdapter, check_your_requirements
    if not check_your_requirements():
        logger.warning("Your Platform: dependencies not met")
        return None
    return YourAdapter(config)
```

---

## 5. Shared Channel Policy (`gateway/channel_policy.py`)

Use shared keys in `PlatformConfig.extra` when possible:

- `dm_policy`: `pairing | allowlist | open | disabled`
- `group_policy`: `allowlist | open | disabled`
- `allow_from`: DM allowlist
- `group_allow_from`: group sender allowlist
- `require_mention`: group mention gating hint

---

## 6. Session Source (`gateway/session.py`)

If your platform needs extra identity fields (e.g., Signal's UUID alongside
phone number), add them to the `SessionSource` dataclass with `Optional` defaults,
and update `to_dict()`, `from_dict()`, and `build_source()` in base.py.

---

## 7. System Prompt Hints (`agent/prompt_builder.py`)

Add a `PLATFORM_HINTS` entry so the agent knows what platform it's on:

```python
PLATFORM_HINTS = {
    ...
    "your_platform": (
        "You are on Your Platform. "
        "Describe formatting capabilities, media support, etc."
    ),
}
```

Without this, the agent won't know it's on your platform and may use
inappropriate formatting (e.g., markdown on platforms that don't render it).

---

## 8. Toolset (`toolsets.py`)

Add a named toolset for your platform:

```python
"valos-agent-your-platform": {
    "description": "Your Platform bot toolset",
    "tools": _VALOS_CORE_TOOLS,
    "includes": []
},
```

And add it to the `valos-agent-gateway` composite:

```python
"valos-agent-gateway": {
    "includes": [..., "valos-agent-your-platform"]
}
```

---

## 9. Cron Delivery (`cron/scheduler.py`)

Add to `platform_map` in `_deliver_result()`:

```python
platform_map = {
    ...
    "your_platform": Platform.YOUR_PLATFORM,
}
```

Without this, `cronjob(action="create", deliver="your_platform", ...)` silently fails.

---

## 10. Send Message Tool (`tools/send_message_tool.py`)

Add to `platform_map` in `send_message_tool()`:

```python
platform_map = {
    ...
    "your_platform": Platform.YOUR_PLATFORM,
}
```

Add routing in `_send_to_platform()`:

```python
elif platform == Platform.YOUR_PLATFORM:
    return await _send_your_platform(pconfig, chat_id, message)
```

Implement `_send_your_platform()` — a standalone async function that sends
a single message without requiring the full adapter (for use by cron jobs
and the send_message tool outside the gateway process).

Update the tool schema `target` description to include your platform example.

---

## 11. Cronjob Tool Schema (`tools/cronjob_tools.py`)

Update the `deliver` parameter description and docstring to mention your
platform as a delivery option.

---

## 12. Channel Directory (`gateway/channel_directory.py`)

If your platform can't enumerate chats (most can't), set
`session_directory=True` in `gateway/channel_registry.py`. The channel
directory reads that registry metadata instead of a hard-coded tuple.

---

## 12. Status Display (`valos_cli/status.py`)

Add to the `platforms` dict in the Messaging Platforms section:

```python
platforms = {
    ...
    "Your Platform": ("YOUR_PLATFORM_TOKEN", "YOUR_PLATFORM_HOME_CHANNEL"),
}
```

---

## 13. Gateway Setup Wizard (`valos_cli/gateway.py`)

Add to the `_PLATFORMS` list:

```python
{
    "key": "your_platform",
    "label": "Your Platform",
    "emoji": "📱",
    "token_var": "YOUR_PLATFORM_TOKEN",
    "setup_instructions": [...],
    "vars": [...],
}
```

If your platform needs custom setup logic (connectivity testing, QR codes,
policy choices), add a `_setup_your_platform()` function and route to it
in the platform selection switch.

Update `_platform_status()` if your platform's "configured" check differs
from the standard `bool(get_env_value(token_var))`.

---

## 14. Phone/ID Redaction (`agent/redact.py`)

If your platform uses sensitive identifiers (phone numbers, etc.), add a
regex pattern and redaction function to `agent/redact.py`. This ensures
identifiers are masked in ALL log output, not just your adapter's logs.

---

## 15. Documentation

| File | What to update |
|------|---------------|
| `README.md` | Platform list in feature table + documentation table |
| `AGENTS.md` | Gateway description + env var config section |
| `website/docs/user-guide/messaging/<platform>.md` | **NEW** — Full setup guide (see existing platform docs for template) |
| `website/docs/user-guide/messaging/index.md` | Architecture diagram, toolset table, security examples, Next Steps links |
| `website/docs/reference/environment-variables.md` | All env vars for the platform |

---

## 16. Tests (`tests/gateway/test_<platform>.py`)

Recommended test coverage:

- Platform enum exists with correct value
- Config loading from env vars via `_apply_env_overrides`
- Adapter init (config parsing, allowlist handling, default values)
- Helper functions (redaction, parsing, file type detection)
- Session source round-trip (to_dict → from_dict)
- Authorization integration (platform in allowlist maps)
- Send message tool routing (platform in platform_map)

Optional but valuable:
- Async tests for message handling flow (mock the platform API)
- SSE/WebSocket reconnection logic
- Attachment processing
- Group message filtering

---

## Quick Verification

After implementing everything, verify with:

```bash
# All tests pass
python -m pytest tests/ -q

# Grep for your platform name to find any missed integration points
grep -r "telegram\|discord\|whatsapp\|slack" gateway/ tools/ agent/ cron/ valos_cli/ toolsets.py \
  --include="*.py" -l | sort -u
# Check each file in the output — if it mentions other platforms but not yours, you missed it
```
