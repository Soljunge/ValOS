# Security Policy

ValOs is an agent that can execute tools, connect messaging platforms, and store local credentials. Please report security issues privately before opening public issues.

## Reporting a Vulnerability

Email the maintainer or open a private GitHub security advisory for `horatiubudai/valos-agent` with:

- affected version or commit
- reproduction steps
- expected impact
- any logs or proof of concept needed to validate the issue

Do not include real API keys, bot tokens, private prompts, or user data in reports.

## Supported Versions

Security fixes are prioritized for the `main` branch and the latest tagged release.

## Scope

High-priority issues include:

- credential leakage or unsafe secret handling
- authentication bypass in API, webhook, or dashboard endpoints
- unsafe command execution without the expected approval controls
- cross-user data exposure in sessions, memory, gateway, or dashboard flows
- supply-chain or installer issues that could execute untrusted code unexpectedly
