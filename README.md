# MicroStore Demo

Демонстраційний вебзастосунок інтернет-магазину на основі мікросервісної архітектури.

## Локальний запуск

### Вимоги

- `Node.js`
- `openssl`

Перевірити наявність:

```bash
node -v
openssl version
```

### Найпростіший запуск

```bash
cd /Users/dashasin/Downloads/Web_project
npm run start
```

або напряму:

```bash
cd /Users/dashasin/Downloads/Web_project
./scripts/start-full-https.sh
```

Після запуску відкрий у браузері:

```text
https://localhost:3443
```

Браузер може показати попередження про `self-signed certificate`. Для локальної демонстрації це нормально: потрібно підтвердити виняток і перейти на сторінку.

### Як зупинити застосунок

```bash
cd /Users/dashasin/Downloads/Web_project
npm run stop
```

або:

```bash
cd /Users/dashasin/Downloads/Web_project
./scripts/stop-full-https.sh
```

### Якщо скрипти не запускаються

Один раз надай права на виконання:

```bash
cd /Users/dashasin/Downloads/Web_project
chmod +x scripts/start-full-https.sh scripts/stop-full-https.sh
```

Потім знову виконай:

```bash
./scripts/start-full-https.sh
```

### Що робить автоматичний запуск

Скрипт:

- створює локальні TLS-сертифікати, якщо їх ще немає;
- запускає `frontend`, `api-gateway`, `auth-service`, `product-service`, `order-service`, `notification-service`;
- вмикає `HTTPS` для всіх сервісів;
- зберігає логи в теці `logs`;
- зберігає PID-файли в теці `run`.

### Перегляд логів

```bash
tail -f /Users/dashasin/Downloads/Web_project/logs/frontend.log
```

```bash
tail -f /Users/dashasin/Downloads/Web_project/logs/api-gateway.log
```

### Ручний запуск

Якщо потрібно запускати сервіси окремо, відкрий 6 вкладок терміналу.

`auth-service`:

```bash
cd /Users/dashasin/Downloads/Web_project/services/auth-service
ENABLE_HTTPS=true PORT=4101 node server.js
```

`product-service`:

```bash
cd /Users/dashasin/Downloads/Web_project/services/product-service
ENABLE_HTTPS=true PORT=4102 node server.js
```

`notification-service`:

```bash
cd /Users/dashasin/Downloads/Web_project/services/notification-service
ENABLE_HTTPS=true PORT=4104 node server.js
```

`order-service`:

```bash
cd /Users/dashasin/Downloads/Web_project/services/order-service
NODE_TLS_REJECT_UNAUTHORIZED=0 ENABLE_HTTPS=true PORT=4103 PRODUCT_SERVICE_URL=https://localhost:4102 NOTIFICATION_SERVICE_URL=https://localhost:4104 node server.js
```

`api-gateway`:

```bash
cd /Users/dashasin/Downloads/Web_project/api-gateway
NODE_TLS_REJECT_UNAUTHORIZED=0 ENABLE_HTTPS=true PORT=4450 AUTH_SERVICE_URL=https://localhost:4101 PRODUCT_SERVICE_URL=https://localhost:4102 ORDER_SERVICE_URL=https://localhost:4103 node server.js
```

`frontend`:

```bash
cd /Users/dashasin/Downloads/Web_project/frontend
ENABLE_HTTPS=true PORT=3443 API_GATEWAY_HTTPS_URL=https://localhost:4450 node server.js
```

Після цього відкрий:

```text
https://localhost:3443
```

## Структура

- `frontend` - інтерфейс користувача
- `api-gateway` - єдина точка входу для клієнта
- `services/auth-service` - автентифікація користувача
- `services/product-service` - каталог товарів
- `services/order-service` - створення та перегляд замовлень
- `services/notification-service` - імітація сервісу сповіщень

## Швидкий старт

```bash
docker compose up
```

Після запуску:

- frontend: `http://localhost:3000`
- api gateway: `http://localhost:4000`
- auth-service: `http://localhost:4001`
- product-service: `http://localhost:4002`
- order-service: `http://localhost:4003`
- notification-service: `http://localhost:4004`

## Найпростіший запуск без Docker

У проєкті є готові скрипти для повного HTTPS-режиму.

Запуск:

```bash
cd /Users/dashasin/Downloads/Web_project
chmod +x scripts/start-full-https.sh scripts/stop-full-https.sh
./scripts/start-full-https.sh
```

Застосунок буде доступний за адресою:

```text
https://localhost:3443
```

Скрипт:

- сам створить локальні сертифікати, якщо їх ще немає;
- підніме всі сервіси у background;
- збере логи в теку `logs`;
- збереже PID-файли в теку `run`.

Зупинка:

```bash
cd /Users/dashasin/Downloads/Web_project
./scripts/stop-full-https.sh
```

Перегляд логів:

```bash
tail -f logs/api-gateway.log
```

```bash
tail -f logs/frontend.log
```

## HTTPS для демонстрації

Для навчального показу достатньо увімкнути HTTPS на рівні `frontend` і `api-gateway`. Внутрішні мікросервіси можуть залишатися на HTTP, бо в реальних системах TLS часто завершується на gateway або ingress-рівні.

### 1. Створи локальні сертифікати

```bash
mkdir -p certs
openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 365 \
  -keyout certs/localhost-key.pem \
  -out certs/localhost.pem \
  -subj "/CN=localhost"
```

### 2. Запуск без Docker

Frontend:

```bash
cd /Users/dashasin/Downloads/Web_project/frontend
ENABLE_HTTPS=true PORT=3443 API_GATEWAY_HTTPS_URL=https://localhost:4443 node server.js
```

API Gateway:

```bash
cd /Users/dashasin/Downloads/Web_project/api-gateway
ENABLE_HTTPS=true PORT=4443 AUTH_SERVICE_URL=http://localhost:4001 PRODUCT_SERVICE_URL=http://localhost:4002 ORDER_SERVICE_URL=http://localhost:4003 node server.js
```

Інші сервіси запускаються як раніше по HTTP:

```bash
cd /Users/dashasin/Downloads/Web_project/services/auth-service
node server.js
```

```bash
cd /Users/dashasin/Downloads/Web_project/services/product-service
node server.js
```

```bash
cd /Users/dashasin/Downloads/Web_project/services/notification-service
node server.js
```

```bash
cd /Users/dashasin/Downloads/Web_project/services/order-service
PRODUCT_SERVICE_URL=http://localhost:4002 NOTIFICATION_SERVICE_URL=http://localhost:4004 node server.js
```

Після цього відкрий:

- `https://localhost:3443`

Браузер попередить про self-signed certificate. Для демонстрації достатньо підтвердити виняток і показати, що застосунок працює через `https`.

Якщо порт `4443` уже зайнятий, можна вибрати інший, наприклад `4450`:

```bash
cd /Users/dashasin/Downloads/Web_project/api-gateway
ENABLE_HTTPS=true PORT=4450 AUTH_SERVICE_URL=http://localhost:4001 PRODUCT_SERVICE_URL=http://localhost:4002 ORDER_SERVICE_URL=http://localhost:4003 node server.js
```

```bash
cd /Users/dashasin/Downloads/Web_project/frontend
ENABLE_HTTPS=true PORT=3443 API_GATEWAY_HTTPS_URL=https://localhost:4450 node server.js
```

### 3. Що сказати на захисті

- зовнішній трафік користувача захищається через HTTPS;
- TLS завершується на frontend і gateway рівні;
- внутрішня взаємодія між сервісами у демо виконується через HTTP для спрощення;
- у production-середовищі HTTPS можна поширити і на внутрішні сервіси через reverse proxy, ingress або service mesh.

## Повний HTTPS для всіх мікросервісів

Якщо потрібно показати HTTPS не тільки зовні, а й між сервісами, у цьому проєкті це теж підтримується. Для навчального демо використовується один локальний self-signed сертифікат для всіх сервісів.

### 1. Переконайся, що сертифікати вже створені

```bash
cd /Users/dashasin/Downloads/Web_project
mkdir -p certs
openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 365 \
  -keyout certs/localhost-key.pem \
  -out certs/localhost.pem \
  -subj "/CN=localhost"
```

### 2. Запусти всі внутрішні сервіси по HTTPS

Auth service:

```bash
cd /Users/dashasin/Downloads/Web_project/services/auth-service
ENABLE_HTTPS=true PORT=4101 node server.js
```

Product service:

```bash
cd /Users/dashasin/Downloads/Web_project/services/product-service
ENABLE_HTTPS=true PORT=4102 node server.js
```

Notification service:

```bash
cd /Users/dashasin/Downloads/Web_project/services/notification-service
ENABLE_HTTPS=true PORT=4104 node server.js
```

Order service:

```bash
cd /Users/dashasin/Downloads/Web_project/services/order-service
NODE_TLS_REJECT_UNAUTHORIZED=0 ENABLE_HTTPS=true PORT=4103 PRODUCT_SERVICE_URL=https://localhost:4102 NOTIFICATION_SERVICE_URL=https://localhost:4104 node server.js
```

### 3. Запусти API Gateway по HTTPS і направ його на HTTPS-сервіси

```bash
cd /Users/dashasin/Downloads/Web_project/api-gateway
NODE_TLS_REJECT_UNAUTHORIZED=0 ENABLE_HTTPS=true PORT=4450 AUTH_SERVICE_URL=https://localhost:4101 PRODUCT_SERVICE_URL=https://localhost:4102 ORDER_SERVICE_URL=https://localhost:4103 node server.js
```

### 4. Запусти frontend по HTTPS

```bash
cd /Users/dashasin/Downloads/Web_project/frontend
ENABLE_HTTPS=true PORT=3443 API_GATEWAY_HTTPS_URL=https://localhost:4450 node server.js
```

### 5. Відкрий застосунок

```text
https://localhost:3443
```

### 6. Чому використовується `NODE_TLS_REJECT_UNAUTHORIZED=0`

У демо застосовується self-signed certificate, тому Node.js за замовчуванням не довіряє таким HTTPS-з'єднанням між сервісами. Для навчального показу ми тимчасово вимикаємо перевірку довіри сертифіката в тих процесах, які звертаються до інших HTTPS-сервісів.

Для захисту можна сказати так:

- у навчальній версії використано self-signed сертифікати;
- для міжсервісної взаємодії тимчасово вимкнено strict TLS verification;
- у production-середовищі замість цього використовують довірений CA, внутрішню PKI, reverse proxy або service mesh.

## Основний сценарій демо

1. Користувач входить через `auth-service`
2. Frontend отримує товари через `api-gateway` з `product-service`
3. Користувач додає товари у кошик
4. Frontend надсилає замовлення в `order-service`
5. `order-service` перевіряє товари через `product-service`
6. `order-service` викликає `notification-service`
7. Користувач бачить підтвердження замовлення

## Що демонструє проєкт

- поділ системи на окремі бізнес-сервіси;
- єдину точку входу через API Gateway;
- міжсервісну взаємодію;
- незалежний запуск сервісів;
- просту основу для пояснення переваг мікросервісів на захисті.
