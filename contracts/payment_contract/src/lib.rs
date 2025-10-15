#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec};

// Her bir ödeme işlemini temsil eden veri yapısı
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Payment {
    pub from: Address,
    pub to: Address,
    pub amount: i128,
    pub timestamp: u64,
}

// Kontrat verilerini depolamak için kullanılacak anahtar
#[contracttype]
enum DataKey {
    Payments,
}

#[contract]
pub struct PaymentContract;

#[contractimpl]
impl PaymentContract {
    /// Bir adresten diğerine XLM gönderir ve işlemi kaydeder.
    pub fn send_payment(env: Env, from: Address, to: Address, amount: i128) {

        // Gönderenin kendisi olmamasını kontrol et
        if from == to {
            panic!("Cannot send to yourself");
        }

        // Miktarın sıfırdan büyük olmasını kontrol et
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // --- ASIL XLM TRANSFERİ ---
        // Stellar'ın yerel XLM kontratını çağırarak transferi gerçekleştir.
        // Bu, Soroban'daki standart token arayüzünü kullanır.
        // Not: Testnet için XLM kontrat ID'sini bilmeniz gerekir.
        // Bu örnekte, cross-contract call mantığını gösteriyoruz.
        let xlm_contract_id = Address::from_string(&soroban_sdk::String::from_str(&env, "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH3V6RHB4")); // Testnet Native XLM Wrapper
        let client = soroban_sdk::token::Client::new(&env, &xlm_contract_id);
        client.transfer(&from, &to, &amount);

        // --- İŞLEM KAYDI ---
        // Yeni ödeme kaydını oluştur
        let payment_record = Payment {
            from: from.clone(),
            to: to.clone(),
            amount,
            timestamp: env.ledger().timestamp(),
        };

        // Mevcut ödeme listesini depolamadan al
        let mut payments: Vec<Payment> = env
            .storage()
            .instance()
            .get(&DataKey::Payments)
            .unwrap_or_else(|| Vec::new(&env));

        // Yeni kaydı listeye ekle
        payments.push_back(payment_record);

        // Güncellenmiş listeyi depolamaya kaydet
        env.storage().instance().set(&DataKey::Payments, &payments);
        env.storage().instance().extend_ttl(100_000, 100_000); // Storage'ın silinmemesi için TTL
    }

    /// Belirli bir kullanıcının tüm işlem geçmişini döndürür.
    pub fn get_history(env: Env, user: Address) -> Vec<Payment> {
        let all_payments: Vec<Payment> = env
            .storage()
            .instance()
            .get(&DataKey::Payments)
            .unwrap_or_else(|| Vec::new(&env));

        let mut user_history = Vec::new(&env);

        for payment in all_payments.iter() {
            if payment.from == user || payment.to == user {
                user_history.push_back(payment.clone());
            }
        }

        user_history
    }

    /// Kontratın tüm ödemelerini döndürür (test için)
    pub fn get_all_payments(env: Env) -> Vec<Payment> {
        env.storage()
            .instance()
            .get(&DataKey::Payments)
            .unwrap_or_else(|| Vec::new(&env))
    }
}

#[cfg(test)]
mod testutils;