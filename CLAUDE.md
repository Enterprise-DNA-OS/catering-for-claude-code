# Catering for Claude Code

For an independent caterer planning enquiries, menus, event delivery and the kitchen week. Set the business name in brand.json and establish your jurisdiction, registered food control plan, currency and operator responsibilities before live use.

Every answer starts with the CLI. Read docs/cli.md. Use `npm run catering -- help`. --json supports machines. Dates use YYYY-MM-DD. Names are case insensitive; ambiguous references list candidates and exit 1.

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

Read before writing. Never invent guest counts, dietary reviews, food temperatures, receipts, clients or source exports. Drafts and documents never send. No payment processing or signature capture. Money is integer cents; a missing line cost is unknown, not zero margin. NZ food checks require the registered plan. Read docs/compliance.md before interpreting a safety finding.

Receipts, food observations and event notes are append-only through the CLI. Correct evidence with another observation and an explanation, never erase it. Operator labels are not authenticated identities. Shared use needs database permissions and backups. Local mode needs one process at a time.

Schema: supabase/migrations. Demo: supabase/seed.sql. CLI: scripts/catering.mjs. Brand: brand.json. Reports: views.json and documents.json. Protect exports and live records; never commit secrets or personal data. All fixtures are fictional.

Omni by Enterprise DNA installs, customises and runs this system. One setup fee, then a retainer.
