# AGENTS.md — Hedera Stablecoin Studio Plugin

**You are a coding agent working in a TypeScript repo that builds a Hedera Agent Kit plugin for Stablecoin Studio.**
Your main job is to add/modify tools under `src/tools/`, define/extend input schemas under `src/schemas/`, and export the plugin from `src/index.ts`.

---

## Project overview (for agents)

- This repository is a **Hedera Agent Kit plugin for Stablecoin Studio**. A plugin is a collection of **tools** (atomic actions) with:
  - a unique `method` identifier (e.g., `stablecoin.create_stablecoin`),
  - a human‑readable `name` and `description`,
  - a **Zod** `parameters` schema for inputs,
  - an async `execute(client, context, params)` handler.

- **Stablecoin Studio Integration**: Tools wrap the Stablecoin Studio SDK to enable:
  - Creating and managing stablecoins on Hedera
  - Role-based access control (ADMIN, CASHIN, BURN, etc.)
  - Compliance operations (KYC, freeze/unfreeze)
  - Treasury operations (mint, burn, wipe, transfer)
  - Reserve management and proof of reserve
  - Advanced features (holds/escrow, custom fees)

- Tools must **respect the Agent Mode**:
  - **AUTONOMOUS** — sign & submit to Hedera,
  - **RETURN_BYTES** — freeze & return the unsigned **transaction bytes**, do **not** submit.
    _This enables human‑in‑the‑loop flows; the kit encourages respecting mode in every transaction tool._

---

## Setup commands

> Agents: run these in a bash shell from the repo root.

- Install deps: `npm ci` (or `npm install`)
- Typecheck: `npm run typecheck` (`tsc --noEmit`)
- Lint: `npm run lint`
- Build: `npm run build` (via `tsup`)
- Format: `npm run format` (Prettier)
- Test: `npm run test` (runs examples/cli-chat.ts)

> **Node**: prefer Node 20+ for best TS/ESM support.

---

## Environment & secrets

Set credentials for local runs/tests:

```bash
export HEDERA_ACCOUNT_ID=0.0.xxxx
export HEDERA_PRIVATE_KEY=0x... # HEX-encoded ECDSA or ED25519
export NETWORK=testnet          # or mainnet
export OPENAI_API_KEY=sk-...    # For LangChain examples
```

See `.env.example` for the complete template.

---

## Plugin structure

- **43 tools** organized into 7 categories:
  1. **Lifecycle** (6 tools): create, update, pause, delete stablecoins
  2. **Access Control** (7 tools): grant/revoke roles, manage allowances
  3. **Compliance** (5 tools): KYC management, freeze/unfreeze accounts
  4. **Treasury** (6 tools): cash-in, burn, wipe, transfer, rescue
  5. **Reserve** (2 tools): get/update reserve amounts
  6. **Advanced** (6 tools): holds (escrow), custom fees
  7. **Query** (5 tools): balances, capabilities, associations

- **Schemas** in `src/schemas/`: One schema file per category + common atoms
- **Services** in `src/service/`: Stablecoin SDK integration layer
- **Utils** in `src/utils/`: Decimal conversions, mirror node URLs, constants

---

## Tool implementation guidelines

Every tool follows the template pattern:

1. **Tool constant**: Exported for referencing (e.g., `export const CREATE_STABLECOIN_TOOL = 'stablecoin.create_stablecoin';`)
2. **Prompt generator**: Uses `PromptGenerator` from hedera-agent-kit
3. **Schema reference**: Imports from `@/schemas/`
4. **Tool factory**: Default export function accepting `Context`
5. **SDK integration**: Calls Stablecoin Studio SDK methods
6. **Error handling**: Returns `{ raw, humanMessage }` format

See `src/tools/AGENTS.md` for detailed tool implementation instructions.

---

## Schema guidelines

- One schema file per tool category (e.g., `lifecycle.schema.ts`)
- Import common atoms from `@/schemas/atoms` (accountIdSchema, tokenIdSchema, etc.)
- Every field must have `.describe()` for self-documentation
- Schema factories accept Context: `(context: Context) => ZodSchema`
- Export types using `z.infer`

See `src/schemas/AGENTS.md` for detailed schema instructions.

---

## Quality bar

- Every parameter in Zod must have `.describe()` for self-documentation
- Error messages should be single-sentence and actionable
- Prefer return values over throwing in `execute`; agents consume `humanMessage`
- Use `PromptGenerator` utilities for consistent tool descriptions
- Use path aliases (`@/`) for clean imports
- For transactions: Use appropriate Stablecoin Studio SDK methods
- For queries: Return structured data with human-readable messages

---

## References

- Hedera Agent Kit: https://github.com/hashgraph/hedera-agent-kit-js
- Stablecoin Studio: https://github.com/hashgraph/stablecoin-studio
- Template Plugin: https://github.com/hashgraph/template-hedera-agent-kit-plugin
- Product Requirements: See `.windsurf/PRD.md` for complete specifications
