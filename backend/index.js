require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// ✅ Stellar SDK for core functions
const {
  Keypair,
  Networks,
  TransactionBuilder,
  Operation,
  Contract,
  nativeToScVal,
  scValToNative,
} = require('@stellar/stellar-sdk');

// ✅ Soroban Client for smart contract interactions
const SorobanClient = require('soroban-client');
const { Server, Api, assembleTransaction, Account } = SorobanClient;

const app = express();
app.use(cors());
app.use(express.json());

// ✅ RPC + Network details
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
const server = new Server(RPC_URL);

// ✅ Example Postgres setup (optional)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
});

// =======================================================
// 🧩 Utility Functions
// =======================================================

// Function to simulate contract call
async function simulateContractCall(contractId, functionName, params = []) {
  try {
    const contract = new Contract(contractId);

    // Create a fake account for simulation
    const fakeKeypair = Keypair.random();
    const fakeAccount = new Account(fakeKeypair.publicKey(), "0");

    const tx = new TransactionBuilder(fakeAccount, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(functionName, ...params))
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);

    if (Api.isSimulationError(sim)) {
      throw new Error("Simulation failed: " + JSON.stringify(sim, null, 2));
    }

    const preparedTx = await assembleTransaction(tx, sim);
    const result = sim.result?.retval
      ? scValToNative(sim.result.retval)
      : null;

    return result;
  } catch (error) {
    console.error("❌ Simulation error:", error.message);
    return null;
  }
}

// =======================================================
// 🧠 Routes
// =======================================================

// Example: Ping test
app.get('/', (req, res) => {
  res.send('🚀 Soroban backend running successfully!');
});

// Example: Smart contract call test
app.post('/simulate', async (req, res) => {
  const { contractId, functionName, params } = req.body;

  if (!contractId || !functionName) {
    return res.status(400).json({ error: 'contractId and functionName are required.' });
  }

  const formattedParams = (params || []).map(p => nativeToScVal(p));
  const result = await simulateContractCall(contractId, functionName, formattedParams);

  if (!result) {
    return res.status(500).json({ error: 'Simulation failed.' });
  }

  res.json({ result });
});

// =======================================================
// 🚀 Start Server
// =======================================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});