import hashlib
import json
from time import time

class Block:
    def __init__(self, index, transactions, previous_hash, nonce=0, timestamp=None):
        self.index = index
        self.timestamp = timestamp or time()
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.hash = self.compute_hash()

    def compute_hash(self):
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions": self.transactions,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()

    @classmethod
    def from_dict(cls, data):
        block = cls(
            index=data["index"],
            transactions=data.get("transactions", []),
            previous_hash=data.get("previous_hash", "0"),
            nonce=data.get("nonce", 0),
            timestamp=data.get("timestamp"),
        )
        block.hash = data.get("hash", block.compute_hash())
        return block
