import * as btc from '@scure/btc-signer'
import { hex, base64, utf8 } from "@scure/base"
import * as microPacked from "micro-packed"
import { sha256 } from "@noble/hashes/sha2.js"

const AGAINST_BIP_ACTIVATION_HEIGHT = 934865
const FOR_BIP_ACTIVATED_SETTLEMENT_HEIGHT = AGAINST_BIP_ACTIVATION_HEIGHT + 1440

const forBIP = hex.decode('b866395072e078411880a162e50735001fac9e55233457bb758617d07b9ae8f7')
const forBIPP2TR = btc.p2tr(forBIP)

const againstBIP = hex.decode('66e67faa48c48ce2ca7e437df40b19ca0e4cfcb310dd14f33bfd7bce966ec803')
const againstBIPP2TR = btc.p2tr(againstBIP)

const createTwoOfTwoMultisigTapscript = (pubkey1, pubkey2) => {
  return btc.Script.encode([
    pubkey1,
    'CHECKSIGVERIFY',
    pubkey2,
    'CHECKSIG',
  ])
}

const nums = hex.decode('50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0') // BIP 341
const scripts = [ { script: createTwoOfTwoMultisigTapscript(forBIP, againstBIP) } ]
const betContract = btc.p2tr(nums, scripts, undefined, true)

console.log(`Bet Contract Address:`)
console.log(betContract.address)

const fundingTX = new btc.Transaction()

fundingTX.addInput({
  txid: `0481bd8cfda38a1a19a64b7cfc5d35503518690cc2e6649efd8b293f3b1dc363`,
  index: 0,
  witnessUtxo: { script: forBIPP2TR.script, amount: 94_682n },
  tapInternalKey: forBIPP2TR.tapInternalKey,
  sequence: 4294967293
})

fundingTX.addInput({
  txid: `e32f0e60371565fd2a2bda4376eeee93b7d7fb37eaae78a73038e139006d2eb8`,
  index: 1,
  witnessUtxo: { script: againstBIPP2TR.script, amount: 113_533n },
  tapInternalKey: againstBIPP2TR.tapInternalKey,
  sequence: 4294967293
})

fundingTX.addOutputAddress(betContract.address, 12_500n)
fundingTX.addOutputAddress(forBIPP2TR.address, 92_028n)
fundingTX.addOutputAddress(againstBIPP2TR.address, 103_432n)

console.log(`\nFunding PSBT:`)
console.log(base64.encode(fundingTX.toPSBT()))

const getTXID = (tx) => {
  return hex.encode(sha256x2(tx.toBytes(true)).reverse())
}

const sha256x2 = (...msgs) => {
  return sha256(sha256(microPacked.utils.concatBytes(...msgs)))
}

const contractInput = {
  txid: getTXID(fundingTX),
  index: 0,
  witnessUtxo: { script: betContract.script, amount: 12_500n },
  tapLeafScript: [ betContract.tapLeafScript[0] ],
  tapInternalKey: betContract.tapInternalKey,
  tapMerkleRoot: betContract.tapMerkleRoot,
  sequence: 4294967293
}

const againstBIPWinSettlementTX = new btc.Transaction({ lockTime: AGAINST_BIP_ACTIVATION_HEIGHT, allowUnknownOutputs: true, allowUnknownInputs: true })
againstBIPWinSettlementTX.addInput(contractInput)

const message = utf8.decode("~FUCK BIP444~".repeat(9))
if (message.length < 100) throw new Error('Message is too short')
againstBIPWinSettlementTX.addOutput({ script: btc.Script.encode([ 'RETURN', message ]), amount: 0n })
againstBIPWinSettlementTX.addOutputAddress(againstBIPP2TR.address, 12_000n)

console.log(`\nAgainst BIP Win Settlement PSBT:`)
console.log(base64.encode(againstBIPWinSettlementTX.toPSBT()))

const forBIPWinSettlementTX = new btc.Transaction({ lockTime: FOR_BIP_ACTIVATED_SETTLEMENT_HEIGHT, allowUnknownOutputs: true, allowUnknownInputs: true })
forBIPWinSettlementTX.addInput(contractInput)

forBIPWinSettlementTX.addOutput({ script: btc.Script.encode([ 'RETURN', utf8.decode('BIP444 4 EVER') ]), amount: 0n })
forBIPWinSettlementTX.addOutputAddress(forBIPP2TR.address, 12_000n)

console.log(`\nFor BIP Win Settlement PSBT:`)
console.log(base64.encode(forBIPWinSettlementTX.toPSBT()))
