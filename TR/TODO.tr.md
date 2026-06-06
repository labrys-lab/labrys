# Yapılacaklar

## Durum Göstergesi
- [ ] Başlanmadı
- [~] Devam ediyor
- [x] Tamamlandı

---

## Kişi 1

### Altyapı
- [X] Docker Compose ana stack (tüm container'lar, ağlar, volume'lar)
- [X] Wazuh Manager + OpenSearch + OpenSearch Dashboards kurulumu
- [X] Samba AD container kurulumu ve domain konfigürasyonu
- [X] Caddy reverse proxy konfigürasyonu
- [X] `scripts/setup.sh` (ön kontroller, vm.max_map_count, .env doğrulama)
- [~] `healthcheck/` (OpenSearch, Wazuh, Samba AD için servis hazırlık kontrolleri)

### Senaryolar
- [ ] Kerberoasting
  - [ ] `docker-compose.override.yml`
  - [ ] `ansible/` — zafiyet yerleştirme (SPN kurulumu, zayıf servis hesabı)
  - [ ] `wazuh-rules/` — tespit kuralı
  - [ ] `attack/` — adım adım saldırı rehberi
  - [ ] `success-criteria.json`
  - [ ] `README.md` — saldırı açıklaması + savunma notları

- [ ] Pass-the-Hash
  - [ ] `docker-compose.override.yml`
  - [ ] `ansible/` — zafiyet yerleştirme
  - [ ] `wazuh-rules/` — tespit kuralı
  - [ ] `attack/` — adım adım saldırı rehberi
  - [ ] `success-criteria.json`
  - [ ] `README.md`

- [ ] Port Scan
  - [ ] `docker-compose.override.yml`
  - [ ] `ansible/` — hedef makine konfigürasyonu
  - [ ] `wazuh-rules/` — tespit kuralı
  - [ ] `attack/` — adım adım saldırı rehberi
  - [ ] `success-criteria.json`
  - [ ] `README.md`

---

## Kişi 2

### Uygulama
- [x] FastAPI senaryo motoru
  - [x] `POST /scenario/{name}/start`
  - [x] `POST /scenario/{name}/stop`
  - [x] `POST /scenario/{name}/reset`
  - [x] `GET /scenario/{name}/status`
  - [x] Başarı tespiti için Wazuh API dinleme
  - [x] Senaryo adı için izin listesi doğrulaması
  - [x] Tüm aksiyon endpoint'lerinde rate limiting

- [x] Next.js web arayüzü
  - [x] Senaryo kartları (ad, zorluk seviyesi, tahmini süre, açıklama)
  - [x] Lab durumu (boşta, başlıyor, hazır, çalışıyor, başarılı)
  - [x] Bağlantı bilgileri (Kali terminal erişimi, Wazuh Dashboard linki)
  - [x] Adım adım saldırı rehberi paneli
  - [x] Alert özet akışı
  - [x] Başarı durumu gösterimi
  - [x] Lab sıfırlama butonu

- [ ] Kali Linux container kurulumu (hazır araçlar: Impacket, Hashcat, Nmap, SQLmap, CrackMapExec)
- [ ] Ubuntu Target container kurulumu (Wazuh agent entrypoint scripti)

### Senaryolar
- [ ] DCSync
  - [ ] `docker-compose.override.yml`
  - [ ] `ansible/` — zafiyet yerleştirme (DA hesap kurulumu)
  - [ ] `wazuh-rules/` — tespit kuralı
  - [ ] `attack/` — adım adım saldırı rehberi
  - [ ] `success-criteria.json`
  - [ ] `README.md`

- [ ] Brute Force
  - [ ] `docker-compose.override.yml`
  - [ ] `ansible/` — zafiyet yerleştirme
  - [ ] `wazuh-rules/` — tespit kuralı
  - [ ] `attack/` — adım adım saldırı rehberi
  - [ ] `success-criteria.json`
  - [ ] `README.md`

- [ ] SQLi / LFI
  - [ ] `docker-compose.override.yml`
  - [ ] `ansible/` — zafiyetli web uygulaması kurulumu
  - [ ] `wazuh-rules/` — tespit kuralı
  - [ ] `attack/` — adım adım saldırı rehberi
  - [ ] `success-criteria.json`
  - [ ] `README.md`

---

## Her İkisi

- [ ] README.md (en son yazılır, her şey çalışınca)
- [ ] `main`'e merge etmeden önce birbirinin işini code review et
- [ ] Uçtan uca test: `docker compose up`'tan başarı alertına kadar tam senaryo çalıştırma
