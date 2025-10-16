#![cfg(test)]

use super::{DataKey, Payment, PaymentContract, PaymentContractClient};
use soroban_sdk::{testutils::Address as _, Address, Env, Vec};

fn seed_payments(env: &Env, contract_id: &Address, payments: Vec<Payment>) {
    // Run in the contract context so we can write to instance storage.
    env.as_contract(contract_id, || {
        env.storage().instance().set(&DataKey::Payments, &payments);
    });
}

#[test]
fn get_history_filters_by_participant() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PaymentContract);
    let client = PaymentContractClient::new(&env, &contract_id);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let carol = Address::generate(&env);

    let mut stored = Vec::new(&env);
    stored.push_back(Payment {
        from: alice.clone(),
        to: bob.clone(),
        amount: 42,
        timestamp: 111,
    });
    stored.push_back(Payment {
        from: carol.clone(),
        to: carol.clone(),
        amount: 99,
        timestamp: 222,
    });
    stored.push_back(Payment {
        from: bob.clone(),
        to: alice.clone(),
        amount: 17,
        timestamp: 333,
    });

    seed_payments(&env, &contract_id, stored);

    let history = client.get_history(&alice);
    assert_eq!(history.len(), 2);
    for payment in history.iter() {
        assert!(payment.from == alice || payment.to == alice);
    }
}

#[test]
fn get_all_payments_returns_full_list() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PaymentContract);
    let client = PaymentContractClient::new(&env, &contract_id);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    let mut stored = Vec::new(&env);
    stored.push_back(Payment {
        from: alice.clone(),
        to: bob.clone(),
        amount: 10,
        timestamp: 400,
    });
    stored.push_back(Payment {
        from: bob,
        to: alice,
        amount: 25,
        timestamp: 500,
    });

    let stored_clone = stored.clone();
    seed_payments(&env, &contract_id, stored_clone);

    let all = client.get_all_payments();
    assert_eq!(all.len(), stored.len());
    for (expected, actual) in stored.iter().zip(all.iter()) {
        assert_eq!(expected.from, actual.from);
        assert_eq!(expected.to, actual.to);
        assert_eq!(expected.amount, actual.amount);
        assert_eq!(expected.timestamp, actual.timestamp);
    }
}
