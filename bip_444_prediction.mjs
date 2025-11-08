import * as btc from '@scure/btc-signer'
import { hex, base64, utf8 } from "@scure/base"
import { getTXID, fetchLargestUTXO } from './utils.js'

const MIN_AGAINST_BIP444_OP_RETURN_LENGTH = 300

const FUNDING_TX_FEE = 256n
const SETTLMENT_TX_FEE = 500n
const AGAINST_BIP_ACTIVATION_HEIGHT = 934865
const FOR_BIP_ACTIVATED_SETTLEMENT_HEIGHT = AGAINST_BIP_ACTIVATION_HEIGHT + 1440

const FOR_BIP_PUBKEY = hex.decode('b866395072e078411880a162e50735001fac9e55233457bb758617d07b9ae8f7')
const FOR_BIP_AMOUNT = 2_500n

const AGAINST_BIP_PUBKEY = hex.decode('66e67faa48c48ce2ca7e437df40b19ca0e4cfcb310dd14f33bfd7bce966ec803')
const AGAINST_BIP_AMOUNT = 10_000n

const TOTAL_AMOUNT = FOR_BIP_AMOUNT + AGAINST_BIP_AMOUNT

const forBIPP2TR = btc.p2tr(FOR_BIP_PUBKEY)
const forBIPUTXO = await fetchLargestUTXO(forBIPP2TR.address)
if (!forBIPUTXO || forBIPUTXO.value < FOR_BIP_AMOUNT) throw new Error('No UTXO found for pubkey of For BIP')

const againstBIPP2TR = btc.p2tr(AGAINST_BIP_PUBKEY)
const againstBIPUTXO = await fetchLargestUTXO(againstBIPP2TR.address)
if (!againstBIPUTXO || againstBIPUTXO.value < AGAINST_BIP_AMOUNT) throw new Error('No UTXO found for pubkey of Against BIP')

const createTwoOfTwoMultisigTapscript = (pubkey1, pubkey2) => {
  return btc.Script.encode([
    pubkey1,
    'CHECKSIGVERIFY',
    pubkey2,
    'CHECKSIG',
  ])
}

const nums = hex.decode('50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0') // BIP 341
const scripts = [ { script: createTwoOfTwoMultisigTapscript(FOR_BIP_PUBKEY, AGAINST_BIP_PUBKEY) } ]
const betContract = btc.p2tr(nums, scripts, undefined, true)

console.log(`Bet Contract Address:`)
console.log(betContract.address)

const fundingTX = new btc.Transaction()

fundingTX.addInput({
  txid: forBIPUTXO.txid,
  index: forBIPUTXO.vout,
  witnessUtxo: { script: forBIPP2TR.script, amount: BigInt(forBIPUTXO.value) },
  tapInternalKey: forBIPP2TR.tapInternalKey,
  sequence: 4294967293
})

fundingTX.addInput({
  txid: againstBIPUTXO.txid,
  index: againstBIPUTXO.vout,
  witnessUtxo: { script: againstBIPP2TR.script, amount: BigInt(againstBIPUTXO.value) },
  tapInternalKey: againstBIPP2TR.tapInternalKey,
  sequence: 4294967293
})

fundingTX.addOutputAddress(betContract.address, TOTAL_AMOUNT)
fundingTX.addOutputAddress(forBIPP2TR.address, BigInt(forBIPUTXO.value) - FOR_BIP_AMOUNT - (FUNDING_TX_FEE / 2n))
fundingTX.addOutputAddress(againstBIPP2TR.address, BigInt(againstBIPUTXO.value) - AGAINST_BIP_AMOUNT - (FUNDING_TX_FEE / 2n))

console.log(`\nFunding PSBT:`)
console.log(base64.encode(fundingTX.toPSBT()))

const contractInput = {
  txid: getTXID(fundingTX),
  index: 0,
  witnessUtxo: { script: betContract.script, amount: TOTAL_AMOUNT },
  tapLeafScript: [ betContract.tapLeafScript[0] ],
  tapInternalKey: betContract.tapInternalKey,
  tapMerkleRoot: betContract.tapMerkleRoot,
  sequence: 4294967293
}

const againstBIPWinSettlementTX = new btc.Transaction({ lockTime: AGAINST_BIP_ACTIVATION_HEIGHT, allowUnknownOutputs: true, allowUnknownInputs: true })
againstBIPWinSettlementTX.addInput(contractInput)

const message = utf8.decode("~FUCK BIP444~".repeat(24))
if (message.length < MIN_AGAINST_BIP444_OP_RETURN_LENGTH) throw new Error('Message is too short')
  
againstBIPWinSettlementTX.addOutput({ script: btc.Script.encode([ 'RETURN', message ]), amount: 0n })
againstBIPWinSettlementTX.addOutputAddress(againstBIPP2TR.address, TOTAL_AMOUNT - SETTLMENT_TX_FEE)

console.log(`\nAgainst BIP Win Settlement PSBT:`)
console.log(base64.encode(againstBIPWinSettlementTX.toPSBT()))

const forBIPWinSettlementTX = new btc.Transaction({ lockTime: FOR_BIP_ACTIVATED_SETTLEMENT_HEIGHT, allowUnknownOutputs: true, allowUnknownInputs: true })
forBIPWinSettlementTX.addInput(contractInput)

forBIPWinSettlementTX.addOutput({ script: btc.Script.encode([ 'RETURN', utf8.decode('BIP444 4 EVER') ]), amount: 0n })
forBIPWinSettlementTX.addOutputAddress(forBIPP2TR.address, TOTAL_AMOUNT - SETTLMENT_TX_FEE)

console.log(`\nFor BIP Win Settlement PSBT:`)
console.log(base64.encode(forBIPWinSettlementTX.toPSBT()))
