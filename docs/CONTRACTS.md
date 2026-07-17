# Smart Contracts

The dApp uses two Soroban smart contracts written in Rust.

## Registry contract

Stores proposals and their vote counts — the source of truth for proposal data.

**Data**

- `Proposal { id: u32, title: String, votes: u32 }`
- Instance storage: the proposal list and an id counter.

**Functions**

| Function | Type | Description |
| --- | --- | --- |
| `create_proposal(title: String) -> u32` | write | Creates a new proposal and returns its id. |
| `get_proposals() -> Vec<Proposal>` | read | Returns all proposals. |
| `add_vote(proposal_id: u32) -> u32` | write | Increments a proposal's vote count and returns the new count. Called by the Voting contract. |

Emits events when proposals are created and when votes are added.

## Voting contract

Owns the voting rules and records votes by calling the Registry.

**Data**

- Storage keys: the Registry contract address, and a `Voted(Address, proposal_id)` marker.

**Functions**

| Function | Type | Description |
| --- | --- | --- |
| `init(registry: Address)` | write | Stores the Registry address. Called once after deployment. |
| `vote(voter: Address, proposal_id: u32) -> u32` | write | Requires the voter's authorization, blocks double voting, then calls `Registry.add_vote`. Returns the new vote count. |
| `has_voted(voter: Address, proposal_id: u32) -> bool` | read | Whether an address already voted on a proposal. |
| `get_registry() -> Address` | read | Returns the configured Registry address. |

## Deployed addresses (Testnet)

- Registry: `CDQDIKMCN55C4N5R5D4S3QZQCLFZ5ZLK6TS7Z66MMGJURVJTQEM5QYT5`
- Voting: `CBHUKSTU6JA2LFOMOLG5BXCW73QJPFVOMF6X4VB2DJPIDQLEWBCAA57Y`

## Build & test

​
stellar contract build
cargo test