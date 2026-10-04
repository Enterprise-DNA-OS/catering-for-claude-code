# Catering for Claude Code

Events, menus, kitchen prep, dispatch and deposits in a database you own. Built by Enterprise DNA. MIT licence. Works with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free code. Install and operate it. Hosting and agent costs are yours. | Your menus, fields, food control plan checks and Better Cater data mapping. [Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=better-cater&utm_medium=github). | Installed, connected and operated through Omni by Enterprise DNA. One setup fee, then a retainer. [See the offer](https://enterprisedna.co/omni/instead-of/better-cater). |

## Quick start

```bash
git clone https://github.com/Enterprise-DNA-OS/catering-for-claude-code.git
cd catering-for-claude-code
npm install
npm run demo
npm test
npm run view
npm run docs
```

Node 20 or newer. PGlite runs locally without a database server. Set DATABASE_URL in the environment for shared Postgres, then npm run migrate. Local mode needs one process at a time. Use separate demo and live databases. Shared use requires permissions, backups and operator identity integration.

The fictional demo includes four events, two menu items, an overdue deposit, a stale enquiry, a missing hire cost, partially packed carriers and food safety records needing review. Dates stay relative to the day the seed first runs. Seeding again does not duplicate or overwrite records.

## Weekly catering work

| Job | Recipe |
|---|---|
| /clients | .claude/commands/clients.md |
| /menus | .claude/commands/menus.md |
| /recipes | .claude/commands/recipes.md |
| /event-week | .claude/commands/event-week.md |
| /enquiries | .claude/commands/enquiries.md |
| /event | .claude/commands/event.md |
| /kitchen-prep | .claude/commands/kitchen-prep.md |
| /shopping-list | .claude/commands/shopping-list.md |
| /dietary-check | .claude/commands/dietary-check.md |
| /dispatch | .claude/commands/dispatch.md |
| /crew-roster | .claude/commands/crew-roster.md |
| /deposits-due | .claude/commands/deposits-due.md |
| /balances | .claude/commands/balances.md |
| /event-profit | .claude/commands/event-profit.md |
| /attention | .claude/commands/attention.md |
| /compliance | .claude/commands/compliance.md |
| /weekly-review | .claude/commands/weekly-review.md |
| /draft-weekly | .claude/commands/draft-weekly.md |
| /add | .claude/commands/add.md |
| /edit | .claude/commands/edit.md |
| /log | .claude/commands/log.md |
| /import | .claude/commands/import.md |
| /export | .claude/commands/export.md |
| /documents | .claude/commands/documents.md |
| /customise | .claude/commands/customise.md |
| /new-view | .claude/commands/new-view.md |

The weekly rituals are enquiry follow-up, final dietary counts, kitchen prep, dispatch and deposit chasing. One CLI supports human output and --json. [CLI guide](docs/cli.md) covers writes, dates and money.

## Ten questions across your records

Better Cater already offers production, shopping and profit reports. These are questions the free version answers today; we have not established that Better Cater cannot answer them.

1. Which near-term events combine an overdue deposit and an unfinished dietary review? (`attention`)
2. Which enquiries have gone quiet for more than a week? (`enquiries`)
3. Which events lack cost evidence, so their margin is unknown? (`profit`)
4. How many portions of each dish must the kitchen prepare for each confirmed event? (`prep`)
5. Which mapped ingredients are needed across this week's events? (`shopping`)
6. Which confirmed food lines have no recipe in the buying list? (`recipe-gaps`)
7. Which carriers or utensils remain unpacked, and who owns them? (`dispatch`)
8. Which crew members have overlapping assignments? (`clashes`)
9. Which food records exceed cooling limits or lack temperature evidence? (`compliance`)
10. Which completed events still have a balance outstanding? (`balances`)

## Paperwork and views

`npm run docs` writes six document types: banquet event orders, kitchen sheets, packing lists, proposals, balance statements and food-safety records. Every document is a draft. `npm run view` renders a read-only week dashboard from the same database. Edit brand.json for the business name, colours and logo. No frontend, payment handling, signatures or sending.

Recipe amounts are per portion in each ingredient's recorded unit. Shopping includes mapped recipes only, not stock deductions or automatic substitutions. Quoted line prices and costs are snapshots. Missing line costs suppress margin. The tax view summarises completed events in a selected period; it is an event-date planning aid, not a tax return or cash-basis report. Currencies are never added together.

## Food safety

/compliance screens recorded Australian holding, exposure and cooling evidence against cited FSANZ guidance. NZ records require review against the registered food control plan. Missing evidence remains visible. It is not certification or a declaration that food is safe. [Scope and sources](docs/compliance.md).

## Your first hour: ten things to ask for

1. Put our name and logo on the kitchen sheet.
2. Add our usual delivery instructions.
3. Record our menu and ingredient units.
4. Add our event captain field.
5. Map the headings in our supplied Better Cater data.
6. Group deposits by event captain.
7. Add a linen return checklist.
8. Add the checks in our registered food control plan.
9. Show tomorrow's dietary instructions on the prep sheet.
10. Draft Monday's handover from bookings, attention and prep.

/customise backs up the records, writes a numbered migration and tests the affected workflows. /new-view adds a read-only dashboard. [What screens provide](docs/why-no-front-end.md).

## Bring your history

The [Better Cater switch guide](docs/replace-better-cater.md) distinguishes the vendor's documented PDF reports from our mapped CSV importer. Once event headers are prepared and clients matched, import them in one command. The fixture is synthetic; no verified standard Better Cater CSV layout was found. Financial lines, receipts, menus, safety history, documents and signatures need separate mapping and reconciliation.

```bash
npm run catering -- import better-cater --file=examples/better-cater-events.csv --dry-run
npm run catering -- export --out=backups/catering.json
```

## Verification

`npm test` uses a disposable database and output directory. It checks calculations, missing-cost handling, food-rule boundaries, import rollback and idempotence, ambiguous references, exports, every CLI read and write path, and all document types. CI runs Linux and Windows plus Postgres. Local test results are distinct from hosted CI results.

MIT. Copyright 2026 Enterprise DNA.
