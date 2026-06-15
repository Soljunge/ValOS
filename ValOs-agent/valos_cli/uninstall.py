"""
ValOs reset flow.

``valos uninstall`` behaves like a reset command:
- keep existing data and launch ValOs
- or delete all ValOs data and restart onboarding
"""

import os
import shutil
import sys
from pathlib import Path

from valos_constants import get_valos_home

from valos_cli.colors import Colors, color

def log_info(msg: str):
    print(f"{color('→', Colors.CYAN)} {msg}")

def log_success(msg: str):
    print(f"{color('✓', Colors.GREEN)} {msg}")

def log_warn(msg: str):
    print(f"{color('⚠', Colors.YELLOW)} {msg}")

def log_error(msg: str):
    print(f"{color('✗', Colors.RED)} {msg}")


def _resolve_cli_command() -> str:
    """Pick the best installed launcher for restarting ValOs."""
    for candidate in ("Valos", "valos", "valos-agent"):
        resolved = shutil.which(candidate)
        if resolved:
            return candidate
    return "valos-agent"


def _restart_valos(command_args: list[str]) -> None:
    """Replace the current process with a fresh ValOs invocation."""
    launcher = _resolve_cli_command()
    os.execvp(launcher, [launcher, *command_args])


def run_uninstall(args):
    """Reset ValOs data or jump back into the agent."""
    valos_home = get_valos_home()

    print()
    print(color("┌─────────────────────────────────────────────────────────┐", Colors.MAGENTA, Colors.BOLD))
    print(color("│                   ValOs Reset                          │", Colors.MAGENTA, Colors.BOLD))
    print(color("└─────────────────────────────────────────────────────────┘", Colors.MAGENTA, Colors.BOLD))
    print()
    print(color("This command can reset your ValOs data.", Colors.CYAN, Colors.BOLD))
    print(f"  Config:  {valos_home / 'config.yaml'}")
    print(f"  Secrets: {valos_home / '.env'}")
    print(f"  Data:    {valos_home / 'cron/'}, {valos_home / 'sessions/'}, {valos_home / 'logs/'}")
    print()

    delete_data = bool(getattr(args, "yes", False) or getattr(args, "full", False))
    if not delete_data:
        try:
            answer = input(
                color("Delete all ValOs data and restart onboarding? [y/N]: ", Colors.BOLD)
            ).strip().lower()
        except (KeyboardInterrupt, EOFError):
            print()
            print("Cancelled.")
            return
        delete_data = answer in {"y", "yes"}

    print()
    if delete_data:
        log_info("Deleting ValOs data...")
        try:
            if valos_home.exists():
                shutil.rmtree(valos_home)
                log_success(f"Removed {valos_home}")
            else:
                log_info("No existing ValOs data found")
        except Exception as e:
            log_error(f"Could not delete {valos_home}: {e}")
            return

        print()
        print(color("Restarting onboarding...", Colors.CYAN, Colors.BOLD))
        _restart_valos(["setup"])
        return

    log_info("Keeping your data and starting ValOs...")
    _restart_valos([])
