import {
  rpc,
  Contract,
  Account,
  Address,
  Keypair,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk"

export const RPC_URL = "https://soroban-testnet.stellar.org"
export const NETWORK_PASSPHRASE = Networks.TESTNET

export const REGISTRY_ID =
  "CDQDIKMCN55C4N5R5D4S3QZQCLFZ5ZLK6TS7Z66MMGJURVJTQEM5QYT5"
export const VOTING_ID =
  "CBHUKSTU6JA2LFOMOLG5BXCW73QJPFVOMF6X4VB2DJPIDQLEWBCAA57Y"

const server = new rpc.Server(RPC_URL)

async function waitForTx(hash) {
  let res = await server.getTransaction(hash)
  let tries = 0
  while (res.status === "NOT_FOUND" && tries < 30) {
    await new Promise((r) => setTimeout(r, 1000))
    res = await server.getTransaction(hash)
    tries++
  }
  if (res.status !== "SUCCESS") {
    throw new Error("Transaction not successful (status: " + res.status + ")")
  }
  return res
}

export async function getProposals() {
  const contract = new Contract(REGISTRY_ID)
  const source = new Account(Keypair.random().publicKey(), "0")
  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("get_proposals"))
    .setTimeout(30)
    .build()

  const sim = await server.simulateTransaction(tx)
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error)
  }
  if (!sim.result) {
    return []
  }
  return scValToNative(sim.result.retval)
}

export async function createProposal(title, walletAddress, signXdr) {
  const contract = new Contract(REGISTRY_ID)
  const account = await server.getAccount(walletAddress)
  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call("create_proposal", nativeToScVal(title, { type: "string" }))
    )
    .setTimeout(30)
    .build()

  tx = await server.prepareTransaction(tx)
  const signed = await signXdr(tx.toXDR())
  const signedTx = TransactionBuilder.fromXDR(signed, NETWORK_PASSPHRASE)
  const sent = await server.sendTransaction(signedTx)
  if (sent.status === "ERROR") {
    throw new Error("Failed to send transaction")
  }
  const result = await waitForTx(sent.hash)
  return { hash: sent.hash, value: scValToNative(result.returnValue) }
}

export async function castVote(proposalId, walletAddress, signXdr) {
  const contract = new Contract(VOTING_ID)
  const account = await server.getAccount(walletAddress)
  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "vote",
        new Address(walletAddress).toScVal(),
        nativeToScVal(proposalId, { type: "u32" })
      )
    )
    .setTimeout(30)
    .build()

  tx = await server.prepareTransaction(tx)
  const signed = await signXdr(tx.toXDR())
  const signedTx = TransactionBuilder.fromXDR(signed, NETWORK_PASSPHRASE)
  const sent = await server.sendTransaction(signedTx)
  if (sent.status === "ERROR") {
    throw new Error("Failed to send transaction")
  }
  const result = await waitForTx(sent.hash)
  return { hash: sent.hash, value: scValToNative(result.returnValue) }
}

export async function getRecentEvents() {
  const latest = await server.getLatestLedger()
  const startLedger = Math.max(latest.sequence - 10000, 1)
  const resp = await server.getEvents({
    startLedger,
    filters: [{ type: "contract", contractIds: [REGISTRY_ID, VOTING_ID] }],
    limit: 20,
  })
  return resp.events.map((e, i) => ({
    id: e.id || String(i),
    topics: e.topic.map((t) => scValToNative(t)),
    value: scValToNative(e.value),
  }))
}