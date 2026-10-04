# Catering CLI

`npm run catering -- <command> [--json]`. Use `help` for the command list. Every read returns data from the database. `event E101` returns the full event with lines, dietary requirements, roster, packing, receipts, observations and notes.

## Date windows

Events, event-week, prep, shopping, dietary, dispatch, roster, profit and tax accept --from=YYYY-MM-DD and --to=YYYY-MM-DD, inclusive. The default is today through six days ahead. Deposit, balance, attention, enquiry, clash and compliance reads cover all loaded records. To close a past month, supply both dates. Cents are shown without rounding to whole dollars. Currency is held per event; catalogue prices are numeric defaults to be interpreted in your chosen business currency and do not convert currencies.

## Writes

`add <entity> --data=JSON` adds clients, events, menus, ingredients, recipes, lines, dietary, packing, roster, payments, food_logs or notes. `edit <entity> <id-or-name> --data=JSON` updates checked fields. Recipes require an exact UUID to edit. Other references accept an exact UUID, UUID prefix or case-insensitive name. Events also accept their unique code. Ambiguous matches print candidates and fail.

```bash
npm run catering -- add clients --data='{"name":"Example Organisation","email":"catering@example.test"}'
npm run catering -- add events --data='{"code":"E200","name":"Training lunch","client_id":"Example Organisation","event_date":"2026-11-12","guests":25,"currency":"NZD"}'
npm run catering -- add lines --data='{"event_id":"E200","name":"Buffet","category":"food","quantity":25,"unit_price_cents":3000,"unit_cost_cents":1200}'
npm run catering -- edit events E200 --data='{"status":"confirmed","deposit_due":"2026-11-01","deposit_cents":20000}'
npm run catering -- add payments --data='{"event_id":"E200","reference":"BANK-001","amount_cents":20000,"paid_on":"2026-11-01"}'
npm run catering -- log E200 --data='{"name":"Final numbers","body":"Operator confirmed 25 guests."}'
npm run catering -- add food_logs --data='{"event_id":"E200","name":"Cold salad","mode":"cold","temperature_c":4,"exposure_minutes":30,"observed_at":"2026-11-12T10:00:00Z","operator":"Recorded operator","jurisdiction":"AU"}'
```

Use the actual operator and event facts. POSIX shells accept the single-quoted JSON above. In PowerShell use its normal literal argument quoting for your installed Node version. No shell-specific utilities are needed by the scripts or tests.

Set each event tax_rate explicitly as a decimal, such as 0.15, after checking the applicable treatment. Default is zero. Tax is rounded once on the sum of rounded line amounts. Net and costs are rounded to cents per line. A null unit_cost_cents means unknown; a deliberate zero means recorded zero. line.menu_id links recipe and allergen information; line.name remains the quoted label. Staff and rental charges must be explicit lines, not inferred from the roster or packing count.

The five statuses are inquiry, tentative, confirmed, completed, cancelled. A dietary_reviewed flag records the operator's review, not a safety calculation. Reviewed dietary items can carry reviewed_by and reviewed_on. Roster timestamps must include a time zone. Service_time is free text for local delivery instructions.

Receipts, food_logs and notes are append-only in the CLI. Add a new observation with corrective_action and a note when correcting evidence. The base does not process refunds or rewrite a mistaken receipt; reconcile it with the responsible operator before changing the database under a reviewed migration.

Export with `export --out=<file>` or get the complete snapshot on stdout with `export --json`. Protect exports. Import details: docs/replace-better-cater.md. Run `draft-weekly` to write a draft from three real reads. No commands send email or place orders.
