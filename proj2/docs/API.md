# Hungry Wolf API Documentation

This document describes the REST API endpoints for the Hungry Wolf application.

## Base URL

- Development: `http://localhost:5001/api`
- Production: `https://your-domain.com/api`

## Authentication (M1 trust layer)

`POST /auth/register` and `POST /auth/login` return a JWT. Send it on protected
routes as:

```
Authorization: Bearer <token>
```

The server reads the caller's id and role from the token (`req.user`). Any
`riderId` / `customerId` still sent in a body must match the token, or the
request is refused with 403. Tokens expire after 7 days. Passwords are stored
as bcrypt hashes.

| Status | Meaning on a protected route |
|---|---|
| 401 | No token, or the token is malformed, expired or not signed by this server |
| 403 | Valid token, but wrong role, or not your order / account |
| 409 | The order is not in a state that allows this action (e.g. delivering twice) |

Routes marked **Auth: required (M1)** below enforce this. Routes without that
line do not check a token yet.

## Endpoints

### Authentication

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "customer|restaurant|delivery",
  "profile": {
    "name": "John Doe",
    "phone": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "City",
      "state": "State",
      "zipCode": "12345"
    }
  }
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": { ... },
  "token": "<jwt>"
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": { ... },
  "token": "<jwt>"
}
```

Wrong email or password: `401 { "error": "Invalid credentials" }`.

#### GET /auth/me
The logged-in user, from the token.

**Auth:** required (M1)

**Response:** `{ "user": { ... } }`

#### GET /auth/profile
Get current user profile.

**Headers:** Authorization required

**Response:**
```json
{
  "user": { ... }
}
```

#### PUT /auth/profile
Update user profile.

**Headers:** Authorization required

**Request Body:**
```json
{
  "profile": {
    "name": "Updated Name",
    "phone": "+1234567890"
  }
}
```

### Orders

#### POST /orders
Create a new order (Customer only).

**Headers:** Authorization required

**Request Body:**
```json
{
  "restaurantId": "restaurant-id",
  "items": [
    {
      "menuItemId": "item-id",
      "quantity": 2,
      "price": 12.99
    }
  ],
  "totalAmount": 25.98,
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "City",
    "state": "State",
    "zipCode": "12345"
  },
  "specialInstructions": "Extra spicy"
}
```

#### GET /orders/customer
Get customer orders.

**Headers:** Authorization required

**Response:**
```json
{
  "orders": [
    {
      "id": "order-id",
      "status": "pending",
      "totalAmount": 25.98,
      "createdAt": "2024-01-01T00:00:00Z",
      "items": [...]
    }
  ]
}
```

#### GET /orders/restaurant
Get restaurant orders.

**Headers:** Authorization required

#### GET /orders/delivery
Get delivery partner orders.

**Headers:** Authorization required

#### GET /orders/:id
Get specific order by ID.

**Headers:** Authorization required

#### PUT /orders/:id/status
Move an order along the kitchen workflow.

**Auth:** required (M1), role `restaurant`, and the order's `restaurantId` must be the caller.

**Request Body:**
```json
{
  "status": "confirmed|preparing|ready|cancelled"
}
```

Allowed moves (`src/orders/statusTransitions.js`): `pending → confirmed|preparing|cancelled`,
`confirmed → preparing|cancelled`, `preparing → ready|cancelled`, `ready → cancelled`.
Anything else → 409. `out_for_delivery` and `delivered` → 400: only the assigned
rider sets those, through `/delivery/accept` and `/delivery/deliver`.

#### POST /orders/:id/rate
Add rating to order.

**Headers:** Authorization required

**Request Body:**
```json
{
  "ratings": {
    "restaurant": 5,
    "delivery": 4
  }
}
```

### Points

#### GET /points
Get user points.

**Headers:** Authorization required

**Response:**
```json
{
  "points": {
    "totalPoints": 150,
    "availablePoints": 100,
    "usedPoints": 50,
    "transactions": [...]
  }
}
```

#### GET /points/transactions
Get points transaction history.

**Headers:** Authorization required

**Query Parameters:**
- `limit` (optional): Number of transactions to return (default: 10)

#### POST /points/use
Spend the logged-in customer's points for a discount (1 point = $0.01).

**Auth:** required (M1), role `customer`. Runs in a Firestore transaction, so
concurrent requests can't spend the same balance twice.

**Request Body:**
```json
{
  "points": 50,
  "description": "Discount for order"
}
```

Errors: 400 insufficient balance (`availablePoints`, `requestedPoints` in the body), 404 no points record.

**Earning points:** when an order is delivered the customer earns
`floor(10% × totalAmount)` points, or 15% if the restaurant's profile has
`isLocalLegend: true` (`src/points/computePoints.js`). A $50 order earns 5 points.

#### POST /points/calculate-discount
Calculate discount amount for points.

**Headers:** Authorization required

**Request Body:**
```json
{
  "points": 50
}
```

**Response:**
```json
{
  "discountAmount": 0.50,
  "maxDiscount": 1.00
}
```

### Customer

#### GET /customer/restaurants
Get available restaurants.

**Headers:** Authorization required

**Response:**
```json
{
  "restaurants": [
    {
      "id": "restaurant-id",
      "name": "Pizza Palace",
      "cuisine": "Italian",
      "rating": 4.5,
      "deliveryTime": "25-35 min",
      "isLocalLegend": false,
      "menu": [...]
    }
  ]
}
```

### Restaurant

#### GET /restaurant/profile
Get restaurant profile.

**Headers:** Authorization required

#### PUT /restaurant/profile
Update restaurant profile.

**Headers:** Authorization required

#### PUT /restaurant/menu
Update restaurant menu.

**Headers:** Authorization required

**Request Body:**
```json
{
  "menu": [
    {
      "id": "item-id",
      "name": "Margherita Pizza",
      "price": 12.99,
      "description": "Classic tomato and mozzarella"
    }
  ]
}
```

### Delivery

The four routes below act as the logged-in delivery partner.
**Auth:** required (M1), role `delivery`. No `riderId` is needed in the body.

| Route | Rule | Errors |
|---|---|---|
| `POST /delivery/accept/:orderId` | Claims a `ready`, unassigned order atomically | 404, 409 already assigned, 400 not ready / you already have an active order |
| `POST /delivery/pickup/:orderId` | Records `pickedUpAt`; assigned partner only | 404, 403, 409 not out for delivery |
| `POST /delivery/reject/:orderId` | Releases your claim back to `ready` | 404, 403, 409 |
| `POST /delivery/deliver/:orderId` | Marks delivered, pays you `deliveryFee + tipAmount`, awards the customer's points. Exactly once. | 404, 403 not your order, 409 already delivered |

#### GET /delivery/profile
Get delivery partner profile.

**Headers:** Authorization required

#### PUT /delivery/profile
Update delivery partner profile.

**Headers:** Authorization required

### Donations

#### GET /donations/stats
Get donation statistics.

**Response:**
```json
{
  "totalOrders": 150,
  "mealsDonated": 15,
  "nextDonationIn": 5
}
```

#### ~~POST /donations/update~~ (removed in M1)
Removed in #75 (decided in #36). It let any caller bump the stored donation counter by any
amount, and nothing used it. Donated meals are derived in `GET /donations/stats`. Calls now return 404.

#### POST /donations/record
Record a donation entry.

**Auth:** required (M1). Stores `recordedBy` = the caller's id.

**Request Body:** `{ "amount": 1, "description": "Meal donation" }`

#### GET /donations/history
Get donation history.

**Response:**
```json
{
  "history": [
    {
      "id": "donation-id",
      "amount": 1,
      "description": "Meal donation",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Users

#### GET /users/:id
Get a user by id.

#### PUT /users/:id
Update your own `profile` and/or `location`.

**Auth:** required (M1); `:id` must be the caller (403 otherwise). Any other
body field (`role`, `password`, `totalEarnings`, …) is ignored.

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "error": "Access denied. Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "error": "Order not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Something went wrong!",
  "message": "Detailed error message in development"
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse. Current limits:

- Authentication endpoints: 5 requests per minute per IP
- Other endpoints: 100 requests per minute per user

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response Headers:**
- `X-Total-Count`: Total number of items
- `X-Page`: Current page number
- `X-Per-Page`: Items per page

## Webhooks

The API supports webhooks for real-time updates:

- Order status changes
- New order notifications
- Payment confirmations

Configure webhooks in your account settings.

## SDKs

Official SDKs are available for:

- JavaScript/Node.js
- Python
- PHP
- Java

See the [SDK documentation](./SDK.md) for more information.

## Support

For API support:

- Email: api-support@hungrywolf.com
- Documentation: https://docs.hungrywolf.com
- Status Page: https://status.hungrywolf.com
