// =======================================================
// 🌟 Soroban Voting Backend (Full, Corrected Code)
// =======================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const {
  Keypair,
  TransactionBuilder,
  Contract,
  nativeToScVal,
  scValToNative,
} = require('@stellar/stellar-sdk');

// Import Server and Api from the rpc module
const { Server, Api } = require('@stellar/stellar-sdk/rpc');
// Import Account from the account module
const { Account } = require('@stellar/stellar-sdk/account');

const app = express();
app.use(cors());
app.use(express.json());

// =======================================================
// 🛰️ Network + Database Config
// =======================================================
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

// Server instance from '@stellar/stellar-sdk/rpc'
const server = new Server(RPC_URL, { allowHttp: true });

// Database pool using your DATABASE_CONNECTION_STRING from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production',
});

// =======================================================
// 🧩 Utility 1: Simulate Read-Only Contract Call
// =======================================================
async function simulateContractCall(contractId, functionName, params = []) {
  try {
    const contract = new Contract(contractId);
    const fakeKeypair = Keypair.random();
    const fakeAccount = new Account(fakeKeypair.publicKey(), "0");

    // Convert native JS params to ScVal inside this utility
    const formattedParams = params.map(p => nativeToScVal(p));

    const tx = new TransactionBuilder(fakeAccount, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(functionName, ...formattedParams))
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);

    if (Api.isSimulationError(sim)) {
      throw new Error("Simulation failed: " + sim.error);
    }

    if (!sim.result) {
      throw new Error("Simulation returned no result.");
    }

    const result = sim.result?.retval ? scValToNative(sim.result.retval) : null;
    return result;

  } catch (error) {
    console.error(`❌ Simulation error in [${functionName}]:`, error.message);
    throw error; // Re-throw to be caught by the route
  }
}

// =======================================================
// 🔑 Utility 2: Submit Signed Contract Call (NEW)
// This function uses your ADMIN_SECRET_KEY to send a real tx
// =======================================================
async function submitContractCall(contractId, functionName, params, secretKey) {
  try {
    const contract = new Contract(contractId);
    const sourceKeypair = Keypair.fromSecret(secretKey);

    // 1. Get the real account from the network for the correct sequence number
    const account = await server.getAccount(sourceKeypair.publicKey());

    // 2. Convert JS params to ScVal
    const formattedParams = params.map(p => nativeToScVal(p));

    // 3. Build the transaction
    const tx = new TransactionBuilder(account, { // Use the REAL account
      fee: "10000", // Submission fee is higher than simulation
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(functionName, ...formattedParams))
      .setTimeout(30)
      .build();

    // 4. Sign and Submit
    tx.sign(sourceKeypair);
    
    console.log(`Submitting tx for [${functionName}]...`);
    
    // Submit and wait for it to be accepted
    const sendResponse = await server.sendTransaction(tx);
    
    if (sendResponse.status === 'PENDING' || sendResponse.status === 'ERROR') {
       throw new Error(`Transaction submission error: ${sendResponse.status}`);
    }

    // 5. Poll for the final result
    let txResponse = await server.getTransaction(sendResponse.hash);
    let wait = 0;
    
    while (txResponse.status === 'NOT_FOUND' && wait < 10) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        txResponse = await server.getTransaction(sendResponse.hash);
        wait++;
    }

    if (txResponse.status === 'FAILED') {
      throw new Error(`Transaction failed: ${JSON.stringify(txResponse.resultXdr, null, 2)}`);
    }
    
    if (txResponse.status === 'SUCCESS') {
        console.log("✅ Transaction successful!");
        const result = txResponse.resultXdr?.result?.results?.[0]?.tr?.invokeHostFn?.success?.[0];
        return result ? scValToNative(result) : "Success (no return value)";
    }

    throw new Error("Transaction status unknown or not found after 10s.");

  } catch (error) {
    console.error(`❌ Submission error in [${functionName}]:`, error.message);
    throw error; // Re-throw to be caught by the route
  }
}


// =======================================================
// 🌐 Routes
// =======================================================

// ✅ Test Route
app.get('/', (req, res) => {
  res.send('🚀 Soroban backend running successfully!');
});

// ✅ Fetch Proposals (Read-only simulation)
app.get('/api/proposals', async (req, res) => {
  // --- !! NOTE !! ---
  // Make sure your .env file has VOTING_CONTRACT_ID
  const contractId = process.env.VOTING_CONTRACT_ID; 

  if (!contractId) {
    console.warn('⚠️ VOTING_CONTRACT_ID missing in .env file');
    return res.json({ proposals: [], warning: 'Voting Contract ID missing in environment variables.' });
  }

  try {
    const proposals = await simulateContractCall(contractId, 'get_all_proposals', []);
    return res.json({ proposals });

  } catch (error) {
    console.error("Error fetching proposals:", error.message);
    return res.status(500).json({ 
      error: 'Failed to retrieve proposals from Soroban contract.',
      details: error.message 
    });
  }
});

// ✅ Generic Simulation Endpoint (Read-only simulation)
app.post('/simulate', async (req, res) => {
  const { contractId, functionName, params } = req.body;

  if (!contractId || !functionName) {
    return res.status(400).json({ error: 'contractId and functionName are required.' });
  }

  try {
    const result = await simulateContractCall(contractId, functionName, params || []);
    res.json({ result });

  } catch (error) {
    console.error(`Error in /simulate route for [${functionName}]:`, error.message);
    return res.status(500).json({ 
      error: 'Simulation failed.',
      details: error.message 
    });
  }
});

// ✅ Example: Create a new proposal (NEW - Submits TX + Saves to DB)
app.post('/api/proposals/create', async (req, res) => {
  // --- !! IMPORTANT !! ---
  // Adjust 'title' and 'description' to match your request body
  const { title, description } = req.body;
  const adminSecret = process.env.ADMIN_SECRET_KEY;
  const contractId = process.env.VOTING_CONTRACT_ID;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }
  if (!adminSecret || !contractId) {
    return res.status(500).json({ error: 'Server not configured with ADMIN_SECRET_KEY or VOTING_CONTRACT_ID.' });
  }

  try {
    // 1. Submit to the Soroban network
    console.log("Submitting to Soroban...");
    // --- !! IMPORTANT !! ---
    // Change 'create_proposal' to your actual contract function name
    // Change [title, description] to the params your function expects
    const sorobanResult = await submitContractCall(
      contractId,
      'create_proposal', 
      [title, description], 
      adminSecret
    );
    
    console.log("Saving to database...");
    // 2. If successful, save to your database
    // --- !! IMPORTANT !! ---
    // Change 'proposals', 'title', 'description'
    // to match YOUR table and column names.
    const dbResult = await pool.query(
      'INSERT INTO proposals (title, description) VALUES ($1, $2) RETURNING *',
      [title, description]
    );

    res.json({ 
      message: 'Proposal created successfully!',
      proposal: dbResult.rows[0],
      sorobanResult: sorobanResult 
    });

  } catch (error) {
    console.error("Error creating proposal:", error.message);
    return res.status(500).json({ 
      error: 'Failed to create proposal.',
      details: error.message 
    });
  }
});


// =======================================================
// 🚀 Start Server
// =======================================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  // Use VOTING_CONTRACT_ID to match your .env
  console.log(`🔹 Loaded Contract ID: ${process.env.VOTING_CONTRACT_ID || 'Not Set'}`);
});