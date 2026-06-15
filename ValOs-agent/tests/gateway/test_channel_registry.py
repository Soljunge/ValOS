from gateway.channel_registry import (
    CHANNEL_REGISTRY,
    ChannelRegistration,
    allow_all_env_names,
    allowlist_env_names,
    normalize_channel_id,
    planned_channel_registrations,
    register_channel,
    session_directory_platform_names,
    supported_channel_registrations,
)
from gateway.config import GatewayConfig, Platform, PlatformConfig
from gateway.run import GatewayRunner


def test_openclaw_channel_catalog_is_represented_as_planned_channels():
    planned = {entry.platform for entry in planned_channel_registrations()}

    assert Platform.GOOGLECHAT in planned
    assert Platform.BLUEBUBBLES in planned
    assert Platform.MSTEAMS in planned
    assert Platform.LINE in planned
    assert Platform.NEXTCLOUD_TALK in planned
    assert Platform.NOSTR in planned
    assert Platform.TWITCH in planned
    assert Platform.ZALO in planned
    assert Platform.WECHAT in planned
    assert Platform.WEBCHAT in planned


def test_existing_valos_channels_are_supported_and_have_adapter_metadata():
    supported = {entry.platform: entry for entry in supported_channel_registrations()}

    for platform in (
        Platform.TELEGRAM,
        Platform.DISCORD,
        Platform.WHATSAPP,
        Platform.SLACK,
        Platform.SIGNAL,
        Platform.MATRIX,
        Platform.FEISHU,
        Platform.WECOM,
    ):
        assert platform in supported
        assert supported[platform].adapter_import
        assert supported[platform].adapter_class


def test_registry_centralizes_allowlist_env_names():
    assert "TELEGRAM_ALLOWED_USERS" in allowlist_env_names()
    assert "WHATSAPP_ALLOWED_USERS" in allowlist_env_names()
    assert "LINE_ALLOWED_USERS" in allowlist_env_names()
    assert "TELEGRAM_ALLOW_ALL_USERS" in allow_all_env_names()
    assert "LINE_ALLOW_ALL_USERS" in allow_all_env_names()


def test_session_directory_platforms_come_from_registry():
    names = session_directory_platform_names()

    assert "telegram" in names
    assert "whatsapp" in names
    assert "signal" in names
    assert "discord" not in names


def test_planned_channel_does_not_create_placeholder_adapter(caplog):
    runner = object.__new__(GatewayRunner)
    runner.config = GatewayConfig(
        platforms={Platform.LINE: PlatformConfig(enabled=True, token="token")}
    )

    adapter = GatewayRunner._create_adapter(
        runner,
        Platform.LINE,
        runner.config.platforms[Platform.LINE],
    )

    assert adapter is None
    assert CHANNEL_REGISTRY[Platform.LINE].status == "planned"
    assert "not implemented yet" in caplog.text


def test_channel_registry_supports_plugin_registration_and_alias_lookup():
    original = CHANNEL_REGISTRY[Platform.WEBCHAT]
    try:
        register_channel(
            ChannelRegistration(
                platform=Platform.WEBCHAT,
                label="Custom WebChat",
                status="planned",
                aliases=("custom-web-chat",),
            )
        )

        assert CHANNEL_REGISTRY[Platform.WEBCHAT].label == "Custom WebChat"
        assert normalize_channel_id("custom-web-chat") == Platform.WEBCHAT
        assert normalize_channel_id("WEBCHAT") == Platform.WEBCHAT
    finally:
        register_channel(original)
