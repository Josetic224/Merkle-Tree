const crypto = require('crypto');
const readline = require('readline');

const addresses = [
    '0x123456789012345678901234567890123456789',
    '0x123456789012345678901234567890123456781',
    '0x123456789012345678901234567890123456792',
    '0x1234567890123456789012345678901234567893',
    '0x123456789012345678901234567890123456894'
];

// Utility function to compute SHA256 hash
function hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Function to generate the Merkle tree and proofs
function generateMerkleTree(addresses) {
    let layers = [addresses.map(addr => hash(addr))]; // First layer (leaf nodes)

    // Build the tree layer by layer
    while (layers[layers.length - 1].length > 1) {
        const currentLayer = layers[layers.length - 1];
        const nextLayer = [];

        for (let i = 0; i < currentLayer.length; i += 2) {
            const left = currentLayer[i];
            const right = currentLayer[i + 1] || left; // Handle odd number of nodes
            nextLayer.push(hash(left + right));
        }

        layers.push(nextLayer);
    }

    const merkleRoot = layers[layers.length - 1][0];

    // Generate proofs for all addresses
    const proofs = addresses.map((_, index) => {
        let proof = [];
        let position = index;

        for (let i = 0; i < layers.length - 1; i++) {
            const currentLayer = layers[i];
            const pairIndex = position % 2 === 0 ? position + 1 : position - 1;

            if (pairIndex < currentLayer.length) {
                proof.push({
                    position: position % 2 === 0 ? 'right' : 'left',
                    hash: currentLayer[pairIndex]
                });
            }

            position = Math.floor(position / 2);
        }

        return proof;
    });

    return { merkleRoot, proofs };
}

// Function to verify a Merkle proof
function verifyMerkleProof(proof, merkleRoot, address) {
    let computedHash = hash(address);

    for (const { position, hash: proofHash } of proof) {
        if (position === 'left') {
            computedHash = hash(proofHash + computedHash);
        } else {
            computedHash = hash(computedHash + proofHash);
        }
    }

    return computedHash === merkleRoot;
}

// Example usage
const { merkleRoot, proofs } = generateMerkleTree(addresses);
console.log('Merkle Root:', merkleRoot);

// Add interactive test for address verification
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter an address to verify against the Merkle tree: ', (inputAddress) => {
    const proofIndex = 2; // Use proof for the 3rd address as example
    const proof = proofs[proofIndex];

    const isValidInputAddress = verifyMerkleProof(proof, merkleRoot, inputAddress);
    console.log(`Is the address "${inputAddress}" valid?:`, isValidInputAddress);

    rl.close();
});
