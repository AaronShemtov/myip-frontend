FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY public/ /usr/share/nginx/html/
RUN chown -R 101:101 /usr/share/nginx/html /var/cache/nginx && \
    mkdir -p /tmp/client_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp && \
    chown -R 101:101 /tmp/client_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp
USER 101:101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
