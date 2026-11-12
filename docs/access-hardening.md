# Access-boundary batch

This batch is a local review candidate, not a production configuration change.

## Included

- `/api/health` and `/api/keep-alive` accept GET only and require independent Bearer secrets. Missing configuration, missing/incorrect credentials, duplicate Authorization headers and query-string-only credentials fail before database access.
- Configure `HEALTHCHECK_SECRET` for health checks and `CRON_SECRET` for Vercel's scheduled keep-alive request. They must be different, independently generated values stored in protected environment settings, not source control. Vercel sends `Authorization: Bearer <CRON_SECRET>` when the cron secret is configured.
- Authenticated healthy database checks return HTTP 200. Missing/unavailable database configuration or a failed query returns HTTP 503. Responses do not expose database error details or configuration flags. All responses are `Cache-Control: no-store`.
- `/api/checkout/verify` continues accepting the existing `transaction_ref` and legacy `reference` query parameters. It returns only `transaction_ref` and a recognised `transaction_status`. Customer/gateway metadata and raw gateway failure messages are not returned. It adds bounded reference validation and rejects a mismatched gateway reference.
- Valid provider confirmations still work when the optional database is absent or its status update fails. This preserves existing checkout behaviour. The draft mandatory order-existence lookup was not retained because checkout initiation currently allows database persistence to fail without preventing payment. Order existence alone would also not establish caller ownership.
- Webhook HMAC comparison is timing-safe and rejects malformed signatures without throwing. Lowercase/uppercase hexadecimal signatures and string/Buffer bodies remain supported.

## Required before publishing these endpoint changes

1. Set separate random `HEALTHCHECK_SECRET` and `CRON_SECRET` values in the intended preview environment. Do not copy production payment/database secrets into test fixtures.
2. Update any health-check client to send `Authorization: Bearer <HEALTHCHECK_SECRET>`. The previous query-string key and payment-key suffix are intentionally no longer accepted.
3. Verify preview cron and health success/failure cases against the intended database. Confirm HTTP 503 is treated as failure by the monitoring client.
4. When production rollout is separately approved, coordinate production environment settings and monitor header changes first. Do not publish this fail-closed cron route without `CRON_SECRET`: the scheduled database keep-alive would return 403.
5. No keys have been generated, stored, rotated or changed by this code batch. No live database calls, policy changes, payment submissions or customer email sends are part of local validation.

## Tests

Use Node 24.21 or the project's validated Node 24 environment:

```sh
npm ci
npm test
npm run build
```

`npm test` uses Node's built-in test runner with experimental module mocking. The flag is test-only; runtime code does not depend on the mocking API or a new package. Tests replace the database/gateway with synthetic fixtures and cover denied access before DB calls, method handling, healthy/unavailable states, response redaction, existing checkout response compatibility, optional database failures, malformed gateway responses and valid/tampered webhook signatures. They do not certify the live provider integration.

## Explicitly not complete

- Order-scoped guest verification authorisation: requires coordinated token issuance during checkout, browser return handling and appropriate database state. The current transaction reference is not claimed to prove ownership.
- Live database RLS/grants review or changes, including privileged functions.
- Amount/currency reconciliation, webhook replay/idempotency and notification reliability.
- Strict checkout/cart payload validation and durable rate limiting.
- Pending/unknown payment UI recovery and optional-tracking consent.
- Database backup/restore, vendor monitoring/billing controls and dependency updates.
- Workspace backup exclusions: the earlier website credential/logging commit is not proof that the separate backup jobs were changed.

These remain separate tracked tasks. This batch must not be described as completing all urgent or high-priority safeguards.
