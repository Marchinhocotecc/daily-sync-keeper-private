# Daily Sync Keeper

Daily Sync Keeper is a personal assistant application designed to help users manage their tasks, events, and reminders efficiently. It features offline-first reactive stores, AI-powered suggestions, and cross-platform notifications.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Pages](#pages)
4. [Architecture](#architecture)
5. [Environment Setup](#environment-setup)
6. [Testing](#testing)
7. [Development](#development)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Daily Sync Keeper is built with React, TypeScript, and Capacitor. It integrates with Supabase for data storage and synchronization, and it leverages AI to provide actionable suggestions based on user data.

---

## Features

### AI Assistant
- **API Surface**: The module at `src/services/ai_assistant/index.ts` provides an isolated API for an on-device AI helper.
- **Key Methods**:
  - `suggestImprovements()`: Analyzes local data (e.g., todos, calendar) and proposes actions.
  - Each suggestion includes an `apply()` handler for execution.
- **Integration**: Calendar writes are injected via the constructor context.

### Offline-first Reactive Stores
- **Event Bus**: `src/lib/eventBus.ts` handles common events.
- **Persistent Storage**: Managed via Capacitor Preferences with JSON helpers (`src/services/storage.ts`).
- **Reactive Stores**: `src/lib/supabase.ts` includes `todosStore` and `calendarStore`.
- **Sync Manager**: `src/services/sync.ts` debounces and retries persistence and remote syncs.

### Notifications
- **Local Notifications**: Cross-platform support via `src/services/notifications.ts`.
- **Advanced Reminders**:
  - Per-user preferences for notifications.
  - Timed reminders for todos and events.
  - Background delivery via Service Worker (`sw.js`).

### Authentication
- Lightweight local authentication in `src/services/auth.ts`.
- Session management with cross-tab synchronization.

---

## Pages

### Home Page (`src/pages/HomePage.tsx`)
- Displays an overview of tasks, events, and reminders.
- Provides quick access to key features like adding todos or viewing the calendar.

### Assistente Page (`src/pages/AssistentePage.tsx`)
- Renders AI-generated suggestions.
- Allows users to apply or dismiss suggestions.

### Todos Page (`src/pages/TodosPage.tsx`)
- Lists all tasks with filtering and sorting options.
- Supports adding, editing, and deleting todos.

### Calendar Page (`src/pages/CalendarPage.tsx`)
- Displays events in a calendar view.
- Allows users to add, edit, and delete events.

### Settings Page (`src/pages/SettingsPage.tsx`)
- Provides options to configure notification preferences, lead times, and other app settings.

### Notifications Page (`src/pages/NotificationsPage.tsx`)
- Shows upcoming reminders and high-priority tasks.
- Allows users to manage notification settings.

---

## Architecture

### Global State
- Managed via a single `GlobalStateProvider` (React Context + reducer) at `src/state/global/GlobalStateProvider.tsx`.
- Slices include:
  - `auth`
  - `todos`
  - `calendar`
  - `expenses`
  - `wellness`

### Adding a New Slice
1. Extend `GlobalState` in `store.ts`.
2. Add actions to the `Action` union.
3. Handle actions in the `rootReducer`.
4. Add action creators to `GlobalStateProvider.tsx`.
5. (Optional) Create a slice hook.

### Persistence
- State is serialized to `localStorage` (`GLOBAL_STATE_V1`).
- Replaceable storage layer for flexibility.

---

## Environment Setup

1. Copy `.env.example` to `.env` and fill in the required keys.
2. For local development, create `.env.local`:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```

3. Restart the dev server after making changes to `.env` files.

---

## Testing

- Unit tests are located in `src/__tests__/`.
- Example: `src/services/__tests__/notifications.spec.ts` tests notification logic.

---

## Development

1. Install dependencies:
   ```
   npm install
   ```
2. Start the development server:
   ```
   npm run dev
   ```

3. Validate environment configuration:
   ```
   npm run check:env
   ```

---

## Troubleshooting

### Supabase Configuration
If you encounter issues with Supabase:
1. Verify `.env.local` contains valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. Restart the dev server:
   ```
   npm run dev
   ```

3. Test connectivity:
   ```
   npx tsx scripts/verify-supabase-config.ts
   ```

### Notifications
- Ensure notification permissions are granted.
- Verify Service Worker registration for background reminders.

---

For further assistance, refer to the code comments and documentation within the project.
