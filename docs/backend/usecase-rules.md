# UseCase Implementation Rules

## Overview

A UseCase is an orchestration layer that declaratively describes "what to execute and in what order."
Business logic is delegated to the Domain, and side effects are delegated to Infrastructure.

The ideal form of a UseCase is an implementation that **simply calls functions one by one from top to bottom**.

## Fundamental Principle: Sequential Execution from Top to Bottom

UseCase functions execute functions one by one from top to bottom.
Conditional branching is limited to early returns before or after domain functions, keeping nesting shallow.

### Good: Declarative Sequential Execution

```typescript
const createItem = async (input: CreateItemInput): Promise<Result<Item, AppError>> => {
  return await txManager.runTx(async (tx) => {
    // 1. Validation
    const validated = ItemInput.validate(input);
    if (!validated) {
      return Err(new AppError({ code: "VALIDATION_ERROR", message: "Invalid input" }));
    }

    // 2. Create domain object
    const item = Item.new(validated);

    // 3. Persist
    const saveResult = await itemRepository.from({ tx }).create(item);
    if (saveResult.err) return saveResult;

    return Ok(saveResult.val);
  });
};
```

### Bad: Multiple Conditional Branches Inside Loops

Implementations with multiple conditional branches or processing inside loops are a warning sign.
Extract them into domain functions and keep the UseCase flat.

```typescript
// Bad: Complex branching inside loops
const processItems = async (items: Item[]) => {
  for (const item of items) {
    if (item.status === "active") {
      if (item.type === "premium") {
        await handlePremium(item);
      } else {
        await handleStandard(item);
      }
    } else if (item.status === "pending") {
      await handlePending(item);
    }
  }
};

// Good: Delegate to Domain and keep UseCase flat
const processItems = async (items: Item[]) => {
  const grouped = Item.groupByAction(items);

  const premiumResult = await itemRepository.from({ tx }).bulkUpdate(grouped.premium);
  if (premiumResult.err) return premiumResult;

  const standardResult = await itemRepository.from({ tx }).bulkUpdate(grouped.standard);
  if (standardResult.err) return standardResult;

  return Ok(undefined);
};
```

## Prohibited Rules

### 1. Do Not Call UseCase from UseCase

Dependencies between UseCases create implicit coupling. Extract shared logic into Domain functions.

```typescript
// Bad: Calling UseCase from UseCase
const orderUseCase = OrderUseCase.from(deps);
const result = await orderUseCase.create(input); // UseCase -> UseCase

// Good: Extract shared logic to Domain
const order = Order.new(input);
const result = await orderRepository.from({ tx }).create(order);
```

### 2. Do Not Access Environment Variables Directly in UseCases

Environment dependencies are injected via the DI container. UseCases should focus purely on orchestration.

```typescript
// Bad: Directly referencing environment variables
const apiKey = process.env.API_KEY;

// Good: Inject via DI
type Dependencies = Readonly<{
  config: AppConfig; // Environment variables via config
  itemRepository: ItemRepository;
}>;
```

### 3. Do Not Directly Operate Message Queues or PubSub in UseCases

Side effects are executed through Infrastructure interfaces.

```typescript
// Bad: Direct publish
await pubsub.topic("items").publish(message);

// Good: Via interface
await messageQueue.publishItemCreated({ itemId });
```

## Documenting Idempotency

UseCase functions must explicitly document their idempotency with JSDoc.
This enables reviewers to provide idempotency-aware feedback.

```typescript
/**
 * Creates an item.
 *
 * @idempotent false - Calling multiple times with the same input creates duplicates
 */
const create = async (input: CreateItemInput): Promise<Result<Item, AppError>> => {
  // ...
};

/**
 * Updates the status of an item.
 *
 * @idempotent true - Calling multiple times with the same input produces the same result
 */
const updateStatus = async (input: UpdateStatusInput): Promise<Result<Item, AppError>> => {
  // ...
};
```

## Related Documents

- [Server Architecture](./server-architecture.md) - Overall layer structure
- [Function Documentation Conventions](./function-documentation.md) - How to write JSDoc
- [Domain Model](./domain-modeling.md) - Design guidelines for the Domain layer
