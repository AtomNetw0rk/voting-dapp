#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, String, Vec};

// هر پیشنهاد سه‌تا فیلد داره
#[derive(Clone)]
#[contracttype]
pub struct Proposal {
    pub id: u32,
    pub title: String,
    pub votes: u32,
}

// کلیدهای ذخیره‌سازی
#[contracttype]
pub enum DataKey {
    Proposals,
    Count,
}

#[contract]
pub struct RegistryContract;

#[contractimpl]
impl RegistryContract {
    // ساخت یک پیشنهاد جدید و برگرداندن شناسه‌اش
    pub fn create_proposal(env: Env, title: String) -> u32 {
        let mut proposals: Vec<Proposal> = env
            .storage()
            .instance()
            .get(&DataKey::Proposals)
            .unwrap_or(Vec::new(&env));

        let count: u32 = env.storage().instance().get(&DataKey::Count).unwrap_or(0);
        let new_id = count + 1;

        let proposal = Proposal {
            id: new_id,
            title: title.clone(),
            votes: 0,
        };

        proposals.push_back(proposal);
        env.storage().instance().set(&DataKey::Proposals, &proposals);
        env.storage().instance().set(&DataKey::Count, &new_id);

        // انتشار رویداد: یک پیشنهاد ساخته شد
        env.events().publish(
            (symbol_short!("proposal"), symbol_short!("created")),
            (new_id, title),
        );

        new_id
    }

    // گرفتن همهٔ پیشنهادها (برای نمایش در فرانت‌اند)
    pub fn get_proposals(env: Env) -> Vec<Proposal> {
        env.storage()
            .instance()
            .get(&DataKey::Proposals)
            .unwrap_or(Vec::new(&env))
    }

    // افزایش رأیِ یک پیشنهاد — این تابع را قرارداد voting صدا می‌زند
    pub fn add_vote(env: Env, proposal_id: u32) -> u32 {
        let mut proposals: Vec<Proposal> = env
            .storage()
            .instance()
            .get(&DataKey::Proposals)
            .unwrap_or(Vec::new(&env));

        let index = proposal_id - 1;
        let mut proposal = proposals.get(index).expect("proposal not found");
        proposal.votes = proposal.votes + 1;
        let new_votes = proposal.votes;
        proposals.set(index, proposal);
        env.storage().instance().set(&DataKey::Proposals, &proposals);

        // انتشار رویداد: به یک پیشنهاد رأی داده شد
        env.events().publish(
            (symbol_short!("proposal"), symbol_short!("voted")),
            (proposal_id, new_votes),
        );

        new_votes
    }
}
#[cfg(test)]
mod test;