# Hindsight Memory Provider

Long-term memory with knowledge graph, entity resolution, and multi-strategy retrieval. Supports cloud and local modes.

## Requirements

- Cloud: `pip install hindsight-client` + API key from [app.hindsight.vectorize.io](https://app.hindsight.vectorize.io)
- Local: `pip install hindsight` + LLM API key for embeddings

## Setup

```bash
valos-agent memory setup    # select "hindsight"
```

Or manually:
```bash
valos-agent config set memory.provider hindsight
echo "HINDSIGHT_API_KEY=your-key" >> ~/.valos-agent/.env
```

## Config

Config file: `$VALOS_HOME/hindsight/config.json` (or `~/.hindsight/config.json` legacy)

| Key | Default | Description |
|-----|---------|-------------|
| `mode` | `cloud` | `cloud` or `local` |
| `bank_id` | `valos-agent` | Memory bank identifier |
| `budget` | `mid` | Recall thoroughness: `low`/`mid`/`high` |

## Tools

| Tool | Description |
|------|-------------|
| `hindsight_retain` | Store information with auto entity extraction |
| `hindsight_recall` | Multi-strategy search (semantic + entity graph) |
| `hindsight_reflect` | Cross-memory synthesis (LLM-powered) |
