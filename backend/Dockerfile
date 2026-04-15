FROM php:8.2-cli

# Устанавливаем зависимости
RUN apt-get update && apt-get install -y \
    git unzip curl libzip-dev zip \
    && docker-php-ext-install pdo pdo_mysql

# Устанавливаем Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Копируем проект
COPY . .

# Устанавливаем зависимости Laravel
RUN composer install --no-dev --optimize-autoloader

# Генерация ключа
RUN php artisan key:generate

# Открываем порт
EXPOSE 10000

# Запуск сервера
CMD php artisan serve --host=0.0.0.0 --port=10000