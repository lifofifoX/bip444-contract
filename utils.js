import * as microPacked from "micro-packed"
import { sha256 } from "@noble/hashes/sha2.js"
import { hex } from "@scure/base"

export const getTXID = (tx) => {
  return hex.encode(sha256x2(tx.toBytes(true)).reverse())
}

export const sha256x2 = (...msgs) => {
  return sha256(sha256(microPacked.utils.concatBytes(...msgs)))
}

export const fetchLargestUTXO = async (address) => {
  const response = await fetch(`https://btc-1.xverse.app/address/${address}/utxo`)
  const utxos = await response.json()

  return utxos
    .filter(tx => tx.status.confirmed)
    .sort((a, b) => b.value - a.value)
    .at(0)
}
