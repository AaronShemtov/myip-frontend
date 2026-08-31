# myip-frontend

Minimal public IPv4/IPv6 and approximate geolocation checker for [myip.1ms.my](https://myip.1ms.my).

Static HTML, CSS and JavaScript served by an unprivileged nginx container. The browser contacts ipify for public addresses and ipwho.is for approximate IP geolocation. No authentication or persistent storage.

## Run locally

```bash
docker build -t myip-frontend .
docker run --rm -p 8080:8080 myip-frontend
```
