# BIP 444 UASF Speculation

This repository contains a very simple script for speculating on BIP 444 UASF activation by creating a 2-of-2 multisig between two parties and defining mutually exclusive settlement paths.

Inspired by [BIP-444-Futures](https://github.com/Rob1Ham/BIP-444-Futures).

## Overview

- A 2-of-2 multisig between the `FOR` and `AGAINST` parties is used for speculating on BIP 444 activation. Winner takes all.

- There are three transactions total:
  - Funding TX
  - Settlement TX if BIP 444 activates (`FOR` wins)
  - Settlement TX if BIP 444 does not activate (`AGAINST` wins)

## Parties

- `FOR`: believes BIP 444 will activate.
- `AGAINST`: believes BIP 444 will not activate.

## Settlement Rules

- `FOR` settlement (if BIP 444 activates):
  - Is only valid `1440 blocks` after the BIP activation height of `934865`.

- `AGAINST` settlement (if BIP 444 does not activate):
  - Is valid at the stated BIP 444 height.
  - Uses a larger `OP_RETURN` that would be invalid if BIP 444 activates, giving the `AGAINST` party 10 days to claim the funds.

## How to set up

1. Update script configuration:
   - Edit `bip_444_prediction.mjs` and set:
     - `FOR_BIP_PUBKEY`
     - `AGAINST_BIP_PUBKEY`
     - `FOR_BIP_AMOUNT`
     - `AGAINST_BIP_AMOUNT`

2. Install dependencies:

```bash
npm install
```

3. Generate PSBTs:

```bash
node bip_444_prediction.mjs
```

This prints:
- Contract Address
- Funding PSBT
- Against BIP Win Settlement PSBT
- For BIP Win Settlement PSBT

4. Sign PSBTs in this order (critical):
- `FOR` and `AGAINST` sign the two settlement PSBTs first.
- Exchange and verify both settlement PSBTs are fully signed (2-of-2).
- Only after both settlement PSBTs are fully signed, `FOR` and `AGAINST` sign the atomic funding PSBT and broadcast it.

5. Optional: PSBT signing tools
- You can use tools like [psbt.io](https://psbt.io) to inspect and sign PSBTs.

6. Store and broadcast settlement transactions
- Both `FOR` and `AGAINST` should securely store the fully signed settlement transactions.
- If BIP 444 does not activate: `AGAINST` broadcasts at height `934865`. Needs to settle before `934865 + 1440` height.
- If BIP 444 activates: `FOR` broadcasts at height `934865 + 1440` or later.

## Disclaimer

⚠️ This is for educational purposes only.

- Not production ready
- Not security reviewed
- Consult legal and technical experts before deployment
