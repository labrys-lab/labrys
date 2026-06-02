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
- [ ] FastAPI senaryo motoru
  - [ ] `POST /scenario/{name}/start`
  - [ ] `POST /scenario/{name}/stop`
  - [ ] `POST /scenario/{name}/reset`
  - [ ] Başarı tespiti için Wazuh API dinleme
  - [ ] Senaryo adı için izin listesi doğrulaması
  - [ ] Tüm aksiyon endpoint'lerinde rate limiting

- [ ] Next.js web arayüzü
  - [ ] Senaryo kartları (ad, zorluk seviyesi, tahmini süre, açıklama)
  - [ ] Lab durumu (başlıyor, hazır, çalışıyor)
  - [ ] Bağlantı bilgileri (Kali terminal erişimi, Wazuh Dashboard linki)
  - [ ] Adım adım saldırı rehberi paneli
  - [ ] Alert özet akışı
  - [ ] Başarı durumu gösterimi
  - [ ] Lab sıfırlama butonu

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
