#![cfg(test)]
use crate::{RegistryContract, RegistryContractClient};
use soroban_sdk::{Env, String};

// تست ۱: ساختن پیشنهاد باید شناسه‌های ۱ و ۲ برگردونه
#[test]
fn test_create_proposal() {
    let env = Env::default();
    let contract_id = env.register(RegistryContract, ());
    let client = RegistryContractClient::new(&env, &contract_id);

    let id1 = client.create_proposal(&String::from_str(&env, "Build a park"));
    assert_eq!(id1, 1);

    let id2 = client.create_proposal(&String::from_str(&env, "Plant trees"));
    assert_eq!(id2, 2);
}

// تست ۲: get_proposals باید همهٔ پیشنهادها رو با رأی اولیهٔ صفر بده
#[test]
fn test_get_proposals() {
    let env = Env::default();
    let contract_id = env.register(RegistryContract, ());
    let client = RegistryContractClient::new(&env, &contract_id);

    client.create_proposal(&String::from_str(&env, "Build a park"));
    client.create_proposal(&String::from_str(&env, "Plant trees"));

    let proposals = client.get_proposals();
    assert_eq!(proposals.len(), 2);
    assert_eq!(proposals.get(0).unwrap().votes, 0);
}

// تست ۳: add_vote باید شمارندهٔ رأی رو درست زیاد کنه
#[test]
fn test_add_vote() {
    let env = Env::default();
    let contract_id = env.register(RegistryContract, ());
    let client = RegistryContractClient::new(&env, &contract_id);

    client.create_proposal(&String::from_str(&env, "Build a park"));

    let votes1 = client.add_vote(&1);
    assert_eq!(votes1, 1);

    let votes2 = client.add_vote(&1);
    assert_eq!(votes2, 2);

    let proposals = client.get_proposals();
    assert_eq!(proposals.get(0).unwrap().votes, 2);
}