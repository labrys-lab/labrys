# SOC Lab — Architecture

## Genel Bakış

```
Kullanıcı
    │
    ▼
┌─────────────────────┐
│   Next.js (Web UI)  │
│   Senaryo seç       │
│   Lab durumu gör    │
│   Alert özeti gör   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   FastAPI (API)     │
│   Senaryo motoru    │
│   Wazuh API dinler  │
│   Başarı tespiti    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│                Docker Compose                       │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ management-network (dışarıya açık)           │   │
│  │  Caddy (reverse proxy)                       │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ soc-network (izole)                          │   │
│  │  Wazuh Manager                               │   │
│  │  OpenSearch                                  │   │
│  │  OpenSearch Dashboards                       │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ lab-network (izole, internete kapalı)        │   │
│  │  Samba AD (Domain Controller)                │   │
│  │  Ubuntu Target (Wazuh agent kurulu)          │   │
│  │  Kali Linux (saldırı makinesi)               │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  Wazuh Manager → hem soc-network hem lab-network    │
└─────────────────────────────────────────────────────┘
```

## Network Yapısı

### lab-network
- Kali, Samba AD, Ubuntu Target bu ağda
- İnternete kapalı
- Kali bu ağdaki makinelere saldırır

### soc-network
- Wazuh Manager ve OpenSearch bu ağda
- İnternete kapalı
- Loglar burada toplanır ve depolanır

### management-network
- FastAPI, Next.js, Caddy bu ağda
- Dışarıya açık
- Kullanıcı bu ağ üzerinden erişir

### Wazuh Köprüsü
- Wazuh Manager hem `lab-network` hem `soc-network`e bağlı
- Lab içindeki agent'lardan log toplar, OpenSearch'e yazar

## Log Akışı

```
Ubuntu Target / Samba AD
    │ Wazuh Agent
    ▼
Wazuh Manager (lab-network üzerinden)
    │
    ▼
OpenSearch (soc-network üzerinden)
    │
    ▼
OpenSearch Dashboards → Kullanıcı
```

Container ayağa kalktığında entrypoint script çalışır, Wazuh agent otomatik olarak Manager'a kaydolur. Elle müdahale gerekmez.

## Senaryo Akışı

```
1. Kullanıcı web UI'dan senaryo seçer
2. Next.js → FastAPI'ye POST /scenario/{name}/start
3. FastAPI → docker compose -f docker-compose.override.yml up çalıştırır
4. Ansible playbook → zafiyeti yerleştirir, agent'ları yapılandırır
5. FastAPI → "lab hazır" döner, bağlantı bilgilerini gönderir
6. Kullanıcı Kali terminaline girer, web UI'daki rehberi takip eder
7. FastAPI Wazuh API'sini dinler
8. Senaryoya özel alert gelince → "başarılı" döner
```

## Senaryo Yapısı

Her senaryo kendi klasöründe bağımsız olarak çalışır:

```
scenarios/[senaryo-adi]/
├── docker-compose.override.yml  # senaryoya özel container ayarları
├── ansible/                     # zafiyeti yerleştiren playbook
├── wazuh-rules/                 # senaryoya özel SIEM kuralları
├── attack/                      # adım adım saldırı rehberi
├── success-criteria.json        # hangi alert gelince başarılı sayılır
└── README.md                    # senaryo açıklaması ve savunma notları
```

## Bileşenler

### Wazuh
- Versiyon: 4.x
- Log toplama, korelasyon, alert üretme
- OpenSearch ile entegre çalışır
- Her senaryo için özel kurallar yüklenir

### OpenSearch
- Wazuh'un resmi olarak desteklediği search engine
- Heap: 4GB (ayarlanabilir, .env üzerinden)
- Elasticsearch'ün Apache 2.0 lisanslı fork'u

### Samba AD
- Linux üzerinde çalışan Active Directory implementasyonu
- Kerberoasting, Pass-the-Hash, DCSync, Brute Force senaryolarını destekler
- Windows lisansı gerektirmez

### Kali Linux
- Pre-installed araçlar: Impacket, Hashcat, Nmap, SQLmap, CrackMapExec
- Sadece lab-network'e erişimi var, internete çıkamaz

### FastAPI
- Senaryo başlatma, durdurma, sıfırlama endpoint'leri
- Wazuh API'sini polling ile dinler
- Docker SDK kullanarak container'ları yönetir

### Next.js
- Senaryo kartları (zorluk seviyesi, tahmini süre, açıklama)
- Lab durumu (başlıyor, hazır, çalışıyor)
- Bağlantı bilgileri
- Adım adım saldırı rehberi
- Alert özeti
- Lab sıfırlama butonu

### Caddy
- Reverse proxy
- Next.js ve FastAPI'yi tek domain altında sunar
- Otomatik HTTPS (production'da)

### Ansible
- Container entrypoint'ten tetiklenir
- Wazuh agent kaydı
- Samba AD kullanıcı ve SPN kurulumu
- Senaryo bazlı zafiyet yerleştirme

## Taşınabilirlik

- Tüm konfigürasyon `.env` dosyasında
- Hiçbir IP, şifre, path hard-code edilmez
- Linux (Ubuntu 24) ve WSL2 desteklenir
- Minimum: 16GB RAM, 50GB disk
- Önerilen: 32GB RAM, 200GB disk
