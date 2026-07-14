#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, vec, Address, Env, IntoVal,
};

#[contracttype]
pub enum DataKey {
    Registry,
    Voted(Address, u32),
}

#[contract]
pub struct VotingContract;

#[contractimpl]
impl VotingContract {
    // ذخیرهٔ آدرس قرارداد registry (فقط یک بار در ابتدا)
    pub fn init(env: Env, registry: Address) {
        if env.storage().instance().has(&DataKey::Registry) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Registry, &registry);
    }

    // ثبت یک رأی — این تابع قرارداد registry را صدا می‌زند
    pub fn vote(env: Env, voter: Address, proposal_id: u32) -> u32 {
        // فقط خودِ کاربر می‌تواند به نام خودش رأی بدهد
        voter.require_auth();

        // جلوگیری از رأی تکراری
        let key = DataKey::Voted(voter.clone(), proposal_id);
        if env.storage().persistent().get(&key).unwrap_or(false) {
            panic!("already voted");
        }

        // آدرس قرارداد registry را می‌گیریم
        let registry: Address = env
            .storage()
            .instance()
            .get(&DataKey::Registry)
            .expect("not initialized");

        // === ارتباط بین‌قراردادی: صدا زدن registry.add_vote(proposal_id) ===
        let new_votes: u32 = env.invoke_contract(
            &registry,
            &symbol_short!("add_vote"),
            vec![&env, proposal_id.into_val(&env)],
        );

        // ثبت اینکه این شخص رأی داده
        env.storage().persistent().set(&key, &true);

        // انتشار رویداد: یک رأی ثبت شد
        env.events().publish(
            (symbol_short!("vote"), voter),
            (proposal_id, new_votes),
        );

        new_votes
    }

    // آیا این شخص به این پیشنهاد رأی داده؟
    pub fn has_voted(env: Env, voter: Address, proposal_id: u32) -> bool {
        let key = DataKey::Voted(voter, proposal_id);
        env.storage().persistent().get(&key).unwrap_or(false)
    }

    // گرفتن آدرس قرارداد registry
    pub fn get_registry(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Registry)
            .expect("not initialized")
    }
}