# SOC Lab — Project Context

## Proje Özeti
Tek komutla (`docker compose up`) ayağa kalkan, izole ve gerçekçi bir SOC laboratuvarı.
Kullanıcı senaryo seçer, lab kurulur, saldırıyı kendisi yapar, Wazuh'ta alertı görür.
Açık kaynak, ücretsiz, GitHub'dan clone'lanıp local'de çalıştırılır.

## Hedef Kitle
- SOC analistleri
- Siber güvenlik öğrencileri
- AD öğrenmek isteyen güvenlik profesyonelleri

## Senaryolar
- Kerberoasting
- Pass-the-Hash
- DCSync
- Brute Force
- Port Scan
- SQLi / LFI

## Kullanılan Araçlar ve Neden

| Araç | Görev | Neden |
|---|---|---|
| Wazuh | Log toplama, alert üretme | Açık kaynak, endüstride gerçek kullanım |
| OpenSearch | Log depolama, arama | Elastic'in ücretsiz fork'u, Wazuh resmi desteği |
| Samba AD | Active Directory ortamı | Windows lisansı gerektirmez, tüm senaryoları destekler |
| Kali Linux | Saldırı makinesi | Tüm araçlar hazır gelir |
| Docker + Compose | Container yönetimi | Taşınabilir, tekrarlanabilir ortam |
| FastAPI | Senaryo motoru (backend) | Python, hafif, hızlı |
| Next.js | Web arayüzü (frontend) | React tabanlı, güçlü |
| Caddy | Reverse proxy | Otomatik HTTPS, basit konfigürasyon |
| Ansible | Otomatik konfigürasyon | Container içi kurulum ve zafiyet yerleştirme |

## Mimari Kararlar

### Network Yapısı
- `lab-network` — Kali, Samba AD, Ubuntu Target (izole, internete kapalı)
- `soc-network` — Wazuh, OpenSearch (izole, internete kapalı)
- `management-network` — FastAPI, Next.js, Caddy (dışarıya açık)
- Wazuh hem `lab-network` hem `soc-network`e bağlı

### Log Akışı
Container ayağa kalkar → entrypoint script çalışır → Wazuh agent otomatik Manager'a bağlanır

### Senaryo Tetikleme
Next.js → FastAPI → Docker Compose override → Ansible → "lab hazır"

### Başarı Tespiti
FastAPI Wazuh API'sini dinler → senaryoya özel alert gelince "başarılı" döner

### Kullanıcı Saldırıyı Kendisi Yapar
Öğretici olması için saldırı otomatik çalıştırılmaz. Kullanıcı Kali terminaline girer, web UI'daki rehberi takip eder.

## Her Senaryo Şunları İçerir
1. Zafiyet yerleştirilmiş ortam
2. Saldırı rehberi (adım adım komutlar)
3. SIEM kuralları (Wazuh)
4. Başarı kriteri (hangi alert = başarılı)
5. Açıklama (saldırı nasıl çalışır, savunma tarafında ne yapılmalı)
6. Lab sıfırlama

## Taşınabilirlik Kuralları
- Hiçbir şey hard-code edilmez (IP, şifre, path)
- Tüm konfigürasyon `.env` dosyasında
- Kullanıcı: `git clone` → `cp .env.example .env` → `docker compose up`
- Linux ve WSL2 desteklenir

## Repo Yapısı
```
soc-lab/
├── docker-compose.yml
├── .env.example
├── wazuh/
├── samba/
├── kali/
├── targets/
├── caddy/
├── scenarios/
│   └── [senaryo-adi]/
│       ├── docker-compose.override.yml
│       ├── ansible/
│       ├── wazuh-rules/
│       ├── attack/
│       ├── success-criteria.json
│       └── README.md
├── ansible/
├── api/
├── ui/
├── healthcheck/
├── scripts/
└── docs/
```

## Geliştirme Ortamı
- İşletim Sistemi: Linux (Ubuntu 24) veya WSL2
- RAM: minimum 16GB, önerilen 32GB
- Disk: minimum 50GB boş alan
- Docker ve Docker Compose kurulu olmalı

## Ekip
2 kişilik ekip. Görev dağılımı TODO.md'de.
