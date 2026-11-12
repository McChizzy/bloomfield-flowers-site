# Unconfirmed payment recovery

This local-only batch follows the request-validation commit. It changes the customer return screen, not gateway charging, database schema, webhook processing or order fulfilment.

## Behaviour

- The initial heading says payment is being checked, not that the order is already confirmed.
- Only a recognised successful result with the requested transaction reference confirms the payment, clears the cart/draft and sends the existing purchase tracking events.
- Pending results keep the existing bounded polling. After the polling budget is exhausted, the screen stays unconfirmed and retains the cart, draft and cached payment link. It tells the customer not to pay again yet and offers a manual check button.
- Unknown, malformed or mismatched results cannot trigger a confirmed-success screen or purchase tracking. Missing status stays pending. A verification/network error also preserves the cached checkout rather than encouraging another payment attempt.
- The manual check button is hidden while checking and can recover an unclear/error result without losing the order details.
- Explicit failed or abandoned results retain the existing cart-preserving behaviour and remove the known failed checkout link so a later intentional retry remains possible.
- An old asynchronous verification response cannot clear a cart after its return-page DOM has been replaced by navigation.

## Validation

`npm test` includes pure payment-state tests covering known/unknown statuses, malformed responses and mismatched references. `npm run build` validates the changed frontend bundle.

The optional runner described in `docs/request-validation.md` checks real local handler responses and the built return screen. Tests cover success, exhausted pending polls, unknown provider states, verification errors, manual recovery, failed/abandoned payments and a deliberately mismatched successful response. They check saved cart/draft state and absence of Meta/GA purchase events for unconfirmed results. External browser requests, payment requests, database calls and mail are mocked or blocked.

## Not claimed

This does not establish payment amount/currency reconciliation, guest ownership, durable webhook deduplication, live provider compatibility or optional-tracking consent. Existing purchase tracking remains unchanged for actual confirmed success; consent gating is a separate task. No deployment, vendor setting, database policy or live customer action is part of this batch.
