# AGENTS.md (Türkçe)

## Zorunlu Kısıtlamalar

- IP, şifre veya path asla hardcode edilmez. Tüm konfigürasyon `.env`'de yaşar. Şablon olarak `.env.example` kullan.
- `lab-network` veya `soc-network` asla host ağına veya internete açılmaz.
- Kali container'ının internet erişimi olmamalı. Egress Docker ağ seviyesinde engellenmiş olmalı.
- Wazuh kuralları senaryo bazlıdır. Senaryo'ya özel mantık için asla `wazuh/` global kurallarını değiştirme — bunun yerine `scenarios/[ad]/wazuh-rules/` kullan.
- Saldırı scriptleri asla otomatik çalıştırılmaz. Saldırı adımları manueldir — kullanıcı bunları Kali terminalinde çalıştırır.
- `success-criteria.json` Wazuh API üzerinden otomatik başarı tespitini yönetir. Alert ID'lerini FastAPI'ye hardcode etme.
- FastAPI container'ları yönetmek için Docker SDK kullanır (shell subprocess değil).
- OpenSearch heap `.env` üzerinden ayarlanır (`OPENSEARCH_HEAP`). Bunu asla direkt `docker-compose.yml` içinde ayarlama.

## Bitirmeden Önce Doğrulama

- `docker compose config` — commit öncesi compose dosyalarını doğrula
- `docker compose -f docker-compose.yml -f scenarios/[ad]/docker-compose.override.yml config` — senaryo override'larını doğrula
- Ansible playbook'ları: `ansible-playbook --syntax-check`
- FastAPI: `uvicorn app.main:app` hatasız başlamalı

## Repo'ya Özgü Kurallar

- Her senaryo kendi içinde bağımsızdır. Bir senaryo yalnızca kendi `docker-compose.override.yml` + `ansible/` + `wazuh-rules/` ile çalışabilmeli.
- Başlatma sırası önemlidir: OpenSearch → Wazuh Manager → Wazuh Agent'ları. `healthcheck` ile `depends_on` kullan.
- Wazuh agent kaydı container entrypoint scripti tarafından yapılır, Ansible tarafından değil.
- Ansible yalnızca boot sonrası konfigürasyon içindir (zafiyet yerleştirme, AD kullanıcı/SPN kurulumu).
- `scripts/setup.sh` `docker compose up`'tan önce çalışır. Ön kontrolleri compose'a taşıma.

## Önemli Konumlar

- `.env.example` — tüm konfigüre edilebilir değerlerin referans kaynağı
- `scenarios/[ad]/success-criteria.json` — başarı durumunu tetikleyen alert kural ID'leri
- `scenarios/[ad]/wazuh-rules/` — lab başlangıcında yüklenen senaryo'ya özel Wazuh kuralları
- `api/` — FastAPI backend
- `ui/` — Next.js frontend
- `healthcheck/` — servis hazırlık kontrolleri (scriptler tarafından kullanılır, compose tarafından değil)

## Değişiklik Güvenlik Kuralları

- Yeni senaryo eklemek ana stack'i (`docker-compose.yml`) etkilememelidir.
- `wazuh/` konfigürasyonundaki değişiklikler tüm senaryoları etkiler — tüm senaryoların hâlâ çalıştığını doğrula.
- FastAPI `/scenario/{name}/start` endpoint'indeki değişiklikler response sözleşmesini korumalıdır: `{status, connections, message}`.
- Docker ağ adlarını değiştirme (`lab-network`, `soc-network`, `management-network`) — birden fazla dosyada referans alınıyorlar.

## Bilinen Tuzaklar

- Samba AD tamamen başlatılması 30-60 saniye sürer. AD hazır olmadan domain'e katılmaya çalışan agent'lar başarısız olur. Entrypoint'te healthcheck bekleme döngüsü kullan.
- OpenSearch host'ta `vm.max_map_count=262144` gerektirir. `scripts/setup.sh` bunu ayarlar — atlanırsa OpenSearch sessizce çöker.
- Wazuh Dashboard, agent kaydından sonra 2-3 dakika veri göstermeyebilir. Bu normaldir.
- `docker compose down` adlandırılmış volume'ları kaldırmaz. Lab'ı tamamen sıfırlamak için `docker compose down -v` kullan.
