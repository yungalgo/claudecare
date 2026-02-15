# Drizzle ORM Documentation

## Overview
Drizzle ORM is a lightweight TypeScript ORM. "A headless TypeScript ORM with a head."

## Key Characteristics

**Design Philosophy:**
Drizzle functions as a library rather than a framework. Users construct projects *with* it rather than *around* it, maintaining flexibility over project structure.

**Core Features:**
- Zero dependencies
- Serverless-ready by design
- SQL-like and relational query APIs
- TypeScript-first schema definition
- Automatic migration generation
- Automatic camelCase <-> snake_case mapping via `casing: "snake_case"` option

**Dual Query Paradigms:**
Users can access data through either SQL-like queries or a relational API. The relational approach handles nested data fetching while consistently generating a single SQL query.

## Database Support
PostgreSQL, MySQL, SQLite, and SingleStore.

## References
- https://orm.drizzle.team/docs/overview
- https://orm.drizzle.team/docs/get-started/postgresql-new
- https://orm.drizzle.team/docs/column-types/pg
- https://orm.drizzle.team/docs/select
- https://orm.drizzle.team/docs/insert
- https://orm.drizzle.team/docs/update
- https://orm.drizzle.team/docs/delete
- https://orm.drizzle.team/docs/kit-overview
