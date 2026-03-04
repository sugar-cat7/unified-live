# REST API Design Principles

## Overview

This document defines the RESTful design principles for the API.

## Design Principles

### 1. Resource-Oriented URLs

URLs represent resources (nouns), and operations (verbs) are expressed using HTTP methods.

```
# Good
GET    /items                # Get item list
POST   /items                # Create item
GET    /items/{id}           # Get item
PUT    /items/{id}           # Update item
DELETE /items/{id}           # Delete item

# Bad
GET    /getItems
POST   /createItem
GET    /users/me/home       # "home" is not a resource
```

### 2. HTTP Methods

| Method | Description | Idempotent | Safe |
|---------|------|-------|-------|
| GET    | Retrieve resource | Yes | Yes |
| POST   | Create resource, execute action | No | No |
| PUT    | Update resource (including partial updates) | Yes | No |
| DELETE | Delete resource | Yes | No |

**Note**: PATCH is not used. For partial updates, send the entire domain model via PUT and let the server calculate the diff.

### 3. Resource Naming Conventions

- **Use plural forms**: `/items`, `/users`, `/orders`
- **Use snake_case**: `/api_tokens`, `/user_settings` (do not use hyphens)
- **Nest up to 2 levels deep**: `/orders/{id}/items` (OK), `/orders/{id}/items/{itemId}/comments` (avoid)
- **Resource identifiers as path parameters**: `/items/{id}`
- **Filtering via query parameters**: `/items?status=completed&limit=10`

### 4. Filtering, Sorting, and Pagination

Use query parameters.

```
# Filtering
GET /items?status=completed
GET /orders?user_id={userId}

# Sorting
GET /items?sort=-created_at        # Descending
GET /items?sort=created_at         # Ascending

# Pagination
GET /items?limit=20&offset=0
GET /items?cursor={lastId}         # Cursor-based
```

### 5. Current User Resources

Use `/me` for current user resources, but always tie it to a specific resource.

```
# Good
GET  /me                    # Current user info
GET  /me/settings           # User settings
PUT  /me/settings           # Update user settings

# Bad
GET  /users/me/home         # "home" is not a resource
GET  /users/me/history      # "history" is not a resource
```

### 6. Sub-resources vs Query Parameters

Use sub-resources for strong associations and query parameters for weak associations.

```
# Strong association (sub-resource)
GET  /orders/{id}/items
GET  /orders/{id}/summary
POST /orders/{id}/items

# Weak association (query parameter)
GET  /reports?order_id={id}
GET  /notifications?user_id={id}
```

### 7. Actions on Resources

Actions (state transitions) are expressed as explicit sub-resources.

```
# Good - Sub-resource representing a state
POST /orders/{id}/completion       # Complete an order
```
