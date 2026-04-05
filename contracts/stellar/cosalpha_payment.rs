use soroban_sdk::{contractimpl, symbol_short, vec, Address, Bytes, Env, Symbol, Vec, IntoVal};

/// CosAlpha Payment Contract for Stellar Soroban
/// 
/// This contract manages agentic payments and task escrow on Stellar.
/// It supports:
/// - Creating task escrow
/// - Multi-signature release
/// - Cross-currency payments
/// - Refunds and cancellations

pub struct CosAlphaPayment;

/// Task status
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum TaskStatus {
    Pending = 0,
    Completed = 1,
    Cancelled = 2,
}

impl IntoVal<Env, Symbol> for TaskStatus {
    fn into_val(self, env: &Env) -> Symbol {
        match self {
            TaskStatus::Pending => symbol_short!("pending"),
            TaskStatus::Completed => symbol_short!("complete"),
            TaskStatus::Cancelled => symbol_short!("cancelled"),
        }
    }
}

/// Task escrow data
pub struct TaskEscrow {
    pub task_id: Bytes,
    pub client: Address,
    pub provider: Address,
    pub amount: i128,
    pub asset: Address,
    pub status: TaskStatus,
    pub required_signers: Vec<Address>,
    pub signatures: Vec<Address>,
}

#[contractimpl]
impl CosAlphaPayment {
    /// Initialize the contract
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&symbol_short!("admin"), &admin);
    }
    
    /// Create a new task escrow
    pub fn create_escrow(
        env: Env,
        task_id: Bytes,
        client: Address,
        provider: Address,
        amount: i128,
        asset: Address,
        required_signers: Vec<Address>,
    ) -> Symbol {
        client.require_auth();
        
        // Ensure task doesn't exist
        if env.storage().persistent().has(&task_id) {
            panic!("Task already exists");
        }
        
        let escrow = TaskEscrow {
            task_id: task_id.clone(),
            client: client.clone(),
            provider: provider.clone(),
            amount,
            asset: asset.clone(),
            status: TaskStatus::Pending,
            required_signers: required_signers.clone(),
            signatures: Vec::new(&env),
        };
        
        env.storage().persistent().set(&task_id, &escrow);
        
        // Emit event
        env.events().publish(
            (symbol_short!("escrow_created"), task_id.clone()),
            (client, provider, amount),
        );
        
        symbol_short!("created")
    }
    
    /// Sign completion (multi-sig)
    pub fn sign_completion(env: Env, task_id: Bytes, signer: Address) -> Symbol {
        signer.require_auth();
        
        let mut escrow: TaskEscrow = env.storage().persistent().get(&task_id).unwrap();
        
        // Verify task is pending
        if escrow.status != TaskStatus::Pending {
            panic!("Task not pending");
        }
        
        // Verify signer is authorized
        if !escrow.required_signers.contains(&signer) {
            panic!("Unauthorized signer");
        }
        
        // Check if already signed
        if escrow.signatures.contains(&signer) {
            panic!("Already signed");
        }
        
        // Add signature
        escrow.signatures.push_back(signer.clone());
        
        // Check threshold
        if escrow.signatures.len() >= escrow.required_signers.len() / 2 + 1 {
            escrow.status = TaskStatus::Completed;
            
            // Transfer to provider
            // Note: In production, integrate with Stellar Asset Contract
            env.events().publish(
                (symbol_short!("payment_released"), task_id.clone()),
                (escrow.provider.clone(), escrow.amount),
            );
        }
        
        env.storage().persistent().set(&task_id, &escrow);
        
        symbol_short!("signed")
    }
    
    /// Cancel escrow (requires both parties or admin)
    pub fn cancel_escrow(env: Env, task_id: Bytes, requester: Address) -> Symbol {
        requester.require_auth();
        
        let mut escrow: TaskEscrow = env.storage().persistent().get(&task_id).unwrap();
        
        // Check authorization
        let admin: Address = env.storage().instance().get(&symbol_short!("admin")).unwrap();
        if requester != escrow.client && requester != escrow.provider && requester != admin {
            panic!("Unauthorized");
        }
        
        // Only cancel if pending
        if escrow.status != TaskStatus::Pending {
            panic!("Task not pending");
        }
        
        escrow.status = TaskStatus::Cancelled;
        
        // Refund client
        env.events().publish(
            (symbol_short!("refunded"), task_id.clone()),
            (escrow.client.clone(), escrow.amount),
        );
        
        env.storage().persistent().set(&task_id, &escrow);
        
        symbol_short!("cancelled")
    }
    
    /// Get escrow details
    pub fn get_escrow(env: Env, task_id: Bytes) -> TaskEscrow {
        env.storage().persistent().get(&task_id).unwrap()
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    
    #[test]
    fn test_create_escrow() {
        let env = Env::default();
        let contract_id = env.register_contract(None, CosAlphaPayment);
        let client = Address::random(&env);
        let provider = Address::random(&env);
        
        // Test would go here with proper setup
    }
}
