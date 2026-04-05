#!/usr/bin/env python3
"""
Algorand Contract Deployment Script
Deploys the CosAlpha Escrow contract to Algorand testnet
"""

import os
import sys
import base64
import json
import ssl
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod

# Fix SSL certificate verification on macOS
ssl._create_default_https_context = ssl._create_unverified_context

# Algorand Testnet configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

def load_teal_files():
    """Load compiled TEAL files"""
    with open("contracts/algorand/approval.teal", "r") as f:
        approval_teal = f.read()
    with open("contracts/algorand/clear.teal", "r") as f:
        clear_teal = f.read()
    return approval_teal, clear_teal

def compile_program(client, source_code):
    """Compile TEAL to binary"""
    compile_response = client.compile(source_code)
    return base64.b64decode(compile_response['result'])

def deploy():
    print("🚀 CosAlpha Algorand Contract Deployment")
    print("=" * 50)
    
    client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
    params = client.suggested_params()
    print(f"✓ Connected to Algorand Testnet (round: {params.last})")
    
    # Get or create deployer account
    mnemonic_env = os.environ.get("DEPLOYER_MNEMONIC", "")
    
    if not mnemonic_env:
        print("\n⚠️  No DEPLOYER_MNEMONIC set. Creating new test account...")
        private_key, address = account.generate_account()
        print(f"\n📝 New Test Account:")
        print(f"  Address: {address}")
        print(f"  Mnemonic: {mnemonic.from_private_key(private_key)}")
        print(f"\n⚠️  Fund this address with testnet ALGO from:")
        print(f"  https://dispenser.testnet.aws.algodev.network/")
        return
    
    try:
        private_key = mnemonic.to_private_key(mnemonic_env)
        address = account.address_from_private_key(private_key)
        print(f"\n📝 Deployer: {address}")
    except Exception as e:
        print(f"❌ Invalid mnemonic: {e}")
        return
    
    # Check balance
    account_info = client.account_info(address)
    balance = account_info.get('amount', 0)
    print(f"💰 Balance: {balance / 1_000_000:.6f} ALGO")
    
    if balance < 1_000_000:
        print(f"\n⚠️  Insufficient balance. Get testnet ALGO from:")
        print(f"  https://dispenser.testnet.aws.algodev.network/")
        return
    
    # Load TEAL
    print("\n📦 Loading TEAL contracts...")
    approval_teal, clear_teal = load_teal_files()
    
    print("🔨 Compiling programs...")
    approval_program = compile_program(client, approval_teal)
    clear_program = compile_program(client, clear_teal)
    print(f"  Approval: {len(approval_program)} bytes")
    print(f"  Clear: {len(clear_program)} bytes")
    
    # Deploy
    print("\n🚀 Deploying contract...")
    global_schema = transaction.StateSchema(num_uints=8, num_byte_slices=4)
    local_schema = transaction.StateSchema(num_uints=0, num_byte_slices=0)
    
    txn = transaction.ApplicationCreateTxn(
        sender=address,
        sp=params,
        on_complete=transaction.OnComplete.NoOpOC,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=global_schema,
        local_schema=local_schema,
    )
    
    signed_txn = txn.sign(private_key)
    tx_id = client.send_transaction(signed_txn)
    print(f"  TX: {tx_id[:20]}...")
    
    transaction.wait_for_confirmation(client, tx_id, 10)
    response = client.pending_transaction_info(tx_id)
    app_id = response['application-index']
    
    print(f"\n✅ Deployed! App ID: {app_id}")
    print(f"  Explorer: https://allo.info/application/{app_id}")
    
    # Save deployment
    deployment = {
        "network": "testnet",
        "app_id": app_id,
        "deployer": address,
        "tx_id": tx_id,
    }
    with open("contracts/algorand/deployment.json", "w") as f:
        json.dump(deployment, f, indent=2)
    print(f"💾 Saved to contracts/algorand/deployment.json")

if __name__ == "__main__":
    deploy()
