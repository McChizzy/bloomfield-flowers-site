# Request validation batch

This is a local review candidate built on the access-hardening commit, not a live deployment.

## Included

- Contact, coupon and checkout initiation accept only the expected object and field types. Malformed requests return HTTP 400 before database, payment or mail side effects.
- JSON requests have a 64 KiB application body cap, including actual streamed bytes and bodies already parsed by the hosting runtime. Oversized requests return HTTP 413. UTF-8 characters split across network chunks remain intact. Empty JSON streams keep the previous empty-object contract.
- Contact forms retain optional email, Instagram and custom-order fields. Names and messages must be nonblank. Existing field-length limits remain, optional emails are checked and single-line fields reject CR/LF.
- Coupon lookup requires a nonblank code up to 100 trimmed characters and a finite numeric subtotal between zero and one billion naira. Checkout still calculates the real discount against catalogue prices, not a supplied subtotal.
- Checkout requires bounded customer/delivery text, plausible email/phone values, a supported city, delivery or pickup, a real calendar date and a valid clock time. These last two fields are already required by the storefront form. This batch does not introduce a new booking-window or business-hour policy.
- City spelling aliases are canonicalised before pricing. Unknown delivery areas still use the existing delivery-fee-pending workflow. Pickup still does not require an address or area.
- Carts allow 1-100 lines and integer quantities of 1-100 per line. Unknown products, malformed quantities, unknown/duplicate add-ons and multiple choices from a single option group are rejected rather than silently ignored. Separate variants on different lines remain supported. Existing required-colour and city-availability checks still run.
- Server catalogue prices, add-on prices, delivery fees and discount calculations remain authoritative. Unknown customer/delivery fields and client-supplied item prices are not forwarded into payment metadata.

## Validation

Use the validated Node 24 environment:

```sh
npm test
npm run build
```

The unit/handler tests cover success and rejection paths with mocked gateway, database and mail dependencies. They include the existing access/signature/verification tests. No production credentials or real customer/provider calls are needed.

An optional browser runner submits the actual built storefront forms to the real local API handlers, with external services replaced by synthetic fixtures:

```sh
npm run build
node --experimental-test-module-mocks scripts/smoke-validation.mjs
```

The browser runner requires an available `playwright-core` installation and Chromium. If they are installed elsewhere, set `BLOOMFIELD_PLAYWRIGHT_MODULE` to that module's importable file URL and optionally `BLOOMFIELD_CHROMIUM_PATH` to its browser executable. They are not added as production dependencies. The runner binds only to loopback, blocks external browser requests and replaces payment/database/mail operations. It checks contact/custom-order submission, valid/invalid coupons, standard delivery, pickup balloons, pending delivery fees and visible invalid-cart errors on desktop and mobile.

## Rollout and deferred work

No new secret or database schema is required for this validation batch. The inherited health/cron deployment prerequisites in `docs/access-hardening.md` still apply before publishing the combined work. Reconcile the isolated commits against the current review branch and re-run tests before a separately approved deployment.

This does not complete durable rate limiting, live database RLS/grants, guest order ownership, payment amount/currency reconciliation, concurrent webhook replay protection, reliable notification delivery, pending-payment UI recovery or tracking consent. The duplicate-status-check draft in the original checkout is preserved but is not proof of concurrency-safe idempotency. No live database permissions, vendor settings or original draft files are changed by this batch.
