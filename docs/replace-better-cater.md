# Replace Better Cater

Checked 4 October 2026. Better Cater's [reports guide](https://www.bettercater.com/help/reports-overview/) documents PDF downloads for kitchen production, shopping, profit and sales tax. Its [help centre](https://www.bettercater.com/help/) does not establish a standard event CSV export that we could verify this run. Do not promise a direct full-account export or treat our fixture as a vendor export.

1. Keep the account available while reconciling. Download the event documents and reports you need through Reports and the event's Create report drawer. Ask Better Cater support what structured event and client data they can supply. This software does not contact them.
2. Prepare a CSV from that supplied export or a checked transcription of event headers. Use ISO dates, an explicit currency and stable source event codes. Save the untouched source separately. Register clients with the CLI first. Map your headings using examples/better-cater-mapping.json.
3. Run a test import, then the same command without --dry-run:

```bash
npm run catering -- import better-cater --file=examples/better-cater-events.csv --mapping=examples/better-cater-mapping.json --dry-run
npm run catering -- import better-cater --file=examples/better-cater-events.csv --mapping=examples/better-cater-mapping.json
```

The one-command import accepts mapped event headers: event code, name, existing client, event date, guest count, status, currency and venue. Recognised statuses: inquiry, tentative, confirmed, completed, cancelled. Headers are case insensitive; quoted commas, newlines and a BOM work. The example is synthetic. Your actual export must be checked.

Reimporting identical headers does nothing. Conflicting values reject the whole file so local event edits are never silently replaced. Duplicate codes, unknown clients, invalid dates or guest counts roll back the import, including earlier valid rows.

Menus, recipes, line prices, deposits, receipts, dietary reviews, staffing, packing, files, signatures and email history do not transfer through this header importer. Add these through the documented record commands after mapping and reconcile totals with Better Cater. Imported events start without financial or safety evidence. A same-day switch depends on obtaining and validating the source data; it is not guaranteed.

Export every loaded record as JSON with `npm run catering -- export --out=backups/catering.json`. Keep protected backups outside the checkout. This export is a readable snapshot, not an automated restore service. Enterprise DNA maps the source export and brings the rest of the agreed history into a customised version.
