"""Shared channel policy helpers.

Adapters still own platform-specific event details, but these helpers provide
one place for DM/group policy normalization and allowlist matching.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable, Optional


DM_POLICIES = {"pairing", "allowlist", "open", "disabled"}
GROUP_POLICIES = {"allowlist", "open", "disabled"}


@dataclass(frozen=True)
class ChannelPolicy:
    dm_policy: str = "pairing"
    group_policy: str = "allowlist"
    allow_from: tuple[str, ...] = ()
    group_allow_from: tuple[str, ...] = ()
    require_mention: bool = True


def _as_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _as_list(value: Any) -> tuple[str, ...]:
    if value is None:
        return ()
    if isinstance(value, str):
        return tuple(part.strip() for part in value.split(",") if part.strip())
    if isinstance(value, Iterable):
        return tuple(str(part).strip() for part in value if str(part).strip())
    return ()


def _normalize_policy(value: Any, allowed: set[str], default: str) -> str:
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in allowed:
            return normalized
    return default


def _bool_value(value: Any, default: bool) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"true", "1", "yes", "on"}:
            return True
        if lowered in {"false", "0", "no", "off"}:
            return False
    return bool(value)


def resolve_channel_policy(platform_config: Any) -> ChannelPolicy:
    """Resolve shared policy from a PlatformConfig-like object's extra dict."""
    extra = _as_dict(getattr(platform_config, "extra", {}))
    policy = _as_dict(extra.get("policy"))

    return ChannelPolicy(
        dm_policy=_normalize_policy(
            extra.get("dm_policy", policy.get("dm_policy")),
            DM_POLICIES,
            "pairing",
        ),
        group_policy=_normalize_policy(
            extra.get("group_policy", policy.get("group_policy")),
            GROUP_POLICIES,
            "allowlist",
        ),
        allow_from=_as_list(extra.get("allow_from", policy.get("allow_from"))),
        group_allow_from=_as_list(extra.get("group_allow_from", policy.get("group_allow_from"))),
        require_mention=_bool_value(
            extra.get("require_mention", policy.get("require_mention")),
            True,
        ),
    )


def is_allowed_identifier(identifier: Optional[str], allowed: Iterable[str]) -> bool:
    if not identifier:
        return False
    allowed_set = {str(item).strip() for item in allowed if str(item).strip()}
    if "*" in allowed_set:
        return True
    check_ids = {identifier}
    if "@" in identifier:
        check_ids.add(identifier.split("@", 1)[0])
    return bool(check_ids & allowed_set)


def should_accept_by_policy(
    *,
    chat_type: str,
    user_id: Optional[str],
    policy: ChannelPolicy,
) -> Optional[bool]:
    """Return a policy decision, or None when legacy allowlist logic should decide."""
    if chat_type == "dm":
        if policy.dm_policy == "disabled":
            return False
        if policy.dm_policy == "open":
            return "*" in policy.allow_from
        if policy.dm_policy == "allowlist":
            return is_allowed_identifier(user_id, policy.allow_from)
        return None

    if policy.group_policy == "disabled":
        return False
    if policy.group_policy == "open":
        return True
    if policy.group_allow_from:
        return is_allowed_identifier(user_id, policy.group_allow_from)
    return None
