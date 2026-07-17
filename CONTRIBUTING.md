# Contributing

Thanks for your interest in improving the On-Chain Voting dApp!

## Prerequisites

- Rust with the `wasm32v1-none` target
- Stellar CLI
- Node.js 22+

## Smart contracts

​
from the repo root
stellar contract build
cargo test

## Frontend

​
cd frontend
npm install
npm run dev      # start the dev server
npm test         # run the test suite
npm run build    # production build

## Continuous integration

Every push to `main` runs the GitHub Actions workflow in
`.github/workflows/ci.yml`, which installs dependencies, runs the frontend
tests, and builds the app.

## Pull requests

1. Create a feature branch.
2. Make your change with a clear, descriptive commit message.
3. Make sure `npm test` and `npm run build` pass.
4. Open a pull request describing what changed and why.