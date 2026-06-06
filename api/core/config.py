from pathlib import Path
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    wazuh_api_url: str = "https://wazuh-manager:55000"
    wazuh_api_username: str = ""
    wazuh_api_password: str = ""

    scenarios_dir: str = "../scenarios"
    docker_socket: str = "unix:///var/run/docker.sock"
    compose_project_name: str = "soc-lab"

    @model_validator(mode="after")
    def check_required_credentials(self) -> "Settings":
        if not self.wazuh_api_username:
            raise ValueError(
                "WAZUH_API_USERNAME is required — set it in .env"
            )
        if not self.wazuh_api_password:
            raise ValueError(
                "WAZUH_API_PASSWORD is required — set it in .env"
            )
        return self

    @property
    def scenarios_path(self) -> Path:
        return Path(self.scenarios_dir).resolve()


settings = Settings()
