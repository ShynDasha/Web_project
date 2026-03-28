# MicroStore Demo

Демонстраційний вебзастосунок інтернет-магазину на основі мікросервісної архітектури.

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
