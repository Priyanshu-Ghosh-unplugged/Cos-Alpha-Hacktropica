"""
Algorand Smart Contract - CosAlphaEscrow

This PyTeal contract implements a simple escrow for agentic payments.
It holds funds until a task is completed, then releases to the service provider.

To compile and deploy:
1. Install algokit: pip install algokit
2. Run: python contracts/algorand/cosalpha_escrow.py
"""

from pyteal import *
from algokit_utils import ApplicationClient
import algosdk

# Contract State
task_id = Bytes("task_id")
client_addr = Bytes("client")
provider_addr = Bytes("provider")
amount = Bytes("amount")
status = Bytes("status")  # 0=pending, 1=completed, 2=cancelled

# Constants
STATUS_PENDING = Int(0)
STATUS_COMPLETED = Int(1)
STATUS_CANCELLED = Int(2)

def cosalpha_escrow():
    """
    CosAlpha Escrow Contract
    
    Handles:
    - Creating escrow for task payment
    - Releasing funds to provider on completion
    - Refunding client on cancellation
    """
    
    # On creation - initialize with task details
    on_creation = Seq([
        App.globalPut(task_id, Txn.application_args[0]),
        App.globalPut(client_addr, Txn.application_args[1]),
        App.globalPut(provider_addr, Txn.application_args[2]),
        App.globalPut(amount, Btoi(Txn.application_args[3])),
        App.globalPut(status, STATUS_PENDING),
        Int(1)
    ])
    
    # Complete task - release funds to provider
    on_complete = Seq([
        Assert(App.globalGet(status) == STATUS_PENDING),
        Assert(Txn.sender() == App.globalGet(client_addr)),
        App.globalPut(status, STATUS_COMPLETED),
        # Payment to provider
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: App.globalGet(provider_addr),
            TxnField.amount: App.globalGet(amount) - Int(1000),  # minus fee
        }),
        InnerTxnBuilder.Submit(),
        Int(1)
    ])
    
    # Cancel task - refund client
    on_cancel = Seq([
        Assert(App.globalGet(status) == STATUS_PENDING),
        Assert(Or(
            Txn.sender() == App.globalGet(client_addr),
            Txn.sender() == App.globalGet(provider_addr)
        )),
        App.globalPut(status, STATUS_CANCELLED),
        # Refund to client
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: App.globalGet(client_addr),
            TxnField.amount: App.globalGet(amount) - Int(1000),
        }),
        InnerTxnBuilder.Submit(),
        Int(1)
    ])
    
    # Opt in to ASA
    on_optin_asa = Seq([
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.asset_receiver: Global.current_application_address(),
            TxnField.asset_amount: Int(0),
            TxnField.xfer_asset: Txn.assets[0],
        }),
        InnerTxnBuilder.Submit(),
        Int(1)
    ])
    
    return Cond(
        [Txn.application_id() == Int(0), on_creation],
        [Txn.on_completion() == OnComplete.DeleteApplication, Int(0)],
        [Txn.on_completion() == OnComplete.UpdateApplication, Int(0)],
        [Txn.application_args[0] == Bytes("complete"), on_complete],
        [Txn.application_args[0] == Bytes("cancel"), on_cancel],
        [Txn.application_args[0] == Bytes("optin_asa"), on_optin_asa],
    )


def clear_state_program():
    """Clear state - always allow"""
    return Int(1)


# Compile the contract
def compile_contract():
    """Compile to TEAL bytecode"""
    approval_teal = compileTeal(cosalpha_escrow(), mode=Mode.Application, version=8)
    clear_teal = compileTeal(clear_state_program(), mode=Mode.Application, version=8)
    return approval_teal, clear_teal


if __name__ == "__main__":
    approval, clear = compile_contract()
    
    with open("contracts/algorand/approval.teal", "w") as f:
        f.write(approval)
    
    with open("contracts/algorand/clear.teal", "w") as f:
        f.write(clear)
    
    print("✓ Compiled CosAlpha Escrow contract")
    print(f"  Approval program: {len(approval)} bytes")
    print(f"  Clear program: {len(clear)} bytes")
