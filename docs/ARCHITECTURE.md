# Architecture

This document describes how the On-Chain Voting dApp works end to end.

## Components

The project has three layers:

1. **Registry contract** (`contracts/registry`) — stores proposals and their vote counts.
2. **Voting contract** (`contracts/voting`) — handles authentication, prevents double voting, and calls the Registry to record a vote (cross-contract call).
3. **Frontend** (`frontend/`) — a React + Vite app that reads proposals/events and sends transactions.

## Data flow

​
React + Vite frontend
│ read  (simulate)             ──►  Registry.get_proposals()
│ create proposal (sign+send)  ──►  Registry.create_proposal(title)
│ cast vote (sign+send)        ──►  Voting.vote(voter, proposal_id)
▼
@stellar/stellar-sdk (Soroban RPC, Testnet)
▼
Voting contract ──(cross-contract call)──► Registry contract
│                                          │
│ require_auth + no double vote            │ persists proposals + votes
▼                                          ▼
persistent storage: Voted(addr, id)      instance storage: proposals

## Why two contracts?

Splitting responsibilities keeps each contract focused:

- The **Registry** is the single source of truth for proposal data.
- The **Voting** contract owns the voting rules (authentication + one vote per address) and delegates the actual state change to the Registry through a cross-contract call. This demonstrates inter-contract composition on Soroban.

## Real-time updates

The frontend polls the Soroban RPC every few seconds:

- It fetches the current proposals from the Registry.
- It reads recent contract events so new votes and proposals appear without a manual refresh.

## Why Stellar / Soroban?

- Low fees and ~5s finality make voting cheap and near-instant.
- `require_auth` gives built-in, verifiable authentication.
- Cross-contract calls allow a clean separation of state and logic.