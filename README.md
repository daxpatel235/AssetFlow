# AssetFlow

AssetFlow is a comprehensive Enterprise Asset and Resource Management platform. It provides organizations with total visibility into their hardware inventory, resource allocations, facility bookings, and maintenance lifecycles.

## Architecture

This project is built using a modern full-stack web architecture. It leverages a centralized, relational PostgreSQL database to ensure data integrity across complex asset allocation and maintenance workflows.

### Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14 | React framework with Server Components and App Router. |
| **Language** | TypeScript | Strongly typed JavaScript for end-to-end type safety. |
| **Styling** | Tailwind CSS | Utility-first CSS framework for custom, responsive design. |
| **State Management** | Zustand | Fast, un-opinionated state management for complex UI interactions. |
| **Database ORM** | Prisma | Next-generation Node.js and TypeScript ORM. |
| **Database Engine** | PostgreSQL | Robust relational database for strict schema enforcement. |

## Core Modules

1. **Asset Registry:** Track the lifecycle of physical assets including laptops, vehicles, and specialized equipment from acquisition to disposal.
2. **Resource Booking:** A calendar-based system for reserving shared spaces like conference rooms and AV equipment.
3. **Maintenance & Repairs:** A ticketing system to report hardware issues, assign technicians, and track repair costs.
4. **Compliance Auditing:** Perform location-based audits (with integrated QR scanning support) to identify missing or misplaced assets.

## Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL running locally

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/daxpatel235/AssetFlow.git
   cd AssetFlow/web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the `web` directory with your local database URL:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/assetflow?schema=public"
   JWT_SECRET="your-jwt-secret"
   ```

4. **Initialize Database**
   Push the Prisma schema to PostgreSQL and run the seed script to populate mock data:
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000` to view the application.

## Testing

The project includes both unit tests and end-to-end (E2E) browser testing.

- **Run unit tests (Vitest):** `npm run test`
- **Run E2E tests (Playwright):** `npm run test:e2e`
