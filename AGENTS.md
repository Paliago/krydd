# Agent Guidelines for Vision Project

## Build/Test/Lint Commands

- `bun run build` - Build the React Router application
- `bun run dev` - Start development server
- `bun sst dev` - Start development server with full AWS resources (use this only to generate for instance the resources to link to)
- `bun run start` - Start production server
- `bun run typecheck` - Run TypeScript type checking (includes React Router typegen)
- No test framework configured - check with user before adding tests
- No lint command configured - check with user before adding linting

## Code Style Guidelines

- **Framework**: React Router v7 with TypeScript, Tailwind CSS
- **Imports**: Use named imports, group by external/internal, React Router types from `+types/` files
- **Components**: Export default for route components, named exports for utilities
- **Types**: Use TypeScript strictly, leverage React Router's `Route` namespace for route types
- **Naming**: PascalCase for components, camelCase for functions/variables, kebab-case for files
- **Error Handling**: Use React Router's `ErrorBoundary` pattern with `isRouteErrorResponse`
- **Styling**: Tailwind CSS classes, responsive design with dark mode support
- **File Structure**: Routes in `app/routes/`, components in feature folders, types auto-generated
- **JSX**: Use double quotes for HTML attributes, self-closing tags where appropriate
- **Functions**: Arrow functions for components, regular functions for route exports (meta, links, etc.)

## SST Resource Linking

Use SST's resource linking instead of process.env or import.meta.env for server-side resources:

```typescript
// sst.config.ts
new sst.aws.Function("MyFunction", {
  handler: "src/lambda.handler",
  link: [storage],
});

// src/lambda.ts
import { Resource } from "sst";
console.log(Resource.MyStorage.domain);
```

