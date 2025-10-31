import React, { useState, useEffect } from 'react';
// We do NOT import from '@stellar/freighter-api' because it is buggy

import {
  SorobanRpc,
  TransactionBuilder,
  Networks,
  Contract,
  nativeToScVal
} from '@stellar/stellar-sdk';
import './index.css';

// Constants
const BACKEND_URL = 'http://localhost:3001';
// [FILLED IN]
const CONTRACT_ID = 'CAUYK67YNHDL4772UCM6NCTMHLEB7B3WCP637OARYEJGJJV75DBYCTYC'; 
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

function App() {
  const [publicKey, setPublicKey] = useState('');
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFreighterReady, setIsFreighterReady] = useState(false);

  // This useEffect hook will listen for Freighter to be ready
  useEffect(() => {
    const handleFreighterReady = () => {
      console.log("Freighter is ready with window.freighterApi!");
      setIsFreighterReady(true);
    };

    if (window.freighterApi) {
      handleFreighterReady();
    } else {
      window.addEventListener("freighter:api", handleFreighterReady);
    }
    return () => {
      window.removeEventListener("freighter:api", handleFreighterReady);
    };
  }, []);

  // Wallet connection function
  const handleConnectWallet = async () => {
    if (!isFreighterReady || typeof window.freighterApi === 'undefined') {
      alert('Freighter wallet is not available. Please refresh the page or make sure it is installed and enabled.');
      return;
    }

    try {
      const userPublicKey = await window.freighterApi.getPublicKey(); 
      setPublicKey(userPublicKey);
      console.log('Wallet connected:', userPublicKey);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Make sure Freighter is installed and unlocked.');
    }
  };

  // Fetch proposals function
  const fetchProposals = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/proposals`);
      const data = await response.json();
      
      if (data.success && data.proposals) {
        setProposals(data.proposals);
      } else {
        console.error('Invalid response format or no proposals found:', data);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  // Voting function
  const handleVote = async (proposalId, vote) => {
    if (!publicKey || !isFreighterReady || typeof window.freighterApi === 'undefined') {
      alert('Please connect your wallet first.');
      return;
    }

    try {
      setIsLoading(true);

      const server = new SorobanRpc.Server(RPC_URL);
      const sourceAccount = await server.getAccount(publicKey);
      const contract = new Contract(CONTRACT_ID);

      const operation = contract.call(
        'cast_vote',
        nativeToScVal(BigInt(proposalId), { type: 'u64' }),
        nativeToScVal(vote, { type: 'bool' }),
        nativeToScVal(publicKey, { type: 'address' })
      );

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100000',
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulated = await server.simulateTransaction(transaction);
      if (SorobanRpc.Api.isSimulationError(simulated)) {
        throw new Error(`Simulation failed: ${simulated.error}`);
      }

      const prepared = SorobanRpc.assembleTransaction(transaction, simulated).build();
      const signedXDR = await window.freighterApi.signTransaction(prepared.toXDR(), {
        network: 'TESTNET',
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      const signedTx = TransactionBuilder.fromXDR(signedXDR, NETWORK_PASSPHRASE);
      const sent = await server.sendTransaction(signedTx);

      let result = await server.getTransaction(sent.hash);
      while (result.status === 'NOT_FOUND') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        result = await server.getTransaction(sent.hash);
      }

      if (result.status === 'SUCCESS') {
        alert('Vote successful!');
        await fetchProposals();
      } else {
        throw new Error(`Transaction failed with status: ${result.status}`);
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert(`Failed to cast vote: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="app">
      {isLoading && (
        <div className="loading-overlay"><div className="loader"></div></div>
      )}
      <header>
        <h1>Stellar Voting dApp</h1>
        <button
          className={`connect-wallet-btn ${publicKey ? 'connected' : ''}`}
          onClick={handleConnectWallet}
          disabled={!isFreighterReady} 
        >
          {publicKey ? truncateAddress(publicKey) : (isFreighterReady ? 'Connect Wallet' : 'Loading Wallet...')}
        </button>
      </header>
      <main>
        {proposals.length === 0 && !isLoading ? (
          <div className="empty-state">
            <h2>No Proposals Yet</h2>
            <p>Check back later for voting opportunities!</p>
          </div>
        ) : (
          <div className="proposals-container">
            {proposals.map((proposal) => (
              <div key={proposal.id} className="proposal-card">
                <h3>{proposal.title}</h3>
                <span className={`proposal-status ${proposal.is_active ? 'active' : 'closed'}`}>
                  {proposal.is_active ? 'Active' : 'Closed'}
                </span>
                <p>{proposal.description}</p>
                <div className="vote-results">
                  <div className="vote-count yes">
                    <div className="label">Yes Votes</div>
                    <div className="count">{proposal.yes_votes || 0}</div>
                  </div>
                  <div className="vote-count no">
                    <div className="label">No Votes</div>
                    <div className="count">{proposal.no_votes || 0}</div>
                  </div>
                </div>
                <div className="vote-buttons">
                  <button
                    className="vote-btn yes"
                    onClick={() => handleVote(proposal.id, true)}
                    disabled={!publicKey || !proposal.is_active || isLoading}
                  >
                    Vote Yes
                  </button>
                  <button
                    className="vote-btn no"
                    onClick={() => handleVote(proposal.id, false)}
                    disabled={!publicKey || !proposal.is_active || isLoading}
                  >
                    Vote No
                  </button>
                </div>
                {!publicKey && (
                  <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#888', marginTop: '12px' }}>
                    Connect your wallet to vote
                  </p>
                )}
                {!proposal.is_active && publicKey && (
                  <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#888', marginTop: '12px' }}>
                    This proposal is closed
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;