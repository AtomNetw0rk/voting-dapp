import { useState, useEffect, useCallback } from "react"
import { StellarWalletsKit, allowAllModules } from "@creit.tech/stellar-wallets-kit"
import { Networks } from "@stellar/stellar-sdk"
import { getProposals, createProposal, castVote, getRecentEvents } from "./contract"
import "./App.css"

const kit = new StellarWalletsKit({
  network: Networks.TESTNET,
  selectedWalletId: "freighter",
  modules: allowAllModules(),
})

export default function App() {
  const [address, setAddress] = useState("")
  const [proposals, setProposals] = useState([])
  const [events, setEvents] = useState([])
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [lastTx, setLastTx] = useState("")

  const refresh = useCallback(async () => {
    try {
      const list = await getProposals()
      setProposals(list)
    } catch (err) {
      setError("Failed to load proposals: " + err.message)
    }
    try {
      const ev = await getRecentEvents()
      setEvents(ev)
    } catch (err) {
      // live activity feed is optional
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    refresh().finally(() => setLoading(false))
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [refresh])

  async function connect() {
    setError("")
    try {
      await kit.openModal({
        onWalletSelected: async (option) => {
          kit.setWallet(option.id)
          const { address: addr } = await kit.getAddress()
          setAddress(addr)
        },
      })
    } catch (err) {
      setError("Wallet connection failed: " + err.message)
    }
  }

  async function signXdr(xdr) {
    const { signedTxXdr } = await kit.signTransaction(xdr, {
      address,
      networkPassphrase: Networks.TESTNET,
    })
    return signedTxXdr
  }

  function copyHash() {
    if (lastTx) navigator.clipboard.writeText(lastTx)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!title.trim()) return
    setError("")
    setStatus("")
    setLoading(true)
    try {
      const res = await createProposal(title.trim(), address, signXdr)
      setStatus("Proposal created ✅")
      setLastTx(res.hash)
      setTitle("")
      await refresh()
    } catch (err) {
      setError("Failed to create proposal: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVote(id) {
    setError("")
    setStatus("")
    setBusyId(id)
    try {
      const res = await castVote(id, address, signXdr)
      setStatus("Vote recorded ✅")
      setLastTx(res.hash)
      await refresh()
    } catch (err) {
      setError("Failed to record vote: " + err.message)
    } finally {
      setBusyId(null)
    }
  }

  const totalVotes = proposals.reduce((sum, p) => sum + Number(p.votes), 0)
  const shortAddr = address ? address.slice(0, 4) + "…" + address.slice(-4) : ""

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-top">
          <div className="brand">
            <span className="logo">🗳️</span>
            <div>
              <h1>On-Chain Voting</h1>
              <p className="tagline">
                Create proposals and vote — two linked Soroban contracts on Stellar.
              </p>
            </div>
          </div>
          {address ? (
            <div className="wallet">
              <span className="addr">{shortAddr}</span>
              <button className="btn ghost small" onClick={() => setAddress("")}>
                Disconnect
              </button>
            </div>
          ) : (
            <button className="btn" onClick={connect}>
              Connect Wallet
            </button>
          )}
        </div>

        <div className="stats">
          <div className="stat">
            <span className="stat-num">{proposals.length}</span>
            <span className="stat-label">Proposals</span>
          </div>
          <div className="stat">
            <span className="stat-num">{totalVotes}</span>
            <span className="stat-label">Total votes</span>
          </div>
          <div className="stat">
            <span className="stat-num">2</span>
            <span className="stat-label">Contracts</span>
          </div>
        </div>
      </header>

      {error && <div className="banner error">{error}</div>}
      {status && <div className="banner success">{status}</div>}

      {lastTx && (
        <div className="txbox">
          <span className="txlabel">Tx hash</span>
          <code className="txhash">{lastTx}</code>
          <button className="btn ghost small" onClick={copyHash}>
            Copy
          </button>
          <a
            className="txlink"
            href={"https://stellar.expert/explorer/testnet/tx/" + lastTx}
            target="_blank"
            rel="noreferrer"
          >
            Explorer ↗
          </a>
        </div>
      )}

      {address && (
        <form className="card create" onSubmit={handleCreate}>
          <h2>Create a Proposal</h2>
          <div className="row">
            <input
              className="input"
              placeholder="Proposal title…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button className="btn" type="submit" disabled={loading || !title.trim()}>
              {loading ? "Submitting…" : "Submit"}
            </button>
          </div>
        </form>
      )}

      {!address && (
        <div className="hint">Connect your wallet to create proposals and vote.</div>
      )}

      <section className="section">
        <div className="section-head">
          <h2>Proposals</h2>
          <button className="btn ghost small" onClick={refresh}>
            ↻ Refresh
          </button>
        </div>

        {loading && proposals.length === 0 ? (
          <p className="muted">Loading…</p>
        ) : proposals.length === 0 ? (
          <p className="muted">No proposals yet. Be the first!</p>
        ) : (
          <div className="grid">
            {proposals.map((p) => {
              const pct = totalVotes > 0 ? Math.round((Number(p.votes) / totalVotes) * 100) : 0
              return (
                <div className="card proposal" key={p.id}>
                  <div className="proposal-top">
                    <span className="pid">#{p.id}</span>
                    <span className="votes">
                      {p.votes} {Number(p.votes) === 1 ? "vote" : "votes"}
                    </span>
                  </div>
                  <p className="ptitle">{p.title}</p>
                  <div className="bar">
                    <div className="bar-fill" style={ { width: pct + "%" } } />
                  </div>
                  <button
                    className="btn full"
                    disabled={!address || busyId === p.id}
                    onClick={() => handleVote(p.id)}
                  >
                    {busyId === p.id ? "Voting…" : "Vote"}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="section">
        <h2>📡 Live Activity</h2>
        {events.length === 0 ? (
          <p className="muted">No activity to show yet.</p>
        ) : (
          <ul className="events">
            {events.map((ev) => (
              <li key={ev.id} className="event">
                <span className="etopic">
                  {String(ev.topics[0]) + " / " + String(ev.topics[1])}
                </span>
                <span className="evalue">{JSON.stringify(ev.value)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="footer">Testnet · Two contracts linked (voting → registry)</footer>
    </div>
  )
}