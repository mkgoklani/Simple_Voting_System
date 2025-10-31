#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, panic_with_error, contracterror};

#[contracterror]
#[derive(Clone, Debug, Copy, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    InvalidProposal = 2,
    AlreadyVoted = 3,
    ProposalClosed = 4,
}

#[contracttype]
#[derive(Clone)] 
pub enum DataKey {
    Admin,
    ProposalCount,
    Proposal(u64),
    HasVoted(u64, Address),
}

#[contracttype]
#[derive(Clone)]
pub struct Proposal {
    pub id: u64,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub is_active: bool,
}

#[contract]
pub struct VotingContract;

#[contractimpl]
impl VotingContract {
    
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage().persistent().set(&DataKey::ProposalCount, &0u64);
    }

    pub fn create_proposal(env: Env) -> u64 {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut proposal_count: u64 = env.storage().persistent().get(&DataKey::ProposalCount).unwrap_or(0);
        proposal_count += 1;

        let new_proposal = Proposal {
            id: proposal_count,
            yes_votes: 0,
            no_votes: 0,
            is_active: true,
        };

        env.storage().persistent().set(&DataKey::Proposal(proposal_count), &new_proposal);
        env.storage().persistent().set(&DataKey::ProposalCount, &proposal_count);

        proposal_count
    }

    pub fn close_proposal(env: Env, proposal_id: u64) {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut proposal = Self::view_proposal(env.clone(), proposal_id);
        if proposal.id == 0 {
            panic_with_error!(&env, Error::InvalidProposal);
        }

        proposal.is_active = false;
        env.storage().persistent().set(&DataKey::Proposal(proposal_id), &proposal);
    }

    pub fn cast_vote(env: Env, proposal_id: u64, vote: bool, voter: Address) {
        voter.require_auth();

        let vote_key = DataKey::HasVoted(proposal_id, voter.clone());
        if env.storage().persistent().has(&vote_key) {
            panic_with_error!(&env, Error::AlreadyVoted);
        }

        let mut proposal = Self::view_proposal(env.clone(), proposal_id);

        if proposal.id == 0 {
            panic_with_error!(&env, Error::InvalidProposal);
        }
        if !proposal.is_active {
            panic_with_error!(&env, Error::ProposalClosed);
        }

        if vote { // true == Yes
            proposal.yes_votes += 1;
        } else { // false == No
            proposal.no_votes += 1;
        }

        env.storage().persistent().set(&DataKey::Proposal(proposal_id), &proposal);
        env.storage().persistent().set(&vote_key, &true);
    }

    pub fn view_proposal(env: Env, proposal_id: u64) -> Proposal {
        let key = DataKey::Proposal(proposal_id);
        env.storage().persistent().get(&key).unwrap_or(Proposal {
            id: 0,
            yes_votes: 0,
            no_votes: 0,
            is_active: false,
        })
    }

    pub fn get_proposal_count(env: Env) -> u64 {
        env.storage().persistent().get(&DataKey::ProposalCount).unwrap_or(0)
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().persistent().get(&DataKey::Admin).unwrap()
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::Env;

    #[test]
    fn test_initialize_and_create_proposal() {
        let env = Env::default();
        let contract_id = env.register_contract(None, VotingContract);
        let client = VotingContractClient::new(&env, &contract_id);

        let admin = Address::random(&env);
        client.initialize(&admin);
        assert_eq!(client.get_admin(), admin);

        let proposal_id = client.create_proposal();
        assert_eq!(proposal_id, 1);

        let proposal = client.view_proposal(&1);
        assert_eq!(proposal.id, 1);
    }
}