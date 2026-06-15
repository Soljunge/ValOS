# Migrating from OpenClaw to ValOs

This guide covers how to import your OpenClaw settings, memories, skills, and API keys into ValOs.

ValOs now includes an OpenClaw-inspired channel registry. Existing ValOs adapters are supported directly, while additional OpenClaw channels are registered as planned integration targets so they can be added without changing gateway core maps.

## Three Ways to Migrate

### 1. Automatic (during first-time setup)

When you run `valos-agent setup` for the first time and ValOs detects `~/.openclaw`, it automatically offers to import your OpenClaw data before configuration begins. Just accept the prompt and everything is handled for you.

### 2. CLI Command (quick, scriptable)

```bash
valos-agent claw migrate                      # Full migration with confirmation prompt
valos-agent claw migrate --dry-run            # Preview what would happen
valos-agent claw migrate --preset user-data   # Migrate without API keys/secrets
valos-agent claw migrate --yes                # Skip confirmation prompt
```

**All options:**

| Flag | Description |
|------|-------------|
| `--source PATH` | Path to OpenClaw directory (default: `~/.openclaw`) |
| `--dry-run` | Preview only — no files are modified |
| `--preset {user-data,full}` | Migration preset (default: `full`). `user-data` excludes secrets |
| `--overwrite` | Overwrite existing files (default: skip conflicts) |
| `--migrate-secrets` | Include allowlisted secrets (auto-enabled with `full` preset) |
| `--workspace-target PATH` | Copy workspace instructions (AGENTS.md) to this absolute path |
| `--skill-conflict {skip,overwrite,rename}` | How to handle skill name conflicts (default: `skip`) |
| `--yes`, `-y` | Skip confirmation prompts |

### 3. Agent-Guided (interactive, with previews)

Ask the agent to run the migration for you:

```
> Migrate my OpenClaw setup to ValOs
```

The agent will use the `openclaw-migration` skill to:
1. Run a dry-run first to preview changes
2. Ask about conflict resolution (SOUL.md, skills, etc.)
3. Let you choose between `user-data` and `full` presets
4. Execute the migration with your choices
5. Print a detailed summary of what was migrated

## What Gets Migrated

### `user-data` preset
| Item | Source | Destination |
|------|--------|-------------|
| SOUL.md | `~/.openclaw/workspace/SOUL.md` | `~/.valos-agent/SOUL.md` |
| Memory entries | `~/.openclaw/workspace/MEMORY.md` | `~/.valos-agent/memories/MEMORY.md` |
| User profile | `~/.openclaw/workspace/USER.md` | `~/.valos-agent/memories/USER.md` |
| Skills | `~/.openclaw/workspace/skills/` | `~/.valos-agent/skills/openclaw-imports/` |
| Command allowlist | `~/.openclaw/workspace/exec_approval_patterns.yaml` | Merged into `~/.valos-agent/config.yaml` |
| Messaging settings | `~/.openclaw/config.yaml` (TELEGRAM_ALLOWED_USERS, MESSAGING_CWD) | `~/.valos-agent/.env` |
| TTS assets | `~/.openclaw/workspace/tts/` | `~/.valos-agent/tts/` |

### `full` preset (adds to `user-data`)
| Item | Source | Destination |
|------|--------|-------------|
| Telegram bot token | `~/.openclaw/config.yaml` | `~/.valos-agent/.env` |
| OpenRouter API key | `~/.openclaw/.env` or config | `~/.valos-agent/.env` |
| OpenAI API key | `~/.openclaw/.env` or config | `~/.valos-agent/.env` |
| Anthropic API key | `~/.openclaw/.env` or config | `~/.valos-agent/.env` |
| ElevenLabs API key | `~/.openclaw/.env` or config | `~/.valos-agent/.env` |

Only these 6 allowlisted secrets are ever imported. Other credentials are skipped and reported.

## Channel Compatibility

Supported ValOs messaging adapters today:

Telegram, Discord, Slack, WhatsApp, Signal, SMS, Email, Home Assistant, Mattermost, Matrix, DingTalk, Feishu/Lark, WeCom, API Server, and Webhooks.

OpenClaw channels registered as planned ValOs targets:

Google Chat, iMessage, BlueBubbles, IRC, Microsoft Teams, LINE, Nextcloud Talk, Nostr, Synology Chat, Tlon, Twitch, Zalo, Zalo Personal, WeChat, and WebChat.

Planned channels are not fake-enabled. They are visible in the registry for migration and plugin architecture work, but ValOs will not connect them until a real adapter exists.

## Conflict Handling

By default, the migration **will not overwrite** existing ValOs data:

- **SOUL.md** — skipped if one already exists in `~/.valos-agent/`
- **Memory entries** — skipped if memories already exist (to avoid duplicates)
- **Skills** — skipped if a skill with the same name already exists
- **API keys** — skipped if the key is already set in `~/.valos-agent/.env`

To overwrite conflicts, use `--overwrite`. The migration creates backups before overwriting.

For skills, you can also use `--skill-conflict rename` to import conflicting skills under a new name (e.g., `skill-name-imported`).

## Migration Report

Every migration (including dry runs) produces a report showing:
- **Migrated items** — what was successfully imported
- **Conflicts** — items skipped because they already exist
- **Skipped items** — items not found in the source
- **Errors** — items that failed to import

For execute runs, the full report is saved to `~/.valos-agent/migration/openclaw/<timestamp>/`.

## Troubleshooting

### "OpenClaw directory not found"
The migration looks for `~/.openclaw` by default. If your OpenClaw is installed elsewhere, use `--source`:
```bash
valos-agent claw migrate --source /path/to/.openclaw
```

### "Migration script not found"
The migration script ships with ValOs. If you installed via pip (not git clone), the `optional-skills/` directory may not be present. Install the skill from the Skills Hub:
```bash
valos-agent skills install openclaw-migration
```

### Memory overflow
If your OpenClaw MEMORY.md or USER.md exceeds ValOs' character limits, excess entries are exported to an overflow file in the migration report directory. You can manually review and add the most important ones.
