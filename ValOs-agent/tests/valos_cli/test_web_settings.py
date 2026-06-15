"""Tests for the local web console settings flow."""

from valos_cli import web as web_mod


def test_settings_snapshot_reports_active_key(monkeypatch):
    storage = {"OPENROUTER_API_KEY": "sk-test-1234567890"}
    config = {"model": {"default": "gpt-4o"}}

    monkeypatch.setattr(web_mod, "get_env_value", lambda key: storage.get(key, ""))
    monkeypatch.setattr(web_mod, "load_config", lambda: config)

    snapshot = web_mod._settings_snapshot()

    assert snapshot["model"] == "gpt-4o"
    assert snapshot["api_key_set"] is True
    assert snapshot["api_key_provider"] == "OPENROUTER_API_KEY"
    assert snapshot["api_key_provider_label"] == "OpenRouter"
    assert snapshot["api_key_masked"] == "sk-t...7890"


def test_apply_settings_update_uses_current_provider_and_can_clear(monkeypatch):
    storage = {"OPENROUTER_API_KEY": "sk-old-1234567890"}
    config = {"model": {"default": "old-model"}}
    writes = []

    def fake_get_env_value(key):
        return storage.get(key, "")

    def fake_save_env_value(key, value):
        writes.append((key, value))
        storage[key] = value

    saved_config = {}

    def fake_load_config():
        return config

    def fake_save_config(cfg):
        saved_config.clear()
        saved_config.update(cfg)

    monkeypatch.setattr(web_mod, "get_env_value", fake_get_env_value)
    monkeypatch.setattr(web_mod, "save_env_value", fake_save_env_value)
    monkeypatch.setattr(web_mod, "load_config", fake_load_config)
    monkeypatch.setattr(web_mod, "save_config", fake_save_config)

    updated = web_mod._apply_settings_update(
        {
            "model": "gpt-4.1",
            "api_key": "sk-new-abcdef123456",
        }
    )

    assert ("OPENROUTER_API_KEY", "sk-new-abcdef123456") in writes
    assert saved_config["model"]["default"] == "gpt-4.1"
    assert updated["api_key_provider"] == "OPENROUTER_API_KEY"
    assert updated["api_key_set"] is True

    writes.clear()
    cleared = web_mod._apply_settings_update({"clear_api_key": True})

    assert ("OPENROUTER_API_KEY", "") in writes
    assert cleared["api_key_set"] is False
