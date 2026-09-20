# learning-path
Learning Path is an LLM-powered App that helps chart out a learning path for a given learning objective, tracks progress, sends reminders leading to a successful closure.

## Project structure

- `client/` - React frontend powered by Vite and TypeScript
- `src/` - Express API powered by TypeScript
- No database layer is configured; learning paths are generated on demand via the LLM API

## Getting started

Requirements: Node.js 20 or newer and npm 10 or newer.

Install all workspace dependencies from the repository root:

```bash
npm install
```

Run the frontend and backend together:

```bash
npm run dev
```

The Vite app is available at `http://localhost:5173` and proxies `/api` requests to the Express server at `http://localhost:3000`.

Build both workspaces:

```bash
npm run build
```

Run type checks without emitting files:

```bash
npm run typecheck
```

The server port can be changed by setting `PORT`, for example with the values in `.env.example`.
