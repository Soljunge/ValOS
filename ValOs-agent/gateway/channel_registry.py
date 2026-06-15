"""Messaging channel registry.

This centralizes platform metadata that used to be repeated across gateway
startup, authorization, and directory discovery. Some entries are planned
channels imported from OpenClaw's channel catalog; they are visible to the
architecture but intentionally not connectable until a ValOs adapter exists.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from gateway.config import Platform


@dataclass(frozen=True)
class ChannelRegistration:
    platform: Platform
    label: str
    status: str = "supported"  # supported | planned
    token_env: Optional[str] = None
    allowed_users_env: Optional[str] = None
    allow_all_env: Optional[str] = None
    home_channel_env: Optional[str] = None
    home_channel_name_env: Optional[str] = None
    session_directory: bool = True
    system_authenticated: bool = False
    adapter_import: Optional[str] = None
    adapter_class: Optional[str] = None
    requirements_function: Optional[str] = None
    requirements_warning: Optional[str] = None
    aliases: tuple[str, ...] = field(default_factory=tuple)

    @property
    def is_supported(self) -> bool:
        return self.status == "supported" and bool(self.adapter_import and self.adapter_class)


def _default_allowed_env(platform: Platform) -> str:
    return f"{platform.value.upper()}_ALLOWED_USERS"


def _default_allow_all_env(platform: Platform) -> str:
    return f"{platform.value.upper()}_ALLOW_ALL_USERS"


def _channel(
    platform: Platform,
    label: str,
    *,
    token_env: Optional[str] = None,
    home_channel_env: Optional[str] = None,
    home_channel_name_env: Optional[str] = None,
    session_directory: bool = True,
    system_authenticated: bool = False,
    adapter_import: Optional[str] = None,
    adapter_class: Optional[str] = None,
    requirements_function: Optional[str] = None,
    requirements_warning: Optional[str] = None,
    aliases: tuple[str, ...] = (),
) -> ChannelRegistration:
    return ChannelRegistration(
        platform=platform,
        label=label,
        token_env=token_env,
        allowed_users_env=None if system_authenticated else _default_allowed_env(platform),
        allow_all_env=None if system_authenticated else _default_allow_all_env(platform),
        home_channel_env=home_channel_env,
        home_channel_name_env=home_channel_name_env,
        session_directory=session_directory,
        system_authenticated=system_authenticated,
        adapter_import=adapter_import,
        adapter_class=adapter_class,
        requirements_function=requirements_function,
        requirements_warning=requirements_warning,
        aliases=aliases,
    )


def _planned(platform: Platform, label: str, aliases: tuple[str, ...] = ()) -> ChannelRegistration:
    return ChannelRegistration(
        platform=platform,
        label=label,
        status="planned",
        allowed_users_env=_default_allowed_env(platform),
        allow_all_env=_default_allow_all_env(platform),
        aliases=aliases,
    )


CHANNEL_REGISTRY: dict[Platform, ChannelRegistration] = {
    Platform.TELEGRAM: _channel(
        Platform.TELEGRAM,
        "Telegram",
        token_env="TELEGRAM_BOT_TOKEN",
        home_channel_env="TELEGRAM_HOME_CHANNEL",
        home_channel_name_env="TELEGRAM_HOME_CHANNEL_NAME",
        adapter_import="gateway.platforms.telegram",
        adapter_class="TelegramAdapter",
        requirements_function="check_telegram_requirements",
        requirements_warning="Telegram: python-telegram-bot not installed",
    ),
    Platform.DISCORD: _channel(
        Platform.DISCORD,
        "Discord",
        token_env="DISCORD_BOT_TOKEN",
        home_channel_env="DISCORD_HOME_CHANNEL",
        home_channel_name_env="DISCORD_HOME_CHANNEL_NAME",
        session_directory=False,
        adapter_import="gateway.platforms.discord",
        adapter_class="DiscordAdapter",
        requirements_function="check_discord_requirements",
        requirements_warning="Discord: discord.py not installed",
    ),
    Platform.WHATSAPP: _channel(
        Platform.WHATSAPP,
        "WhatsApp",
        home_channel_env="WHATSAPP_HOME_CHANNEL",
        home_channel_name_env="WHATSAPP_HOME_CHANNEL_NAME",
        adapter_import="gateway.platforms.whatsapp",
        adapter_class="WhatsAppAdapter",
        requirements_function="check_whatsapp_requirements",
        requirements_warning="WhatsApp: Node.js not installed or bridge not configured",
    ),
    Platform.SLACK: _channel(
        Platform.SLACK,
        "Slack",
        token_env="SLACK_BOT_TOKEN",
        home_channel_env="SLACK_HOME_CHANNEL",
        home_channel_name_env="SLACK_HOME_CHANNEL_NAME",
        session_directory=False,
        adapter_import="gateway.platforms.slack",
        adapter_class="SlackAdapter",
        requirements_function="check_slack_requirements",
        requirements_warning="Slack: slack-bolt not installed. Run: pip install 'valos-agent[slack]'",
    ),
    Platform.SIGNAL: _channel(
        Platform.SIGNAL,
        "Signal",
        home_channel_env="SIGNAL_HOME_CHANNEL",
        home_channel_name_env="SIGNAL_HOME_CHANNEL_NAME",
        adapter_import="gateway.platforms.signal",
        adapter_class="SignalAdapter",
        requirements_function="check_signal_requirements",
        requirements_warning="Signal: SIGNAL_HTTP_URL or SIGNAL_ACCOUNT not configured",
    ),
    Platform.MATTERMOST: _channel(
        Platform.MATTERMOST,
        "Mattermost",
        token_env="MATTERMOST_TOKEN",
        home_channel_env="MATTERMOST_HOME_CHANNEL",
        home_channel_name_env="MATTERMOST_HOME_CHANNEL_NAME",
        adapter_import="gateway.platforms.mattermost",
        adapter_class="MattermostAdapter",
        requirements_function="check_mattermost_requirements",
        requirements_warning="Mattermost: MATTERMOST_TOKEN or MATTERMOST_URL not set, or aiohttp missing",
    ),
    Platform.MATRIX: _channel(
        Platform.MATRIX,
        "Matrix",
        token_env="MATRIX_ACCESS_TOKEN",
        home_channel_env="MATRIX_HOME_ROOM",
        home_channel_name_env="MATRIX_HOME_ROOM_NAME",
        adapter_import="gateway.platforms.matrix",
        adapter_class="MatrixAdapter",
        requirements_function="check_matrix_requirements",
        requirements_warning=(
            "Matrix: matrix-nio not installed or credentials not set. "
            "Run: pip install 'matrix-nio[e2e]'"
        ),
    ),
    Platform.HOMEASSISTANT: _channel(
        Platform.HOMEASSISTANT,
        "Home Assistant",
        token_env="HASS_TOKEN",
        session_directory=False,
        system_authenticated=True,
        adapter_import="gateway.platforms.homeassistant",
        adapter_class="HomeAssistantAdapter",
        requirements_function="check_ha_requirements",
        requirements_warning="HomeAssistant: aiohttp not installed or HASS_TOKEN not set",
    ),
    Platform.EMAIL: _channel(
        Platform.EMAIL,
        "Email",
        home_channel_env="EMAIL_HOME_ADDRESS",
        home_channel_name_env="EMAIL_HOME_ADDRESS_NAME",
        adapter_import="gateway.platforms.email",
        adapter_class="EmailAdapter",
        requirements_function="check_email_requirements",
        requirements_warning="Email: EMAIL_ADDRESS, EMAIL_PASSWORD, EMAIL_IMAP_HOST, or EMAIL_SMTP_HOST not set",
    ),
    Platform.SMS: _channel(
        Platform.SMS,
        "SMS",
        home_channel_env="SMS_HOME_CHANNEL",
        home_channel_name_env="SMS_HOME_CHANNEL_NAME",
        adapter_import="gateway.platforms.sms",
        adapter_class="SmsAdapter",
        requirements_function="check_sms_requirements",
        requirements_warning="SMS: aiohttp not installed or TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN not set",
    ),
    Platform.DINGTALK: _channel(
        Platform.DINGTALK,
        "DingTalk",
        adapter_import="gateway.platforms.dingtalk",
        adapter_class="DingTalkAdapter",
        requirements_function="check_dingtalk_requirements",
        requirements_warning="DingTalk: dingtalk-stream not installed or DINGTALK_CLIENT_ID/SECRET not set",
    ),
    Platform.API_SERVER: _channel(
        Platform.API_SERVER,
        "API Server",
        session_directory=False,
        system_authenticated=True,
        adapter_import="gateway.platforms.api_server",
        adapter_class="APIServerAdapter",
        requirements_function="check_api_server_requirements",
        requirements_warning="API Server: aiohttp not installed",
    ),
    Platform.WEBHOOK: _channel(
        Platform.WEBHOOK,
        "Webhook",
        session_directory=False,
        system_authenticated=True,
        adapter_import="gateway.platforms.webhook",
        adapter_class="WebhookAdapter",
        requirements_function="check_webhook_requirements",
        requirements_warning="Webhook: aiohttp not installed",
    ),
    Platform.FEISHU: _channel(
        Platform.FEISHU,
        "Feishu/Lark",
        home_channel_env="FEISHU_HOME_CHANNEL",
        home_channel_name_env="FEISHU_HOME_CHANNEL_NAME",
        adapter_import="gateway.platforms.feishu",
        adapter_class="FeishuAdapter",
        requirements_function="check_feishu_requirements",
        requirements_warning="Feishu: lark-oapi not installed or FEISHU_APP_ID/SECRET not set",
        aliases=("lark",),
    ),
    Platform.WECOM: _channel(
        Platform.WECOM,
        "WeCom",
        home_channel_env="WECOM_HOME_CHANNEL",
        home_channel_name_env="WECOM_HOME_CHANNEL_NAME",
        adapter_import="gateway.platforms.wecom",
        adapter_class="WeComAdapter",
        requirements_function="check_wecom_requirements",
        requirements_warning="WeCom: aiohttp not installed or WECOM_BOT_ID/SECRET not set",
        aliases=("enterprise-wechat",),
    ),
    Platform.GOOGLECHAT: _planned(Platform.GOOGLECHAT, "Google Chat", ("google-chat",)),
    Platform.IMESSAGE: _planned(Platform.IMESSAGE, "iMessage"),
    Platform.BLUEBUBBLES: _planned(
        Platform.BLUEBUBBLES,
        "BlueBubbles",
        ("imessage-bluebubbles",),
    ),
    Platform.IRC: _planned(Platform.IRC, "IRC"),
    Platform.MSTEAMS: _planned(
        Platform.MSTEAMS,
        "Microsoft Teams",
        ("teams", "microsoft-teams"),
    ),
    Platform.LINE: _planned(Platform.LINE, "LINE"),
    Platform.NEXTCLOUD_TALK: _planned(
        Platform.NEXTCLOUD_TALK,
        "Nextcloud Talk",
        ("nextcloud",),
    ),
    Platform.NOSTR: _planned(Platform.NOSTR, "Nostr"),
    Platform.SYNOLOGY_CHAT: _planned(Platform.SYNOLOGY_CHAT, "Synology Chat", ("synology",)),
    Platform.TLON: _planned(Platform.TLON, "Tlon"),
    Platform.TWITCH: _planned(Platform.TWITCH, "Twitch"),
    Platform.ZALO: _planned(Platform.ZALO, "Zalo"),
    Platform.ZALOUSER: _planned(Platform.ZALOUSER, "Zalo Personal", ("zalo-personal",)),
    Platform.WECHAT: _planned(Platform.WECHAT, "WeChat", ("weixin",)),
    Platform.WEBCHAT: _planned(Platform.WEBCHAT, "WebChat", ("web-chat",)),
}


def register_channel(registration: ChannelRegistration) -> None:
    """Register or replace a channel entry.

    Plugin packages can call this during startup to expose a channel adapter
    without adding new hard-coded gateway maps.
    """
    CHANNEL_REGISTRY[registration.platform] = registration


def get_channel_registration(platform: Platform) -> Optional[ChannelRegistration]:
    return CHANNEL_REGISTRY.get(platform)


def normalize_channel_id(raw: str) -> Optional[Platform]:
    key = str(raw or "").strip().lower().replace("-", "_")
    if not key:
        return None
    for platform, entry in CHANNEL_REGISTRY.items():
        keys = {platform.value, platform.name.lower(), *(alias.lower() for alias in entry.aliases)}
        normalized_keys = {item.replace("-", "_") for item in keys}
        if key in normalized_keys:
            return platform
    return None


def supported_channel_registrations() -> list[ChannelRegistration]:
    return [entry for entry in CHANNEL_REGISTRY.values() if entry.status == "supported"]


def planned_channel_registrations() -> list[ChannelRegistration]:
    return [entry for entry in CHANNEL_REGISTRY.values() if entry.status == "planned"]


def allowlist_env_names() -> list[str]:
    return [
        entry.allowed_users_env
        for entry in CHANNEL_REGISTRY.values()
        if entry.allowed_users_env
    ]


def allow_all_env_names() -> list[str]:
    return [
        entry.allow_all_env
        for entry in CHANNEL_REGISTRY.values()
        if entry.allow_all_env
    ]


def session_directory_platform_names() -> tuple[str, ...]:
    return tuple(
        entry.platform.value
        for entry in CHANNEL_REGISTRY.values()
        if entry.session_directory
    )
