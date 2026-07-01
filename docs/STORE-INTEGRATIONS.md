# Store Integrations

Store integrations apply from `v1.6.0`.

simple-www keeps store entries usable without payment handling. Store entries can be product listings with optional external checkout handoff.

## Enable Checkout Links

Payment handoff is disabled by default:

```json
"site": {
  "storePaymentsEnabled": false
}
```

Set it to `true` to show `checkoutUrl` links on store entries:

```json
"site": {
  "storePaymentsEnabled": true
}
```

## Store Fields

Store entries support:

- `sku`
- `price`
- `link`
- `checkoutUrl`
- `paymentProvider`
- `paymentProviderProductId`
- `paymentProviderPriceId`

Example:

```md
---
title: Sticker pack
sku: STICKERS-001
price: 5 EUR
link: https://example.com/products/stickers
checkoutUrl: https://checkout.example.com/stickers
paymentProvider: external
paymentProviderProductId: prod_123
paymentProviderPriceId: price_123
---

Product description.
```

## Security Boundary

simple-www does not:

- collect card data
- process payments
- store payment tokens
- store customer billing details
- validate payment provider responses
- create orders
- manage refunds

The external checkout/payment provider is responsible for payment security, PCI requirements, customer data, receipts, taxes, fraud checks, refunds, and legal compliance.

Only public handoff metadata belongs in Markdown front matter. Do not store API keys, secrets, customer data, payment tokens, webhook secrets, or private provider credentials in content files or config.
