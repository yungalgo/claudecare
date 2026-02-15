# pg-boss: PostgreSQL Job Queue for Node.js

## Overview
pg-boss is a job queuing system for Node.js using PostgreSQL as its foundation.

## Key Features
- **Exactly-once delivery**: Jobs execute precisely once
- **Transaction safety**: Jobs can be created within existing database transactions
- **Cron scheduling**: Built-in cron scheduling functionality
- **Advanced queue management**: Priority queues, dead letter queues, auto retries with exponential backoff
- **Pub/sub messaging**: Fan-out queue relationships
- **SQL flexibility**: Non-Node.js runtimes can access via SQL

## Technical Foundation
Uses Postgres's SKIP LOCKED for message queue record locking.

## Requirements
- Node.js 22.12 or higher
- PostgreSQL 13 or higher

## Usage

```typescript
import PgBoss from 'pg-boss';

const boss = new PgBoss(process.env.DATABASE_URL);
await boss.start();

// Schedule a cron job
await boss.schedule('my-job', '0 9 * * *');

// Register a worker
await boss.work('my-job', async (job) => {
  console.log(job.data);
});

// Send a job
await boss.send('my-job', { key: 'value' });
```

## References
- https://github.com/timgit/pg-boss
