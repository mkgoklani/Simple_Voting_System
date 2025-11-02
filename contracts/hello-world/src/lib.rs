#![allow(non_snake_case)]
#![no_std]
use soroban_sdk::{contract, contracttype, contractimpl, log, Env, Symbol, String, Address, symbol_short};

// Structure to store proposal details
#[contracttype]
#[derive(Clone)]
pub struct Proposal {
    pub id: u64,
    pub title: String,
    pub description: String,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub is_active: bool,
}

// Enum for mapping proposal ID to proposal data
#[contracttype]
pub enum ProposalBook {
    Proposal(u64)
}

// Enum for tracking if a user has voted on a proposal
#[contracttype]
pub enum VoteRecord {
    HasVoted(u64, Address) // (proposal_id, voter_address)
}

// Symbol for tracking total proposal count
const PROPOSAL_COUNT: Symbol = symbol_short!("P_COUNT");

#[contract]
pub struct VotingContract;

#[contractimpl]
impl VotingContract {
    
    // Function to create a new proposal
    pub fn create_proposal(env: Env, title: String, description: String) -> u64 {
        let mut proposal_count: u64 = env.storage().instance().get(&PROPOSAL_COUNT).unwrap_or(0);
        proposal_count += 1;
        
        // Create new proposal
        let new_proposal = Proposal {
            id: proposal_count,
            title,
            description,
            yes_votes: 0,
            no_votes: 0,
            is_active: true,
        };
        
        // Store the proposal
        env.storage().instance().set(&ProposalBook::Proposal(proposal_count), &new_proposal);
        env.storage().instance().set(&PROPOSAL_COUNT, &proposal_count);
        
        env.storage().instance().extend_ttl(5000, 5000);
        
        log!(&env, "Proposal Created with ID: {}", proposal_count);
        proposal_count
    }
    
    // Function to cast a vote on a proposal
    pub fn cast_vote(env: Env, proposal_id: u64, vote: bool, voter: Address) {
        // Verify the voter
        voter.require_auth();
        
        // Check if user has already voted
        let vote_key = VoteRecord::HasVoted(proposal_id, voter.clone());
        let has_voted: bool = env.storage().instance().get(&vote_key).unwrap_or(false);
        
        if has_voted {
            log!(&env, "User has already voted on this proposal");
            panic!("Already voted!");
        }
        
        // Get the proposal
        let mut proposal = Self::view_proposal(env.clone(), proposal_id);
        
        if !proposal.is_active {
            log!(&env, "Proposal is not active");
            panic!("Proposal is closed!");
        }
        
        if proposal.id == 0 {
            log!(&env, "Proposal does not exist");
            panic!("Invalid proposal ID!");
        }
        
        // Update vote count
        if vote {
            proposal.yes_votes += 1;
        } else {
            proposal.no_votes += 1;
        }
        
        // Store updated proposal and vote record
        env.storage().instance().set(&ProposalBook::Proposal(proposal_id), &proposal);
        env.storage().instance().set(&vote_key, &true);
        
        env.storage().instance().extend_ttl(5000, 5000);
        
        log!(&env, "Vote cast successfully on Proposal ID: {}", proposal_id);
    }
    
    // Function to view proposal details and results
    pub fn view_proposal(env: Env, proposal_id: u64) -> Proposal {
        let key = ProposalBook::Proposal(proposal_id);
        
        env.storage().instance().get(&key).unwrap_or(Proposal {
            id: 0,
            title: String::from_str(&env, "Not_Found"),
            description: String::from_str(&env, "Not_Found"),
            yes_votes: 0,
            no_votes: 0,
            is_active: false,
        })
    }
    
    // Function to close a proposal (stop accepting votes)
    pub fn close_proposal(env: Env, proposal_id: u64) {
        let mut proposal = Self::view_proposal(env.clone(), proposal_id);
        
        if proposal.id == 0 {
            log!(&env, "Proposal does not exist");
            panic!("Invalid proposal ID!");
        }
        
        if !proposal.is_active {
            log!(&env, "Proposal is already closed");
            panic!("Already closed!");
        }
        
        proposal.is_active = false;
        
        env.storage().instance().set(&ProposalBook::Proposal(proposal_id), &proposal);
        env.storage().instance().extend_ttl(5000, 5000);
        
        log!(&env, "Proposal ID: {} is now closed", proposal_id);
    }
}fit 