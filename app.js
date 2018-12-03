const SHA256 = require("crypto-js/sha256");

class Block {
  constructor(index, nonce, timestamp, data, previousHash, hash) {
    this.index = index
    this.nonce = nonce
    this.timestamp = timestamp
    this.data = data
    this.previousHash = previousHash
    this.hash = hash
  }
}

const calculateHash = (index, nonce, timestamp, data, previousHash) => {
  return SHA256(index.toString() + nonce.toString() + timestamp.toString() + data.toString() + previousHash.toString()).toString()
}

const calculateHashForBlock = (block) => {
  return calculateHash(block.index, block.nonce, block.timestamp, block.data, block.previousHash)
}

const mineNewBlock = (index, timestamp, blockData, previousHash) => {
  let nonce = -1
  let hash = ''

  while (!isValidHash(hash)) {
    nonce += 1
    hash = calculateHash(index, nonce, timestamp, blockData, previousHash)
    // console.log('nonce', nonce)
  }

  // console.log(`Mined with nonce ${nonce} hash ${hash}`)
  
  return {
    hash, 
    nonce
  }
}

const isValidHash = (hash) => {
  const target = '0000'
  return hash.substring(0, target.length) === target
}

const getGenesisBlock = () => {
  const index = 0
  const timestamp = new Date().getTime()
  const data = 'Genesis block'
  const previousHash = '0000000000000000000000000000000000000000000000000000000000000000'
  const proofOfWork = mineNewBlock(index, timestamp, data, previousHash)

  return new Block(index, proofOfWork.nonce, timestamp, data, previousHash, proofOfWork.hash)
}

let blockChain = [getGenesisBlock()]


const generateNextBlock = (blockData) => {
  const previousBlock = getLatestBlock()
  const nextIndex = previousBlock.index + 1
  const nextTimestamp = new Date().getTime()
  const previousHash = previousBlock.hash
  const proofOfWork = mineNewBlock(nextIndex, nextTimestamp, blockData, previousHash)

  return new Block(nextIndex, proofOfWork.nonce, nextTimestamp, blockData, previousHash, proofOfWork.hash)
}


const getLatestBlock = () => {
  return blockChain[blockChain.length - 1]
}

const addBlock = (newBlock) => {
  if (isValidBlock(newBlock, getLatestBlock())) {
    blockChain.push(newBlock)
    return true
  }
  return false
}

const isValidBlock = (newBlock, previousBlock) => {
  if (previousBlock.index + 1 !== newBlock.index) {
    console.log('Invalid block index.')
    return false
  } else if (previousBlock.hash !== newBlock.previousHash) {
    console.log('Invalid previous hash.')
    return false
  } else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
    console.log('Invalid hash.')
    return false
  }
  return true
}

addBlock(generateNextBlock('test data for block 1'))

addBlock(generateNextBlock('test data for block 2'))

addBlock(generateNextBlock('test data for block 3'))

console.log(blockChain)
