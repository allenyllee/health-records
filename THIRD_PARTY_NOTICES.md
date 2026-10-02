# Third-party notices

This source repository includes the following third-party source portions. Their existing licenses and copyright notices remain applicable. This notice does not select a license for independently authored application code or relicense npm dependencies.

## OpenAI Sites

Copyright (c) 2026 OpenAI. Licensed under the MIT License; the full notice is preserved in [licenses/OpenAI-Sites-MIT.txt](licenses/OpenAI-Sites-MIT.txt).

Official upstream: https://github.com/openai/sites

Reviewed upstream revision: `7eb9d4b9cf93ad7e64aebc8a5ca70e29ec2cfb94`

Included source portions:

- `app/chatgpt-auth.ts`, from [the authentication template](https://github.com/openai/sites/blob/7eb9d4b9cf93ad7e64aebc8a5ca70e29ec2cfb94/packages/create-sites/templates/addons/auth/app/chatgpt-auth.ts). Local changes are formatting/quote style
- `build/sites-vite-plugin.ts`, derived from [the Sites Vite plugin](https://github.com/openai/sites/blob/7eb9d4b9cf93ad7e64aebc8a5ca70e29ec2cfb94/packages/sites-vite-plugin/src/index.ts). The vendoring header identifies package version 0.2.0. Local changes add a `mockAuth` option and an early return when mock authentication is disabled, plus formatting and provenance comments. The adjacent `build/sites-vite-plugin.LICENSE` is also retained
- `lib/utils.ts`, corresponding to [the shadcn template helper](https://github.com/openai/sites/blob/7eb9d4b9cf93ad7e64aebc8a5ca70e29ec2cfb94/packages/create-sites/templates/addons/shadcn/lib/utils.ts). Local changes add an explicit string return type and formatting

Official license: https://github.com/openai/sites/blob/7eb9d4b9cf93ad7e64aebc8a5ca70e29ec2cfb94/LICENSE

## shadcn/ui

Copyright (c) 2023 shadcn. Licensed under the MIT License; the full notice is preserved in [licenses/shadcn-MIT.txt](licenses/shadcn-MIT.txt).

Official upstream: https://github.com/shadcn-ui/ui

Reviewed upstream revision: `d75a96ab781f3d659be1ad287347d5887ce9f2fc`

Included source portions:

- `components/ui/button.tsx`, from [button.tsx](https://github.com/shadcn-ui/ui/blob/d75a96ab781f3d659be1ad287347d5887ce9f2fc/apps/v4/registry/new-york-v4/ui/button.tsx)
- `components/ui/dialog.tsx`, from [dialog.tsx](https://github.com/shadcn-ui/ui/blob/d75a96ab781f3d659be1ad287347d5887ce9f2fc/apps/v4/registry/new-york-v4/ui/dialog.tsx)
- `components/ui/table.tsx`, from [table.tsx](https://github.com/shadcn-ui/ui/blob/d75a96ab781f3d659be1ad287347d5887ce9f2fc/apps/v4/registry/new-york-v4/ui/table.tsx)
- `components/ui/tabs.tsx`, from [tabs.tsx](https://github.com/shadcn-ui/ui/blob/d75a96ab781f3d659be1ad287347d5887ce9f2fc/apps/v4/registry/new-york-v4/ui/tabs.tsx)
- The shadcn-style `cn` utility in `lib/utils.ts` is also acknowledged under this notice

Local UI changes adapt `cn` and component imports to project-local paths and reorder imports/whitespace. Component implementations otherwise match the reviewed upstream source.

Official license: https://github.com/shadcn-ui/ui/blob/d75a96ab781f3d659be1ad287347d5887ce9f2fc/LICENSE.md

## npm dependencies

Dependencies listed in package.json and package-lock.json retain their own licenses. This source-only repository does not bundle node_modules or prebuilt native dependencies. Anyone distributing an installed application, client/server bundle, container or native binaries must preserve the applicable dependency notices and meet any source-access or relinking obligations for the material actually distributed. An application-level license does not replace third-party terms.
