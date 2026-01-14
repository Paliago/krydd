# SST - React Router 7 (framework mode) - OpenAuth - Shadcn/ui - Template

A template to get started quickly with these technologies:

- SST
- React Router 7
- OpenAuth
- Hono
- Shadcn/ui
- Tailwind v4
- Conform
- Zod v3

## Specs

- Node.js 22

## Get started

1. Change the name of the project by running `bunx replace-in-file '/vision/g' 'YOUR_APP' '**/*.*' --verbose`
2. Change the emails that will be used to send login emails in the `infra/email.ts`
   1. (Optional) if you want to auth providers you need to define correct secrets in the `infra/secrets.ts`
3. `bun i`
4. Run `bun sst dev`
5. cd into `packages/scripts` and run `bun run upload-assets` to add public images

## Go to prod

Lots of things to do but most importantly:

1. Make you AWS SES production ready
2. Have real secrets for your auth providers
3. Set a proper domain on the resources `infra/router.ts` in particular

## Usage

This template uses [bun Workspaces](https://bun.sh/docs/install/workspaces) and [bun Catalogs](https://bun.sh/docs/install/catalogs). It has 4 packages to start with.

1. `core/`

   This is for any shared code. It's defined as modules. For example, there's the `Example` module.

   ```ts
   export module Example {
     export function hello() {
       return "Hello, world!";
     }
   }
   ```

   That you can use across other packages using.

   ```ts
   import { Example } from "@vision/core/example";

   Example.hello();
   ```

   We also have [Vitest](https://vitest.dev/) configured for testing this package with the `sst shell` CLI.

   ```bash
   bun test
   ```

2. `functions/`

   This packages has the Hono Lambda api and the OpenAuth issuer.

3. `scripts/`

   This is for any scripts that you can run on your SST app using the `sst shell` CLI and [`tsx`](https://www.npmjs.com/package/tsx). For example, you can run the asset upload script using:

   ```bash
   bun run shell src/upload-assets.ts
   ```

4. `web/`

   This is the React Router application. Using the OpenAuth for authentication and the functions backend api with tanstack query.

### Infrastructure

The `infra/` directory allows you to logically split the infrastructure of your app into separate files. This can be helpful as your app grows.

In the template, we have an `api.ts`, and `storage.ts`. These export the created resources. And are imported in the `sst.config.ts`.
