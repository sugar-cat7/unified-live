# Server Architecture

## Overview

The server is designed based on the principles of **Clean Architecture** and **Domain-Driven Design (DDD)**.
It adopts the Hexagonal Architecture (Ports & Adapters) pattern to separate business logic from external systems.

## Directory Structure

```
services/api/
├── domain/              # Domain layer - Business logic
├── usecase/             # UseCase layer - Application logic
├── infra/               # Infrastructure layer - Connections to external systems
│   ├── di/              # Dependency injection container
│   ├── repository/      # Data access layer
│   ├── http/            # HTTP/REST API
│   ├── ai/              # AI service integration
│   ├── external/        # External API integration
│   └── auth/            # Authentication
├── cmd/                 # Entry point
└── pkg/                 # Shared utilities
```

## Layer Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     HTTP Handlers                            │
│                   (Hono + OpenAPI)                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Use Case Layer                            │
│                (Application logic)                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Domain Layer                              │
│                 (Business logic)                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                 Infrastructure Layer                         │
│     (Repository, AI Service, Message Queue, etc.)           │
└─────────────────────────────────────────────────────────────┘
```

## Design Principles

### 1. Dependency Inversion Principle (DIP)

- Upper layers do not depend on lower layers
- Depend on abstractions (type definitions), not on concrete implementations
- The domain layer does not depend on any other layer

```typescript
// UseCase depends on Repository types (abstractions)
type Dependencies = Readonly<{
  itemRepository: ItemRepository;  // Type definition
  txManager: TxManager;
}>;

// Concrete implementations are injected via the DI container
const itemUseCase = ItemUseCase.from({
  itemRepository: ItemRepository,  // Implementation
  txManager: TxManager,
});
```

### 2. Error Handling with Result Type

Instead of using `try-catch`, all errors are expressed with the `Result<T, E>` type.

```typescript
// Result type definition
type Result<T, E extends BaseError> = OkResult<T> | ErrResult<E>;

// Usage example
const itemResult = await itemRepository.from({ tx }).getById(itemId);
if (itemResult.err) {
  return itemResult;  // Propagate the error
}
const item = itemResult.val;  // Value on success
```

**Benefits:**
- Error flow is explicit
- The type system enforces error handling
- Unexpected exceptions are less likely

### 3. Zod Schema First

All type definitions are derived from Zod schemas.

```typescript
// The schema is the source of truth for types
const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  // ...
});

// Types are inferred from schemas
type Item = z.infer<typeof itemSchema>;
```

### 4. Immutable Updates

Domain objects are immutable, and update operations return new objects.

```typescript
// Update the current user and return a new user
const updatedUser = Item.update(item, { name: "New name" });
const completedTask = Item.archive(item);
```

---

## Domain Layer

### Aggregates

Adopts the DDD aggregate pattern to group related entities.

```
domain/
├── [your-domain]/           # Application-specific aggregate
│   ├── [aggregate-root].ts  # Aggregate root
│   ├── [entity].ts          # Child entity
│   └── [value-object].ts    # Value object
└── [reference-data].ts     # Reference data (master data, etc.)
```

### Companion Object Pattern

Domain models have factory methods and business logic in a companion object of the same name.

```typescript
// Type definition
const itemSchema = z.object({ ... });
export type Item = z.infer<typeof itemSchema>;

// Companion object (domain logic)
export const Item = {
  new: (props: CreateUserProps): User => { ... },
  update: (user: User, props: UpdateProps): User => { ... },
  recordLogin: (user: User): User => { ... },
} as const;
```

### Discriminated Union

Value objects with complex states are expressed using Discriminated Unions.

```typescript
// ItemStatus varies by status
type ActiveItem = {
  status: "active";
  publishedAt: Date;
  viewCount: number;
  // ...
};

type ArchivedItem = {
  status: "archived";
  archivedAt: Date;
  // ...
};

type DraftItem = {
  status: "draft";
  lastEditedAt: Date;
  // ...
};

type ItemStatus = ActiveItem | ArchivedItem | DraftItem;

// Type guards
export const ItemStatus = {
  isActive: (item: ItemStatus): item is ActiveItem =>
    item.status === "active",
  isArchived: (item: ItemStatus): item is ArchivedItem =>
    item.status === "archived",
} as const;
```

---

## UseCase Layer

For detailed implementation rules, see [UseCase Implementation Rules](./usecase-rules.md).

### Dependency Injection via Factory Pattern

```typescript
type Dependencies = Readonly<{
  itemRepository: ItemRepository;
  txManager: TxManager;
}>;

type ItemUseCaseType = Readonly<{
  from: (deps: Dependencies) => Readonly<{
    getById: (input: GetItemInput) => Promise<Result<Item, AppError>>;
    update: (input: UpdateItemInput) => Promise<Result<Item, AppError>>;
  }>;
}>;

export const ItemUseCase = {
  from: ({ orderRepository, txManager }: Dependencies) => ({
    getById: async ({ itemId }) => {
      return await txManager.runTx(async (tx) => {
        return await itemRepository.from({ tx }).getById(itemId);
      });
    },
    // ...
  }),
} as const satisfies ItemUseCaseType;
```

### Transaction Management

All database operations are wrapped in a transaction using `txManager.runTx()`.

```typescript
return await txManager.runTx(async (tx) => {
  // Multiple repository operations execute within the same transaction
  const itemRepo = itemRepository.from({ tx });
  const orderRepo = itemRepository.from({ tx });

  const itemResult = await itemRepo.complete(task);
  if (itemResult.err) return taskResult;

  const itemResult = await orderRepo.incrementCount(user);
  if (itemResult.err) return itemResult;

  return Ok(result);
});
```

### Orchestration of Composite Operations

UseCases coordinate multiple domain operations and repository operations.

```typescript
// OrderUseCase.completeTask
return await txManager.runTx(async (tx) => {
  // 1. Update task to completed state
  const completedTask = Item.archive(item);
  await itemRepo.update(completedTask);

  // 2. Increment user's usage count
  const updatedUser = User.incrementCount(user);
  await orderRepo.update(updatedUser);

  // 3. Create a placeholder for the result
  const pendingResult = Result.createPending({ taskId });
  await resultRepo.create(pendingResult);

  // 4. Publish an async processing task
  await messageQueue.publishProcessingTask({ taskId, resultId });

  return Ok(result);
});
```

---

## Infrastructure Layer

### Repository Pattern

Repositories receive transactions via the factory pattern.

```typescript
type Dependencies = Readonly<{ tx: Transaction }>;

export type ItemRepository = Readonly<{
  from: (deps: Dependencies) => Readonly<{
    create: (item: Item) => Promise<Result<Item, AppError>>;
    getById: (id: string) => Promise<Result<Item, AppError>>;
    update: (item: Item) => Promise<Result<Item, AppError>>;
    delete: (id: string) => Promise<Result<Item, AppError>>;
  }>;
}>;
```

### Method Naming Convention for Repository and UseCase

Use **primitive, short method names** when the context makes the operation self-evident.

#### Principle

Since the repository/usecase is already scoped to a specific domain (e.g., `OrderRepository`, `ItemUseCase`), method names should not redundantly include the domain name.

#### Good Examples

```typescript
// OrderRepository - domain context is clear
export type OrderRepository = Readonly<{
  from: (deps: Dependencies) => Readonly<{
    create: (feedback: Feedback) => Promise<Result<Feedback, AppError>>;
    getById: (id: string) => Promise<Result<Feedback, AppError>>;
    update: (feedback: Feedback) => Promise<Result<Feedback, AppError>>;  // Not "updateFeedback"
    delete: (id: string) => Promise<Result<void, AppError>>;
  }>;
}>;

// ItemUseCase - domain context is clear
const ItemUseCase = {
  from: (deps: Dependencies) => ({
    getById: async (userId: string) => { ... },  // Not "getById"
    update: async (user: User) => { ... },       // Not "update"
    delete: async (userId: string) => { ... },   // Not "deleteUser"
  }),
};
```

#### Bad Examples

```typescript
// Redundant - "Feedback" is already in the repository name
OrderRepository.updateFeedback(feedback);
OrderRepository.getFeedbackById(id);
OrderRepository.deleteFeedback(id);

// Redundant - "User" is already in the usecase name
ItemUseCase.getById(id);
ItemUseCase.update(user);
```

#### Exceptions

When methods operate on **related but different entities**, include the entity name for clarity:

```typescript
// OrderRepository may also manage LineItems
export type OrderRepository = Readonly<{
  from: (deps: Dependencies) => Readonly<{
    getById: (id: string) => Promise<Result<Order, AppError>>;
    update: (order: Order) => Promise<Result<Order, AppError>>;
    // LineItems are related entities - include name for clarity
    getLineItemsByOrderId: (orderId: string) => Promise<Result<LineItem[], AppError>>;
    saveLineItems: (orderId: string, items: LineItem[]) => Promise<Result<void, AppError>>;
  }>;
}>;
```

#### Standard CRUD Method Names

| Operation | Method Name | Parameters |
|-----------|-------------|------------|
| Create | `create` | Domain object |
| Read by ID | `getById` | ID string |
| Read multiple | `list`, `getAll`, `findBy*` | Query params |
| Update | `update` | Domain object |
| Delete | `delete` | ID string |
| Check existence | `exists` | ID string |

#### Anti-pattern: Mixing Multiple Domains in One Repository

Do NOT combine multiple domain entities into a single repository. This forces redundant method names and violates single responsibility.

```typescript
// Bad - Multiple domains in one repository forces verbose naming
export type BillingRepository = Readonly<{
  from: (deps: Dependencies) => Readonly<{
    createSubscription: (subscription: Subscription) => Promise<...>;
    updateSubscription: (subscription: Subscription) => Promise<...>;
    createPaymentHistory: (payment: PaymentHistory) => Promise<...>;
    getPaymentHistoryByUserId: (userId: string) => Promise<...>;
  }>;
}>;

// Good - Separate repositories with clean naming
export type SubscriptionRepository = Readonly<{
  from: (deps: Dependencies) => Readonly<{
    create: (subscription: Subscription) => Promise<...>;
    update: (subscription: Subscription) => Promise<...>;
    getByUserId: (userId: string) => Promise<...>;
  }>;
}>;

export type PaymentHistoryRepository = Readonly<{
  from: (deps: Dependencies) => Readonly<{
    create: (payment: PaymentHistory) => Promise<...>;
    getByUserId: (userId: string, limit?: number) => Promise<...>;
  }>;
}>;
```

### Leveraging drizzle-zod Schemas

Use schemas generated by drizzle-zod as DTOs for DB-to-domain conversion.

```typescript
import { selectHighlightsSchema } from "./mysql/schema";

// Use drizzle-zod schema directly
return Ok(selectItemsSchema.parse(result.val[0]));

// Also use for aggregate child entities
const toTaskAggregate = (task, steps) => ({
  ...task,
  steps: steps.map((row) => selectStepsSchema.parse(row)),
});
```

### Avoiding the N+1 Problem

Fetch multiple related entities in bulk and group them on the client side.

```typescript
// Good: Bulk retrieval
const taskIds = tasks.map((t) => t.id);
const stepsResult = await tx
  .select()
  .from(stepsTable)
  .where(inArray(stepsTable.taskId, taskIds));

// Grouping
const stepsByTaskId = new Map<string, SelectStep[]>();
for (const step of stepsResult.val) {
  const existing = stepsByTaskId.get(step.taskId) ?? [];
  existing.push(step);
  stepsByTaskId.set(step.taskId, existing);
}

// Bad: N+1 queries
for (const task of tasks) {
  const steps = await tx
    .select()
    .from(stepsTable)
    .where(eq(stepsTable.taskId, task.id));
}
```

### Aggregate Persistence

Atomically save the aggregate root and its child entities.

```typescript
saveAggregate: async (task: Task) => {
  // 1. Update the task header
  await tx.update(tasksTable)
    .set({ status: task.status, ... })
    .where(eq(tasksTable.id, task.id));

  // 2. Delete existing steps
  await tx.delete(stepsTable)
    .where(eq(stepsTable.taskId, task.id));

  // 3. Insert new steps
  if (task.steps.length > 0) {
    await tx.insert(stepsTable)
      .values(task.steps.map(step => ({ ... })));
  }

  return Ok(task);
}
```

---

## Dependency Injection (DI)

### Manual Factory-Based DI

Build the container manually without external DI frameworks.

```typescript
// infra/di/container.ts
export const createContainer = (): Container => {
  // 1. Instantiate infrastructure layer
  const txManager = TxManager;
  const orderRepository = UserRepository;
  const orderRepository = OrderRepository;

  // 2. Instantiate use case layer (inject dependencies)
  const itemUseCase = ItemUseCase.from({
    orderRepository,
    txManager,
  });

  const orderUseCase = OrderUseCase.from({
    itemRepository,
    txManager,
  });

  // 3. Return the container
  return {
    userUseCase,
    orderUseCase,
    // ...
  };
};
```

### Injection via Hono Middleware

```typescript
// Inject the container per HTTP request
app.use("*", async (c, next) => {
  const container = createContainer();
  c.set("container", container);
  await next();
});

// Use in handlers
app.openapi(route, async (c) => {
  const container = c.get("container");
  const result = await container.userUseCase.getById({ itemId });
  // ...
});
```

---

## Error Handling

### AppError

```typescript
class AppError extends BaseError {
  constructor(params: {
    message: string;
    code: ErrorCode;
    cause?: unknown;
    context?: Record<string, unknown>;
  }) { ... }
}

// Error codes
type ErrorCode =
  | "NOT_FOUND"
  | "NOT_UNIQUE"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INTERNAL_SERVER_ERROR";
```

### wrap Utility

Converts a Promise to a Result type.

```typescript
const result = await wrap(
  tx.select().from(itemsTable).where(eq(itemsTable.id, id)).limit(1),
  (err) => new AppError({
    message: "Failed to get item",
    code: "INTERNAL_SERVER_ERROR",
    cause: err,
  }),
);
```

### HTTP Error Handling

A global error handler converts AppError to HTTP responses.

```typescript
// Mapping from error codes to HTTP status
const statusMap: Record<ErrorCode, number> = {
  NOT_FOUND: 404,
  NOT_UNIQUE: 409,
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  INTERNAL_SERVER_ERROR: 500,
};

// Response format
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "requestId": "req_abc123"
  }
}
```

---

## External Service Integration

### AI Service

```typescript
// infra/ai/contentGenerator.ts
export const ContentGenerator = {
  generate: async (params: GenerateParams): Promise<Result<ContentOutput, AppError>> => {
    // 1. Build prompt
    const prompt = buildPrompt(params);

    // 2. Call AI service API
    const response = await aiClient.generateContent(prompt);

    // 3. Parse and validate response
    const parsed = contentOutputSchema.safeParse(response);
    if (!parsed.success) {
      return Err(new AppError({ ... }));
    }

    // 4. Convert to domain objects
    const items = ContentItem.fromAIOutput(parsed.data);
    return Ok({ items, ... });
  },
};
```

### Message Queue

Use a message queue for asynchronous processing.

```typescript
// Publish a task
await messageQueue.publishProcessingTask({
  itemId,
  requestId,
});

// Subscribe in a worker
await messageQueue.subscribe(async (message) => {
  const task = processingTaskSchema.parse(message.data);
  await contentGenerator.generate(task);
  message.ack();
});
```

---

## Testing Strategy

### Tests by Layer

| Layer | Test Target | Approach |
|---------|-----------|-----------|
| Domain | Business logic | Pure unit tests |
| UseCase | Orchestration | Use mock repositories |
| Repository | Data access | Use a test DB |
| HTTP | API endpoints | Integration tests |

### Mocking Dependencies

The factory pattern allows swapping dependencies during testing.

```typescript
const mockItemRepository = {
  from: () => ({
    getById: async () => Ok(mockItem),
    update: async (item) => Ok(item),
  }),
};

const useCase = ItemUseCase.from({
  orderRepository: mockItemRepository,
  txManager: mockTxManager,
});
```

---

## Summary

Key characteristics of this architecture:

1. **Clear layer separation**: Clear responsibilities for Domain/UseCase/Infrastructure
2. **Type safety**: Complete type inference through Zod schemas and TypeScript
3. **Error handling**: Explicit error flow with the Result type
4. **Testability**: Dependency swapping through the factory pattern
5. **Transaction management**: Guaranteed atomicity of multiple operations
6. **Immutable updates**: Predictable state management
7. **Aggregate pattern**: Clear consistency boundaries
