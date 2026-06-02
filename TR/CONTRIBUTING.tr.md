# Katkı Rehberi

## Gereksinimler
- Linux (Ubuntu 24) veya WSL2
- Docker ve Docker Compose kurulu olmalı
- Git konfigüre edilmiş olmalı
- Minimum 16GB RAM, 50GB boş disk alanı

## Başlangıç

```bash
git clone https://github.com/[org]/labrys.git
cd labrys
cp .env.example .env
bash scripts/setup.sh
docker compose up -d
```

## Git İş Akışı

- `main` — kararlı, çalışan branch. Direkt push yapılmaz.
- `dev` — aktif geliştirme branch'i. Tüm işler önce buraya gider.
- Özellik branch'leri → `feature/[kısa-açıklama]`
- Hata düzeltmeleri → `fix/[kısa-açıklama]`

```bash
git checkout dev
git pull origin dev
git checkout -b feature/ozelligim
# çalış
git push origin feature/ozelligim
# pull request aç → dev'e
```

## Pull Request Kuralları
- PR'lar `dev`'e gider, asla direkt `main`'e değil
- Her PR `docker compose config` hatasız geçmeli
- Senaryo değişiklikleri senaryo klasörü içindeki `README.md`'yi de içermeli
- Hiçbir dosyada secret, hardcoded IP veya hardcoded path olmamalı

## Yeni Senaryo Ekleme

1. Klasör yapısını oluştur:
```bash
mkdir -p scenarios/[senaryo-adi]/{ansible,wazuh-rules,attack}
touch scenarios/[senaryo-adi]/{docker-compose.override.yml,success-criteria.json,README.md}
```

2. Her senaryo klasörü şunları içermeli:
   - `docker-compose.override.yml` — senaryoya özel container konfigürasyonu
   - `ansible/` — zafiyeti yerleştiren playbook
   - `wazuh-rules/` — lab başlarken yüklenen tespit kuralları
   - `attack/` — kullanıcının Kali'de elle çalıştıracağı adım adım komutlar
   - `success-criteria.json` — başarı durumunu tetikleyen alert kural ID'leri
   - `README.md` — saldırı açıklaması ve savunma notları

3. Commit'ten önce doğrula:
```bash
docker compose -f docker-compose.yml -f scenarios/[senaryo-adi]/docker-compose.override.yml config
ansible-playbook scenarios/[senaryo-adi]/ansible/main.yml --syntax-check
```

## Her Commit'ten Önce Doğrulama

```bash
docker compose config
docker compose -f docker-compose.yml -f scenarios/[senaryo-adi]/docker-compose.override.yml config
ansible-playbook --syntax-check [playbook]
```

## Ortam Değişkenleri
- `.env` asla commit edilmez
- Yeni değişken eklenirse `.env.example`'a placeholder değer ve açıklama yorumuyla eklenmeli

## Kod Stili
- Python (FastAPI): PEP8'e uy, type hint kullan
- JavaScript (Next.js): ESLint geçmeli
- YAML (Docker, Ansible): 2 boşluk girintileme, tab kullanma

## Güvenlik
Herhangi bir kod yazmadan önce `SECURITY_RULES.md`'yi oku.
Bir güvenlik açığı bulursan herkese açık issue açma — direkt maintainer'larla iletişime geç.
