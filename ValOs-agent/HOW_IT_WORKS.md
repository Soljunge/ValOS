# How ValOs Works: A Visual Guide 

This document explains the inner architecture and execution flows of the ValOs agent.

---

## 1. The Core Agent Execution Loop

ValOs operates in a loop of observation, thought, action, and synthesis. It continues calling tools until the query is resolved.

```mermaid
sequenceDiagram
    autonumber
    actor User as User (TUI / Telegram / Discord)
    participant Core as ValOs Agent Core
    participant LLM as LLM Provider (Claude / OpenAI / Kimi)
    participant Tools as Tool Sandbox (Terminal / Web Browser / API)
    participant Memory as Memory & Skills Database

    User->>Core: Sends query or command
    Core->>Memory: Load profile, memories (MEMORY.md) & session history
    Memory-->>Core: Session state & context injected
    
    loop Agent Thought-Action Loop (up to Max Turns)
        Core->>LLM: Send system instructions + current context + tools schemas
        LLM-->>Core: Response (Text Thought OR Tool Execution Request)
        
        alt LLM requests Tool Call
            Core->>Tools: Execute requested tool (e.g. read_file, run_bash)
            Note over Tools: Sandboxed execution (Docker / Host / SSH)
            Tools-->>Core: Tool output (stdout, images, file contents)
            Core->>Memory: Log tool execution step
        else LLM returns final answer
            Core->>User: Stream final text response / media files
        end
    end
    
    Core->>Memory: Save updated session state, update user profile, compile new skills
```

---

## 2. Memory & Autonomous Skill Creation

When ValOs successfully completes a complex task, it builds a repeatable Python skill for it, forming a closed learning loop.

```mermaid
flowchart TD
    A[User requests complex/repetitive task] --> B[Agent solves task using multi-step tools]
    B --> C{Task Completed Successfully?}
    C -- No --> D[Log failure & report to User]
    C -- Yes --> E[Autonomously write reusable Python script]
    E --> F[Save to skills/ directory as a plugin]
    F --> G[Register in toolset index]
    G --> H[Future sessions load this skill as a native tool]
```

---

## 3. Communication Gateway Routing

The gateway processes messages from multiple platforms, translates formats, and routes them to a single agent core.

```mermaid
flowchart LR
    Telegram[Telegram] --> Gateway[Gateway Adapter]
    Discord[Discord] --> Gateway
    WhatsApp[WhatsApp] --> Gateway
    Slack[Slack] --> Gateway
    
    Gateway --> Parser[Message Parser & Media transcriber]
    Parser --> Core[ValOs Core Agent]
    
    Core --> Responder[Response Formatter]
    Responder --> Gateway
    
    Gateway --> Telegram
    Gateway --> Discord
    Gateway --> WhatsApp
    Gateway --> Slack
```

---

## 4. Sandbox Security & Command Approvals

To protect your host machine, ValOs screens actions and requests approvals for write commands.

```mermaid
flowchart TD
    ToolCall[LLM requests Tool Call] --> Check{Is it a Read-Only action?}
    Check -- Yes --> Execute[Execute immediately inside Sandbox]
    Check -- No --> Pattern{Matches local auto-approve patterns?}
    Pattern -- Yes --> Execute
    Pattern -- No --> Prompt[Ask User for Permission]
    
    Prompt -- Approved --> Execute
    Prompt -- Denied --> Fail[Return 'Permission Denied' to LLM]
    
    Execute --> Return[Return stdout / stderr back to LLM]
```

---

## 5. Directory Mapping

Here is where the core components live in the codebase:

```
ValOs-agent/
├── agent/               # Core agent Loop logic & session managers
├── valos_cli/           # CLI wrapper, setup configs, and gateway scripts
├── tools/               # Standard built-in tools (files, browser, git)
├── skills/              # Dynamically created / custom skills
├── gateway/             # Platform connectors (Telegram, Discord, Slack)
├── landingpage/         # Landing page static site
└── website/             # Docusaurus documentation source code
```
