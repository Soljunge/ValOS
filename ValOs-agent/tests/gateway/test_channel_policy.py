from gateway.channel_policy import (
    ChannelPolicy,
    is_allowed_identifier,
    resolve_channel_policy,
    should_accept_by_policy,
)
from gateway.config import PlatformConfig


def test_resolve_channel_policy_from_extra_fields():
    config = PlatformConfig(
        extra={
            "dm_policy": "open",
            "group_policy": "disabled",
            "allow_from": ["*"],
            "group_allow_from": "u1,u2",
            "require_mention": "false",
        }
    )

    policy = resolve_channel_policy(config)

    assert policy.dm_policy == "open"
    assert policy.group_policy == "disabled"
    assert policy.allow_from == ("*",)
    assert policy.group_allow_from == ("u1", "u2")
    assert policy.require_mention is False


def test_is_allowed_identifier_supports_wildcard_and_email_aliases():
    assert is_allowed_identifier("u1", ["*"])
    assert is_allowed_identifier("person@example.com", ["person"])
    assert not is_allowed_identifier("other@example.com", ["person"])


def test_dm_open_requires_wildcard_opt_in():
    assert should_accept_by_policy(
        chat_type="dm",
        user_id="u1",
        policy=ChannelPolicy(dm_policy="open", allow_from=("*",)),
    ) is True
    assert should_accept_by_policy(
        chat_type="dm",
        user_id="u1",
        policy=ChannelPolicy(dm_policy="open", allow_from=("u1",)),
    ) is False


def test_pairing_policy_defers_to_legacy_authorization():
    assert should_accept_by_policy(
        chat_type="dm",
        user_id="u1",
        policy=ChannelPolicy(dm_policy="pairing"),
    ) is None


def test_group_policy_allowlist_and_disabled():
    assert should_accept_by_policy(
        chat_type="group",
        user_id="u1",
        policy=ChannelPolicy(group_policy="allowlist", group_allow_from=("u1",)),
    ) is True
    assert should_accept_by_policy(
        chat_type="group",
        user_id="u2",
        policy=ChannelPolicy(group_policy="allowlist", group_allow_from=("u1",)),
    ) is False
    assert should_accept_by_policy(
        chat_type="group",
        user_id="u1",
        policy=ChannelPolicy(group_policy="disabled"),
    ) is False
