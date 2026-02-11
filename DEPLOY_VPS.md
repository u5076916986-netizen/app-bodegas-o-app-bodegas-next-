# Deploy en VPS con Docker + Nginx + SSL

## Requisitos
- VPS Ubuntu 22.04/24.04
- Dominio apuntando al VPS (A/AAAA)
- Docker y docker compose instalados
- Firewall UFW habilitado (22, 80, 443 abiertos)

## Instalación Docker y docker compose
```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```
Reinicia sesión para que aplique el grupo `docker`.

## Preparar el proyecto
```bash
git clone RUTA_REPO app-bodegas
cd app-bodegas
```

## Configuración de entorno
- Para producción en VPS con persistencia en archivo, deja `ORDERS_STORAGE` sin definir (modo archivo).
- Crea `.env.production` si necesitas variables adicionales (no incluyas secretos en el repo).

## Docker Compose
El archivo `docker-compose.yml` ya incluye:
- Servicio `web` (Next) en puerto 3000
- Volumen `./data:/app/data` para persistir `data/pedidos.json`
- `restart: unless-stopped`
- Healthcheck a `/bodegas`

Levantar en modo producción:
```bash
docker compose up -d --build
```

Logs:
```bash
docker compose logs -f web
```

Recrear tras cambios:
```bash
docker compose up -d --build
```

## Nginx como reverse proxy
Ejemplo de config (usa el contenedor `web` en la red de docker compose):
Ruta sugerida: `/etc/nginx/sites-available/app-bodegas.conf`
```
server {
    listen 80;
    server_name TU_DOMINIO;

    location / {
        proxy_pass http://web:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }

    map $http_upgrade $connection_upgrade {
        default upgrade;
        ''      close;
    }
}
```
Habilitar sitio y probar:
```bash
sudo ln -s /etc/nginx/sites-available/app-bodegas.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL con Let's Encrypt (Certbot)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d TU_DOMINIO --redirect
```
Renovación automática:
```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

## Checklist post-deploy
1) `curl -I http://TU_DOMINIO/bodegas` → 200
2) Abrir https://TU_DOMINIO/bodegas en navegador; ver entorno producción y botón “Ver mis pedidos”.
3) Flujo: agregar productos en `/bodegas/BOD_001` → confirmar → enviar → listar en `/pedidos` → detalle `/pedidos/<pedidoId>`.
4) Verificar que `data/pedidos.json` se crea/actualiza en el volumen `./data` (host).

## Firewall (UFW)
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```
