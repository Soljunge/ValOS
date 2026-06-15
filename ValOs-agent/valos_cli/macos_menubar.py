"""Optional macOS menu-bar status item for interactive ValOs sessions.

Best-effort only:
- no-op on non-macOS platforms
- no-op when PyObjC/AppKit is not installed
- launched detached so the CLI stays responsive
"""

from __future__ import annotations

import argparse
import importlib.util
import os
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path


def _appkit_available() -> bool:
    return importlib.util.find_spec("AppKit") is not None and importlib.util.find_spec("Foundation") is not None


def maybe_launch_for_current_session() -> None:
    """Launch a detached menu-bar helper for the current interactive session."""
    if sys.platform != "darwin":
        return
    if os.getenv("VALOS_DISABLE_MENUBAR_ICON", "").strip().lower() in {"1", "true", "yes", "on"}:
        return
    if os.getenv("VALOS_MENUBAR_HELPER", "") == "1":
        return
    if not _appkit_available():
        return

    try:
        subprocess.Popen(
            [
                sys.executable,
                "-m",
                "valos_cli.macos_menubar",
                "--parent-pid",
                str(os.getpid()),
            ],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
            env={**os.environ, "VALOS_MENUBAR_HELPER": "1"},
        )
    except Exception:
        return


def _parent_alive(parent_pid: int) -> bool:
    try:
        os.kill(parent_pid, 0)
        return True
    except OSError:
        return False


def _terminate_parent(parent_pid: int) -> None:
    try:
        os.kill(parent_pid, signal.SIGTERM)
    except OSError:
        return


def _open_webui(project_root: Path) -> None:
    try:
        subprocess.Popen(
            [sys.executable, "-m", "valos_cli.main", "web"],
            cwd=str(project_root),
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
            env={**os.environ, "VALOS_MENUBAR_OPEN_WEBUI": "1"},
        )
    except Exception:
        return


def _run_helper(parent_pid: int) -> int:
    from AppKit import (
        NSApp,
        NSApplication,
        NSApplicationActivationPolicyAccessory,
        NSImage,
        NSMenu,
        NSMenuItem,
        NSStatusBar,
        NSVariableStatusItemLength,
    )
    from Foundation import NSObject, NSTimer
    from Foundation import NSMakeSize

    project_root = Path(__file__).parent.parent.resolve()
    icon_path = project_root / "landingpage" / "icon-192.png"

    class MenuDelegate(NSObject):
        def initWithParentPid_(self, pid):
            self = self.init()
            if self is None:
                return None
            self.parent_pid = pid
            self.status_item = None
            return self

        def tick_(self, _timer):
            if not _parent_alive(self.parent_pid):
                NSApp.terminate_(None)

        def quit_(self, _sender):
            NSApp.terminate_(None)

        def stopValos_(self, _sender):
            _terminate_parent(self.parent_pid)
            NSApp.terminate_(None)

        def openWebui_(self, _sender):
            _open_webui(project_root)

    app = NSApplication.sharedApplication()
    app.setActivationPolicy_(NSApplicationActivationPolicyAccessory)

    delegate = MenuDelegate.alloc().initWithParentPid_(parent_pid)
    status_item = NSStatusBar.systemStatusBar().statusItemWithLength_(NSVariableStatusItemLength)
    delegate.status_item = status_item

    button = status_item.button()
    if icon_path.exists():
        image = NSImage.alloc().initByReferencingFile_(str(icon_path))
        if image is not None:
            image.setSize_(NSMakeSize(14.0, 14.0))
            image.setTemplate_(True)
            button.setImage_(image)
        else:
            button.setTitle_("V")
    else:
        button.setTitle_("V")
    button.setToolTip_("ValOs is running in Terminal")

    menu = NSMenu.alloc().init()
    title_item = NSMenuItem.alloc().initWithTitle_action_keyEquivalent_("ValOs is running", None, "")
    title_item.setEnabled_(False)
    menu.addItem_(title_item)
    menu.addItem_(NSMenuItem.separatorItem())
    webui_item = NSMenuItem.alloc().initWithTitle_action_keyEquivalent_("Open WebUI", "openWebui:", "")
    webui_item.setTarget_(delegate)
    menu.addItem_(webui_item)
    menu.addItem_(NSMenuItem.separatorItem())
    stop_item = NSMenuItem.alloc().initWithTitle_action_keyEquivalent_("Stop ValOs", "stopValos:", "")
    stop_item.setTarget_(delegate)
    menu.addItem_(stop_item)
    quit_item = NSMenuItem.alloc().initWithTitle_action_keyEquivalent_("Hide Icon", "quit:", "")
    quit_item.setTarget_(delegate)
    menu.addItem_(quit_item)
    status_item.setMenu_(menu)

    NSTimer.scheduledTimerWithTimeInterval_target_selector_userInfo_repeats_(
        2.0,
        delegate,
        "tick:",
        None,
        True,
    )

    signal.signal(signal.SIGTERM, lambda *_args: NSApp.terminate_(None))
    app.run()
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--parent-pid", type=int, required=True)
    args = parser.parse_args()
    return _run_helper(args.parent_pid)


if __name__ == "__main__":
    raise SystemExit(main())
