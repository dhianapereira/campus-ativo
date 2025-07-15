# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run start:dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Run tests**: `npm run test`
- **Run tests with coverage**: `npm run test:cov`
- **Run E2E tests**: `npm run test:e2e`
- **Database setup**: `docker compose up -d` (starts PostgreSQL container)
- **Generate Prisma client**: `npx prisma generate`
- **Run database migrations**: `npx prisma migrate dev`

## Architecture Overview

This is a NestJS backend application for IFAL Campus Arapiraca's maintenance problem reporting system. The architecture follows Domain-Driven Design (DDD) principles with clean architecture patterns.

### Core Architecture Layers

**Core Layer** (`src/core/`):
- Contains foundational building blocks: entities, aggregate roots, value objects
- Either monad for error handling
- Repository interfaces and pagination patterns
- Domain-agnostic utilities

**Domain Layer** (`src/domain/`):
- **Accounts**: User authentication and authorization (reporters, managers, directors)
- **Maintenance Problems**: Core business logic for problem reporting and management
- Each domain has `application/` (use cases, repositories) and `enterprise/` (entities, value objects)

**Infrastructure Layer** (`src/infra/`):
- **Database**: Prisma ORM with PostgreSQL, mappers, and repository implementations
- **HTTP**: NestJS controllers, validation pipes, presenters
- **Auth**: JWT authentication, guards, decorators
- **Cryptography**: BCrypt password hashing, JWT token generation

### Key Domain Concepts

**Problem Management Flow**:
1. Reporters create problems with title, description, location, and category
2. Problems have status progression: TO_ANALYSIS → IN_ANALYSIS → ACCEPTED/REJECTED → IN_PROGRESS → FINISHED
3. Problems can be PREVENTIVE or CORRECTIVE maintenance types
4. Attachments can be associated with problems

**User Roles**:
- REPORTER: Creates and reports problems
- MANAGER: Manages problem workflow
- DIRECTOR: Oversight and approval

### Database Schema

Uses Prisma with PostgreSQL. Key models:
- `User` (with role-based access)
- `Problem` (with status workflow)
- `Location` (problem locations)
- `Category` (problem categories)
- `Attachment` (problem attachments)

### Testing Strategy

- Unit tests: Vitest for use cases and domain logic
- E2E tests: Vitest with supertest for API endpoints
- Test files follow `.spec.ts` and `.e2e-spec.ts` naming conventions
- In-memory repositories in `test/repositories/` for unit testing
- Factories in `test/factories/` for test data generation

### Environment Setup

Requires Docker for PostgreSQL database. Environment variables should be configured based on `.env.example`.