import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import App from "./App"

vi.mock("@creit.tech/stellar-wallets-kit", () => ({
  StellarWalletsKit: class {
    openModal() {}
    setWallet() {}
    getAddress() {
      return { address: "GTEST" }
    }
    signTransaction() {
      return { signedTxXdr: "" }
    }
  },
  allowAllModules: () => [],
}))

vi.mock("./contract", () => ({
  getProposals: vi.fn(() =>
    Promise.resolve([{ id: 1, title: "Test Proposal", votes: 2 }])
  ),
  getRecentEvents: vi.fn(() => Promise.resolve([])),
  createProposal: vi.fn(),
  castVote: vi.fn(),
}))

describe("App", () => {
  it("renders the app title", () => {
    render(<App />)
    expect(screen.getByText("On-Chain Voting")).toBeInTheDocument()
  })

  it("shows the connect wallet button when not connected", () => {
    render(<App />)
    expect(screen.getByText("Connect Wallet")).toBeInTheDocument()
  })

  it("loads and displays proposals from the contract", async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText("Test Proposal")).toBeInTheDocument()
    })
  })

  it("shows the vote count for a proposal", async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText("Test Proposal")).toBeInTheDocument()
    })
    expect(screen.getByText("2 votes")).toBeInTheDocument()
  })
})