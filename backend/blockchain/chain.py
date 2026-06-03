from .block import Block
from pathlib import Path
import json

class Blockchain:
    def __init__(self):
        self.unconfirmed_transactions = []
        self.chain = []
        self.difficulty = 3
        import os
        storage_env = os.getenv("BLOCKCHAIN_STORAGE_PATH")
        if storage_env:
            self.storage_path = Path(storage_env)
        else:
            self.storage_path = Path(__file__).resolve().parent.parent / "blockchain_state.json"
        self._load_chain()

    def create_genesis_block(self):
        genesis_block = Block(0, [], "0")
        genesis_block.hash = genesis_block.compute_hash()
        self.chain.append(genesis_block)
        self._persist_chain()

    def _load_chain(self):
        if not self.storage_path.exists():
            self.create_genesis_block()
            return

        try:
            data = json.loads(self.storage_path.read_text(encoding="utf-8"))
            blocks = data.get("chain", [])
            if not blocks:
                self.create_genesis_block()
                return
            self.chain = [Block.from_dict(block) for block in blocks]
        except Exception:
            self.chain = []
            self.create_genesis_block()

    def _persist_chain(self):
        payload = {
            "chain": [block.__dict__ for block in self.chain],
        }
        self.storage_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    @property
    def last_block(self):
        return self.chain[-1]

    def add_block(self, block, proof):
        previous_hash = self.last_block.hash
        if previous_hash != block.previous_hash:
            return False
        if not self.is_valid_proof(block, proof):
            return False
        block.hash = proof
        self.chain.append(block)
        self._persist_chain()
        return True

    def is_valid_proof(self, block, block_hash):
        return (block_hash.startswith('0' * self.difficulty) and
                block_hash == block.compute_hash())

    def proof_of_work(self, block):
        block.nonce = 0
        computed_hash = block.compute_hash()
        while not computed_hash.startswith('0' * self.difficulty):
            block.nonce += 1
            computed_hash = block.compute_hash()
        return computed_hash

    def add_new_transaction(self, transaction):
        self.unconfirmed_transactions.append(transaction)

    def mine(self):
        if not self.unconfirmed_transactions:
            return False

        last_block = self.last_block
        new_block = Block(index=last_block.index + 1,
                          transactions=self.unconfirmed_transactions,
                          previous_hash=last_block.hash)

        proof = self.proof_of_work(new_block)
        self.add_block(new_block, proof)
        self.unconfirmed_transactions = []
        return new_block.index
