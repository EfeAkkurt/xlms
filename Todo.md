Proje: Basit Stellar Soroban Ödeme Uygulaması
Amaç: İki kullanıcı arasında XLM transferi yapabilen, cüzdan entegrasyonu olan ve kullanıcıya özel işlem geçmişini gösteren bir web uygulaması.

1. Teknoloji Yığını (Technology Stack)
Akıllı Kontrat (Smart Contract):

Dil: Rust

SDK: Soroban SDK

Ortam: Rust programlama dili ve cargo paket yöneticisi.

Frontend (Arayüz):

Framework: Next.js (veya React). Next.js, sayfa yönlendirmesi ve yapısal avantajlar sunduğu için tavsiye edilir.

Dil: TypeScript (Tip güvenliği için şiddetle tavsiye edilir).

Styling: Tailwind CSS (Hızlı ve modern tasarım için).

Stellar Entegrasyonu (Frontend ↔ Blockchain):

Cüzdan Bağlantısı: @stellar/freighter-api (Kullanıcının tarayıcı eklentisi olan Freighter cüzdanı ile etkileşim için).

İşlem Oluşturma/Gönderme: stellar-sdk (Soroban kontratlarını çağırmak için işlem (transaction) oluşturma ve ağa gönderme işlemleri için).

Geliştirme Araçları:

Stellar CLI: Kontratları derlemek, dağıtmak ve testnet üzerinde manuel olarak etkileşim kurmak için kritik bir araç.

Node.js & npm/yarn: Frontend bağımlılıklarını yönetmek için.

2. Gerekli Component'ler ve Mimari
A. Akıllı Kontrat Mimarisi
Stellar'da standart XLM transferi için bir kontrata ihtiyaç yoktur. Ancak biz bu projede işlem geçmişini on-chain (zincir üzerinde) olarak saklamak için bir kontrat yazacağız. Bu, Soroban'ın depolama (storage) yeteneklerini kullanmak için harika bir başlangıç noktasıdır.

Kontratın Sorumlulukları:

Bir kullanıcıdan diğerine XLM transferini tetiklemek.

Yapılan her transferin kaydını (gönderen, alıcı, miktar, zaman damgası) kendi depolama alanında tutmak.

Belirli bir kullanıcının dahil olduğu tüm işlemleri listeleyen bir fonksiyon sunmak.

B. Frontend Component'leri
ConnectWallet.tsx: Kullanıcının Freighter cüzdanını bağlamasını sağlayan bir buton ve mantığı içerir.

BalanceDisplay.tsx: Bağlı olan kullanıcının XLM bakiyesini gösterir.

SendForm.tsx: Alıcı adresi ve gönderilecek XLM miktarının girildiği form.

TransactionHistory.tsx: Akıllı kontrattan get_history fonksiyonunu çağırarak kullanıcının geçmiş işlemlerini listeleyen component.

Layout.tsx: Uygulamanın genel yapısını (header, footer vb.) barındıran ana component.

3. Akıllı Kontrat Kodu (payment_contract.rs)
İşte projemiz için gereken temel akıllı kontrat. Bu kontrat, ödemeleri gerçekleştirir ve geçmişi saklar.
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Vec, IntoVal, Val};

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
    /// Bu fonksiyonu çağıran kişi (`from`), işlemi onaylamış olur.
    pub fn send_payment(env: Env, to: Address, amount: i128) {
        // Fonksiyonu çağıranın adresini al (İşlemi başlatan kişi)
        let from = env.invoker();

        // Gönderenin kendisi olmamasını kontrol et
        if from == to {
            panic!("Cannot send to yourself");
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
}
4. Derleme, Dağıtım ve Etkileşim Süreci
Bu adımlar, stellar-cli kullanılarak terminal üzerinden yapılır.

Gerekli Ortamı Kur:

Rust ve wasm32 hedefini kur: rustup target add wasm32-unknown-unknown

Stellar CLI'yi kur: cargo install stellar-cli

Projeyi Oluştur:

cargo new --lib payment_contract

Yukarıdaki kontrat kodunu payment_contract/src/lib.rs dosyasına yapıştırın.

Cargo.toml dosyanıza soroban-sdk bağımlılığını ekleyin.

Kontratı Derle (Build):

Proje dizinindeyken aşağıdaki komutu çalıştırın:

Bash

cargo build --target wasm32-unknown-unknown --release
    * Bu komut `target/wasm32-unknown-unknown/release/payment_contract.wasm` dosyasını oluşturacaktır. Bu bizim derlenmiş kontratımızdır.

Testnet'e Dağıt (Deploy):

Bir testnet hesabı oluşturun ve fonlayın (Stellar Laboratory üzerinden yapabilirsiniz). Bu hesabı alice olarak varsayalım.

Aşağıdaki komutla kontratı dağıtın:

Bash

stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/payment_contract.wasm \
  --source-account alice \
  --network testnet \
  --alias payment_app
    * Bu komut size bir **Contract ID** (C... ile başlayan) verecektir. Bu ID'yi frontend uygulamasında kullanmak üzere kaydedin. `--alias` bayrağı sayesinde artık ID yerine `payment_app` ismini de kullanabilirsiniz.

Kontratla Etkileşim (Invoke):

Ödeme Gönderme:

Bash

stellar contract invoke \
  --alias payment_app \
  --source-account alice \
  --network testnet \
  -- \
  send_payment \
  --to GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
  --amount 10000000
        *Not: Miktar "stroop" birimindedir (1 XLM = 10,000,000 stroop).*
Geçmişi Görüntüleme:

Bash

stellar contract invoke \
  --alias payment_app \
  --source-account alice \
  --network testnet \
  -- \
  get_history \
  --user GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

5. Frontend Entegrasyon Akışı
Cüzdan Bağlantısı:

Kullanıcı "Cüzdanı Bağla" butonuna tıklar.

@stellar/freighter-api kullanarak getPublicKey() fonksiyonu çağrılır ve kullanıcının adresi alınır.

Kullanıcının adresi ve bağlantı durumu state'de (örn: React Context veya Zustand) saklanır.

Veri Çekme:

Kullanıcı bağlandıktan sonra, stellar-sdk ile RPC üzerinden get_history fonksiyonu çağrılır.

Dönen işlem verileri TransactionHistory.tsx component'inde listelenir.

Ödeme Gönderme:

Kullanıcı SendForm.tsx'i doldurup "Gönder" butonuna tıklar.

Frontend, stellar-sdk'yı kullanarak bir işlem (transaction) oluşturur. Bu işlem, bizim dağıttığımız kontratın send_payment fonksiyonunu çağıran bir invokeHostFunction operasyonu içerir.

Oluşturulan işlem, @stellar/freighter-api'nin signTransaction() fonksiyonuna gönderilir.

Freighter, kullanıcıdan işlemi onaylamasını ister.

Kullanıcı onayladıktan sonra imzalanan işlem ağa gönderilir.

İşlem başarılı olduğunda, işlem geçmişi yeniden çekilerek arayüz güncellenir.

Bu plan, projenin tüm gereksinimlerini karşılamaktadır. Ekip olarak bu adımları takip ederek başarılı bir şekilde tamamlayabiliriz.

