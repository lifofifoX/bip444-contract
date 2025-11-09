# BIP 444 UASF Speculation

Simple script for speculating on [BIP 444](https://github.com/bitcoin/bips/pull/2017) UASF activation by creating a 2-of-2 multisig between two parties and pre-signing mutually exclusive settlement paths.

Inspired by [BIP-444-Futures](https://github.com/Rob1Ham/BIP-444-Futures) by [Rob Hamilton](https://x.com/Rob1Ham).

## Quick overview

`FOR` expects BIP 444 to activate; `AGAINST` expects it will not.

Three transactions:

* Funding TX
* `FOR` settlement valid at height `934865 + 1440`, roughly ~10 days after the activation height
* `AGAINST` settlement valid at height `934865`, uses large `OP_RETURN` that becomes invalid upon activation

## Setup

Set `FOR_BIP_PUBKEY`, `AGAINST_BIP_PUBKEY`, `FOR_BIP_AMOUNT`, `AGAINST_BIP_AMOUNT` in `bip_444_prediction.mjs`

Then:

```bash
npm install
node bip_444_prediction.mjs
```

### Sign PSBTs

1. Both parties sign and exchange the two settlement PSBTs (2-of-2). Use [psbt.io](https://psbt.io/) if using Xverse or Unisat.
2. Both parties sign and broadcast the funding PSBT.

### Settle

- Store the fully signed settlement TXs.
- If no activation: `AGAINST` broadcasts at `934865`. Must do it before `934865 + 1440`.
- If activation: `FOR` broadcasts at `934865 + 1440` or later.

## Disclaimer

⚠️ This is for educational purposes only. NFA. DYOR.