# nginx/Dockerfile
FROM nginx:alpine

# Устанавливаем openssl для генерации сертификатов
RUN apk add --no-cache openssl

# Создаем директории
RUN mkdir -p /etc/nginx/ssl /var/cache/nginx

# Генерируем SSL сертификаты при сборке (а не при запуске)
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/self-signed.key \
    -out /etc/nginx/ssl/self-signed.crt \
    -subj "/C=RU/CN=localhost" && \
    chmod 644 /etc/nginx/ssl/self-signed.crt && \
    chmod 600 /etc/nginx/ssl/self-signed.key

# Копируем конфигурацию
COPY nginx.conf /etc/nginx/nginx.conf

# УДАЛЯЕМ стандартные entrypoint скрипты чтобы они не мешали
RUN rm -rf /docker-entrypoint.d/*

EXPOSE 80 443

# Просто запускаем nginx без сложных entrypoint
CMD ["nginx", "-g", "daemon off;"]