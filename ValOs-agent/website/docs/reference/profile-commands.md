---
sidebar_position: 7
---

# Profile Commands Reference

This page covers all commands related to [ValOs profiles](../user-guide/profiles.md). For general CLI commands, see [CLI Commands Reference](./cli-commands.md).

## `valos-agent profile`

```bash
valos-agent profile <subcommand>
```

Top-level command for managing profiles. Running `valos-agent profile` without a subcommand shows help.

| Subcommand | Description |
|------------|-------------|
| `list` | List all profiles. |
| `use` | Set the active (default) profile. |
| `create` | Create a new profile. |
| `delete` | Delete a profile. |
| `show` | Show details about a profile. |
| `alias` | Regenerate the shell alias for a profile. |
| `rename` | Rename a profile. |
| `export` | Export a profile to a tar.gz archive. |
| `import` | Import a profile from a tar.gz archive. |

## `valos-agent profile list`

```bash
valos-agent profile list
```

Lists all profiles. The currently active profile is marked with `*`.

**Example:**

```bash
$ valos-agent profile list
  default
* work
  dev
  personal
```

No options.

## `valos-agent profile use`

```bash
valos-agent profile use <name>
```

Sets `<name>` as the active profile. All subsequent `valos-agent` commands (without `-p`) will use this profile.

| Argument | Description |
|----------|-------------|
| `<name>` | Profile name to activate. Use `default` to return to the base profile. |

**Example:**

```bash
valos-agent profile use work
valos-agent profile use default
```

## `valos-agent profile create`

```bash
valos-agent profile create <name> [options]
```

Creates a new profile.

| Argument / Option | Description |
|-------------------|-------------|
| `<name>` | Name for the new profile. Must be a valid directory name (alphanumeric, hyphens, underscores). |
| `--clone` | Copy `config.yaml`, `.env`, and `SOUL.md` from the current profile. |
| `--clone-all` | Copy everything (config, memories, skills, sessions, state) from the current profile. |
| `--clone-from <profile>` | Clone from a specific profile instead of the current one. Used with `--clone` or `--clone-all`. |

**Examples:**

```bash
# Blank profile — needs full setup
valos-agent profile create mybot

# Clone config only from current profile
valos-agent profile create work --clone

# Clone everything from current profile
valos-agent profile create backup --clone-all

# Clone config from a specific profile
valos-agent profile create work2 --clone --clone-from work
```

## `valos-agent profile delete`

```bash
valos-agent profile delete <name> [options]
```

Deletes a profile and removes its shell alias.

| Argument / Option | Description |
|-------------------|-------------|
| `<name>` | Profile to delete. |
| `--yes`, `-y` | Skip confirmation prompt. |

**Example:**

```bash
valos-agent profile delete mybot
valos-agent profile delete mybot --yes
```

:::warning
This permanently deletes the profile's entire directory including all config, memories, sessions, and skills. Cannot delete the currently active profile.
:::

## `valos-agent profile show`

```bash
valos-agent profile show <name>
```

Displays details about a profile including its home directory, configured model, gateway status, skills count, and configuration file status.

| Argument | Description |
|----------|-------------|
| `<name>` | Profile to inspect. |

**Example:**

```bash
$ valos-agent profile show work
Profile: work
Path:    ~/.valos-agent/profiles/work
Model:   anthropic/claude-sonnet-4 (anthropic)
Gateway: stopped
Skills:  12
.env:    exists
SOUL.md: exists
Alias:   ~/.local/bin/work
```

## `valos-agent profile alias`

```bash
valos-agent profile alias <name> [options]
```

Regenerates the shell alias script at `~/.local/bin/<name>`. Useful if the alias was accidentally deleted or if you need to update it after moving your ValOs installation.

| Argument / Option | Description |
|-------------------|-------------|
| `<name>` | Profile to create/update the alias for. |
| `--remove` | Remove the wrapper script instead of creating it. |
| `--name <alias>` | Custom alias name (default: profile name). |

**Example:**

```bash
valos-agent profile alias work
# Creates/updates ~/.local/bin/work

valos-agent profile alias work --name mywork
# Creates ~/.local/bin/mywork

valos-agent profile alias work --remove
# Removes the wrapper script
```

## `valos-agent profile rename`

```bash
valos-agent profile rename <old-name> <new-name>
```

Renames a profile. Updates the directory and shell alias.

| Argument | Description |
|----------|-------------|
| `<old-name>` | Current profile name. |
| `<new-name>` | New profile name. |

**Example:**

```bash
valos-agent profile rename mybot assistant
# ~/.valos-agent/profiles/mybot → ~/.valos-agent/profiles/assistant
# ~/.local/bin/mybot → ~/.local/bin/assistant
```

## `valos-agent profile export`

```bash
valos-agent profile export <name> [options]
```

Exports a profile as a compressed tar.gz archive.

| Argument / Option | Description |
|-------------------|-------------|
| `<name>` | Profile to export. |
| `-o`, `--output <path>` | Output file path (default: `<name>.tar.gz`). |

**Example:**

```bash
valos-agent profile export work
# Creates work.tar.gz in the current directory

valos-agent profile export work -o ./work-2026-03-29.tar.gz
```

## `valos-agent profile import`

```bash
valos-agent profile import <archive> [options]
```

Imports a profile from a tar.gz archive.

| Argument / Option | Description |
|-------------------|-------------|
| `<archive>` | Path to the tar.gz archive to import. |
| `--name <name>` | Name for the imported profile (default: inferred from archive). |

**Example:**

```bash
valos-agent profile import ./work-2026-03-29.tar.gz
# Infers profile name from the archive

valos-agent profile import ./work-2026-03-29.tar.gz --name work-restored
```

## `valos-agent -p` / `valos-agent --profile`

```bash
valos-agent -p <name> <command> [options]
valos-agent --profile <name> <command> [options]
```

Global flag to run any ValOs command under a specific profile without changing the sticky default. This overrides the active profile for the duration of the command.

| Option | Description |
|--------|-------------|
| `-p <name>`, `--profile <name>` | Profile to use for this command. |

**Examples:**

```bash
valos-agent -p work chat -q "Check the server status"
valos-agent --profile dev gateway start
valos-agent -p personal skills list
valos-agent -p work config edit
```

## `valos-agent completion`

```bash
valos-agent completion <shell>
```

Generates shell completion scripts. Includes completions for profile names and profile subcommands.

| Argument | Description |
|----------|-------------|
| `<shell>` | Shell to generate completions for: `bash` or `zsh`. |

**Examples:**

```bash
# Install completions
valos-agent completion bash >> ~/.bashrc
valos-agent completion zsh >> ~/.zshrc

# Reload shell
source ~/.bashrc
```

After installation, tab completion works for:
- `valos-agent profile <TAB>` — subcommands (list, use, create, etc.)
- `valos-agent profile use <TAB>` — profile names
- `valos-agent -p <TAB>` — profile names

## See also

- [Profiles User Guide](../user-guide/profiles.md)
- [CLI Commands Reference](./cli-commands.md)
- [FAQ — Profiles section](./faq.md#profiles)
