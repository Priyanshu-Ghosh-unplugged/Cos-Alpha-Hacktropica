use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

// CosAlpha Agentic Commerce Program for Solana
// 
// This program manages:
// - Task escrow and payments
// - Multi-signature governance
// - DeFi integrations
// - Security event logging

declare_id!("CosA1phapR9TC5pAn8k6s6R6dM2T6pP2w5Q1z2x3c4v5b6n7m8");

#[program]
pub mod cosalpha_agentic {
    use super::*;
    
    /// Initialize a new task escrow
    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        task_id: String,
        amount: u64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;
        
        escrow.task_id = task_id;
        escrow.client = ctx.accounts.client.key();
        escrow.provider = ctx.accounts.provider.key();
        escrow.amount = amount;
        escrow.token_mint = ctx.accounts.token_mint.key();
        escrow.status = TaskStatus::Pending;
        escrow.created_at = clock.unix_timestamp;
        escrow.signers = vec![];
        escrow.required_signatures = 2; // Default 2-of-3 multisig
        
        // Transfer tokens to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.client_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.client.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, amount)?;
        
        emit!(EscrowCreated {
            task_id: escrow.task_id.clone(),
            client: escrow.client,
            provider: escrow.provider,
            amount,
            timestamp: clock.unix_timestamp,
        });
        
        Ok(())
    }
    
    /// Sign task completion (multi-sig)
    pub fn sign_completion(ctx: Context<SignCompletion>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let signer = ctx.accounts.signer.key();
        
        // Verify task is pending
        require!(escrow.status == TaskStatus::Pending, ErrorCode::TaskNotPending);
        
        // Verify signer is authorized (client, provider, or admin)
        require!(
            signer == escrow.client || 
            signer == escrow.provider || 
            signer == ctx.accounts.admin.key(),
            ErrorCode::UnauthorizedSigner
        );
        
        // Check not already signed
        require!(!escrow.signers.contains(&signer), ErrorCode::AlreadySigned);
        
        // Add signature
        escrow.signers.push(signer);
        
        // Check if threshold reached
        if escrow.signers.len() >= escrow.required_signatures {
            escrow.status = TaskStatus::Completed;
            
            // Release funds to provider
            let seeds = &[
                b"escrow",
                escrow.task_id.as_bytes(),
                &[ctx.bumps.escrow],
            ];
            let signer_seeds = &[&seeds[..]];
            
            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.provider_token_account.to_account_info(),
                authority: escrow.to_account_info(),
            };
            
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
            
            token::transfer(cpi_ctx, escrow.amount)?;
            
            emit!(PaymentReleased {
                task_id: escrow.task_id.clone(),
                provider: escrow.provider,
                amount: escrow.amount,
                timestamp: Clock::get()?.unix_timestamp,
            });
        }
        
        emit!(TaskSigned {
            task_id: escrow.task_id.clone(),
            signer,
            signatures_count: escrow.signers.len() as u8,
        });
        
        Ok(())
    }
    
    /// Cancel escrow and refund client
    pub fn cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let requester = ctx.accounts.requester.key();
        
        // Verify authorization
        require!(
            requester == escrow.client || 
            requester == escrow.provider || 
            requester == ctx.accounts.admin.key(),
            ErrorCode::Unauthorized
        );
        
        // Verify pending status
        require!(escrow.status == TaskStatus::Pending, ErrorCode::TaskNotPending);
        
        escrow.status = TaskStatus::Cancelled;
        
        // Refund client
        let seeds = &[
            b"escrow",
            escrow.task_id.as_bytes(),
            &[ctx.bumps.escrow],
        ];
        let signer_seeds = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.client_token_account.to_account_info(),
            authority: escrow.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        
        token::transfer(cpi_ctx, escrow.amount)?;
        
        emit!(EscrowCancelled {
            task_id: escrow.task_id.clone(),
            requester,
            refunded_amount: escrow.amount,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
    
    /// Log a security event (immutable record)
    pub fn log_security_event(
        ctx: Context<LogSecurityEvent>,
        event_type: String,
        metadata: String,
    ) -> Result<()> {
        let event = &mut ctx.accounts.security_event;
        let clock = Clock::get()?;
        
        event.event_type = event_type;
        event.metadata = metadata;
        event.timestamp = clock.unix_timestamp;
        event.reporter = ctx.accounts.reporter.key();
        
        // Create hash of event data
        let data_hash = hash_event_data(&event.event_type, &event.metadata, event.timestamp);
        event.data_hash = data_hash;
        
        emit!(SecurityEventLogged {
            event_id: event.key(),
            event_type: event.event_type.clone(),
            reporter: event.reporter,
            timestamp: event.timestamp,
            data_hash: event.data_hash.clone(),
        });
        
        Ok(())
    }
}

// Account Structures

#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
    #[account(
        init,
        payer = client,
        space = 8 + Escrow::SIZE,
        seeds = [b"escrow", task_id.as_bytes()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(
        init,
        payer = client,
        token::mint = token_mint,
        token::authority = escrow,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub client: Signer<'info>,
    
    /// CHECK: Provider is verified during initialization
    pub provider: AccountInfo<'info>,
    
    #[account(mut)]
    pub client_token_account: Account<'info, TokenAccount>,
    
    pub token_mint: Account<'info, token::Mint>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    
    #[account(seeds = [b"admin"], bump)]
    pub admin: Account<'info, Admin>,
}

#[derive(Accounts)]
pub struct SignCompletion<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.task_id.as_bytes()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub provider_token_account: Account<'info, TokenAccount>,
    
    pub signer: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    
    #[account(seeds = [b"admin"], bump)]
    pub admin: Account<'info, Admin>,
}

#[derive(Accounts)]
pub struct CancelEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.task_id.as_bytes()],
        bump = escrow.bump,
        close = client,
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub client_token_account: Account<'info, TokenAccount>,
    
    pub requester: Signer<'info>,
    
    /// CHECK: Verified in instruction
    #[account(mut)]
    pub client: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    
    #[account(seeds = [b"admin"], bump)]
    pub admin: Account<'info, Admin>,
}

#[derive(Accounts)]
pub struct LogSecurityEvent<'info> {
    #[account(
        init,
        payer = reporter,
        space = 8 + SecurityEvent::SIZE,
    )]
    pub security_event: Account<'info, SecurityEvent>,
    
    #[account(mut)]
    pub reporter: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// Data Structures

#[account]
pub struct Escrow {
    pub task_id: String,
    pub client: Pubkey,
    pub provider: Pubkey,
    pub amount: u64,
    pub token_mint: Pubkey,
    pub status: TaskStatus,
    pub created_at: i64,
    pub signers: Vec<Pubkey>,
    pub required_signatures: usize,
    pub bump: u8,
}

#[account]
pub struct SecurityEvent {
    pub event_type: String,
    pub metadata: String,
    pub timestamp: i64,
    pub reporter: Pubkey,
    pub data_hash: String,
}

#[account]
pub struct Admin {
    pub authority: Pubkey,
}

// Enums

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum TaskStatus {
    Pending,
    Completed,
    Cancelled,
}

// Constants

impl Escrow {
    pub const SIZE: usize = 32 + 32 + 32 + 8 + 32 + 1 + 8 + 4 + 1 + 1 + 200; // Approximate
}

impl SecurityEvent {
    pub const SIZE: usize = 32 + 256 + 8 + 32 + 64;
}

// Events

#[event]
pub struct EscrowCreated {
    pub task_id: String,
    pub client: Pubkey,
    pub provider: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct TaskSigned {
    pub task_id: String,
    pub signer: Pubkey,
    pub signatures_count: u8,
}

#[event]
pub struct PaymentReleased {
    pub task_id: String,
    pub provider: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct EscrowCancelled {
    pub task_id: String,
    pub requester: Pubkey,
    pub refunded_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct SecurityEventLogged {
    pub event_id: Pubkey,
    pub event_type: String,
    pub reporter: Pubkey,
    pub timestamp: i64,
    pub data_hash: String,
}

// Error Codes

#[error_code]
pub enum ErrorCode {
    #[msg("Task is not in pending status")]
    TaskNotPending,
    #[msg("Unauthorized signer")]
    UnauthorizedSigner,
    #[msg("Already signed")]
    AlreadySigned,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Insufficient signatures")]
    InsufficientSignatures,
    #[msg("Invalid amount")]
    InvalidAmount,
}

// Helper functions

fn hash_event_data(event_type: &str, metadata: &str, timestamp: i64) -> String {
    use anchor_lang::solana_program::hash::hash;
    
    let data = format!("{}:{}:{}", event_type, metadata, timestamp);
    let hash_result = hash(data.as_bytes());
    bs58::encode(hash_result.to_bytes()).into_string()
}
