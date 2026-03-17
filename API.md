# API Documentation - AI Expense Tracker

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints (except `/auth/register` and `/auth/login`) require a valid NextAuth.js session.

---

## 🔐 Authentication Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword123"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Login User
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response: 200 OK
{
  "success": true
}
```

---

## 💰 Expense Endpoints

### Get All Expenses
```
GET /expenses
Query Parameters:
  - categoryId: string (optional)
  - status: string (optional) - DRAFT | SAVED | CATEGORIZED | TAGGED | EDITED | DELETED
  - limit: number (default: 50)
  - offset: number (default: 0)

Response: 200 OK
{
  "success": true,
  "data": {
    "expenses": [
      {
        "id": "exp-1",
        "userId": "user-id",
        "categoryId": "cat-id",
        "name": "Grocery",
        "description": "Weekly groceries",
        "amount": "45.50",
        "expenseDate": "2024-03-17T10:00:00Z",
        "location": "Whole Foods",
        "isBillable": false,
        "status": "SAVED",
        "createdAt": "2024-03-17T10:00:00Z",
        "category": { "id": "cat-id", "name": "Food", "color": "#FF6B6B" },
        "tags": [
          { "tag": { "id": "tag-1", "name": "Weekly", "color": "#4ECDC4" } }
        ]
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

### Create Expense
```
POST /expenses
Content-Type: application/json

{
  "name": "Grocery Shopping",
  "description": "Weekly groceries",
  "amount": 45.50,
  "expenseDate": "2024-03-17T10:00:00Z",
  "categoryId": "cat-id",
  "location": "Whole Foods",
  "isBillable": false
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": "exp-1",
    "name": "Grocery Shopping",
    "amount": "45.50",
    "status": "DRAFT",
    ...
  }
}
```

### Get Specific Expense
```
GET /expenses/:id

Response: 200 OK
{
  "success": true,
  "data": { ... }
}
```

### Update Expense
```
PUT /expenses/:id
Content-Type: application/json

{
  "name": "Updated Expense",
  "amount": 50.00,
  ...
}

Response: 200 OK
{
  "success": true,
  "data": { ... }
}
```

### Delete Expense
```
DELETE /expenses/:id

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "Expense deleted successfully"
  }
}
```

---

## 📁 Category Endpoints

### Get All Categories
```
GET /categories

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "cat-1",
      "userId": "user-id",
      "name": "Food",
      "icon": "🍔",
      "color": "#FF6B6B",
      "monthlyBudget": "500.00",
      "currentMonthSpent": "245.30",
      "createdAt": "2024-03-01T00:00:00Z"
    }
  ]
}
```

### Create Category
```
POST /categories
Content-Type: application/json

{
  "name": "Food & Dining",
  "icon": "🍔",
  "color": "#FF6B6B",
  "monthlyBudget": 500.00
}

Response: 201 Created
{
  "success": true,
  "data": { ... }
}
```

### Get Specific Category
```
GET /categories/:id

Response: 200 OK
{
  "success": true,
  "data": { ... }
}
```

### Update Category
```
PUT /categories/:id
Content-Type: application/json

{
  "name": "Food",
  "color": "#FF6B6B",
  "monthlyBudget": 600.00
}

Response: 200 OK
{
  "success": true,
  "data": { ... }
}
```

### Delete Category
```
DELETE /categories/:id

Response: 200 OK
{
  "success": true,
  "data": { ... }
}
```

---

## 🏷️ Tag Endpoints

### Get All Tags
```
GET /tags

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "tag-1",
      "userId": "user-id",
      "name": "Work",
      "color": "#4ECDC4",
      "createdAt": "2024-03-01T00:00:00Z"
    }
  ]
}
```

### Create Tag
```
POST /tags
Content-Type: application/json

{
  "name": "Work",
  "color": "#4ECDC4"
}

Response: 201 Created
{
  "success": true,
  "data": { ... }
}
```

### Update Tag
```
PUT /tags/:id
Content-Type: application/json

{
  "name": "Work-Related",
  "color": "#4ECDC4"
}

Response: 200 OK
{
  "success": true,
  "data": { ... }
}
```

### Delete Tag
```
DELETE /tags/:id

Response: 200 OK
{
  "success": true,
  "data": { ... }
}
```

---

## 🤖 AI Endpoints

### Get AI Category Suggestion
```
POST /ai/categorize
Content-Type: application/json

{
  "expenseName": "Starbucks Coffee",
  "description": "Morning coffee",
  "categoryId": "optional-existing-category-id"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "suggestedCategory": "Food & Dining",
    "categoryId": "cat-1",
    "confidence": 0.95
  }
}
```

### Get Budget Summary with AI
```
GET /ai/summary
Query Parameters:
  - month: number (1-12, default: current)
  - year: number (default: current)

Response: 200 OK
{
  "success": true,
  "data": {
    "summary": "You spent $1,245 this month...",
    "totalSpent": 1245.50,
    "expenses": [
      {
        "name": "Coffee",
        "amount": 45.50,
        "category": "Food & Dining"
      }
    ]
  }
}
```

---

## 💳 Budget Endpoints

### Get Budget Alerts
```
GET /budget/alerts

Response: 200 OK
{
  "success": true,
  "data": {
    "alerts": [
      {
        "categoryId": "cat-1",
        "categoryName": "Food",
        "budget": 500.00,
        "spent": 425.50,
        "percentageSpent": 85.1,
        "severity": "warning"
      }
    ],
    "hasAlerts": true
  }
}
```

---

## 📊 Export Endpoints

### Export Expenses to CSV
```
GET /export/csv
Query Parameters:
  - categoryId: string (optional)
  - startDate: ISO string (optional)
  - endDate: ISO string (optional)

Response: 200 OK
Content-Type: text/csv

Date,Name,Category,Amount,Description,Location,Billable,Status,Tags
2024-03-17,Coffee,Food & Dining,5.50,Morning coffee,Starbucks,No,SAVED,Work
...
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "An unexpected error occurred"
}
```

---

## Status Codes Reference

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding for production deployment.

---

## Validation Rules

### Expense
- `name`: Required, string, 1-100 characters
- `amount`: Required, positive number
- `expenseDate`: Required, valid date
- `categoryId`: Required, must exist
- `description`: Optional, string
- `location`: Optional, string
- `isBillable`: Optional, boolean

### Category
- `name`: Required, string, 1+ characters
- `color`: Required, hex color format (#RRGGBB)
- `monthlyBudget`: Optional, non-negative number

### Tag
- `name`: Required, 1-50 characters
- `color`: Required, hex color format (#RRGGBB)

---

## Authentication Notes

- Sessions are managed by NextAuth.js
- Credentials (email/password) are validated against database
- Passwords are hashed with bcryptjs
- Each user can only access their own data
- Session tokens are secure HTTP-only cookies

---

## Data Security

- All user data is isolated by user ID
- Passwords are never returned in responses
- API enforces user ownership checks
- Environment variables protect sensitive keys
- Database supports multi-tenancy through user isolation

