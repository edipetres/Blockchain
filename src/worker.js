const SHA256 = require("crypto-js/sha256");
const difficulty = 4

class Block {
  constructor(index, hash, previousHash, timestamp, data, difficulty, nonce) {
    this.index = index
    this.hash = hash
    this.previousHash = previousHash
    this.timestamp = timestamp
    this.data = data
    this.difficulty = difficulty
    this.nonce = nonce
  }
}

const calculateHash = (index, previousHash, timestamp, data, difficulty, nonce) => {
  return SHA256(index.toString() + previousHash + timestamp.toString() + data + difficulty.toString() + nonce.toString()).toString()
}

const calculateHashForBlock = (block) => {
  return calculateHash(block.index, block.previousHash, block.timestamp, block.data, block.difficulty, block.nonce)
}

const hashMatchesDifficulty = (hash, difficulty) => {
  const requiredPrefix = '0'.repeat(difficulty)
  return hash.startsWith(requiredPrefix)
}

const findBlock = (index, previousHash, timestamp, data, difficulty) => {
  let nonce = 0

  while (true) {
    const hash = calculateHash(index, previousHash, timestamp, data, difficulty, nonce)
    if (hashMatchesDifficulty(hash, difficulty)) {
      return new Block(index, hash, previousHash, timestamp, data, difficulty, nonce)
    }
    nonce++
  }
}

const getGenesisBlock = () => {
  const index = 0
  const timestamp = new Date().getTime()
  const data = 'Genesis block'
  const previousHash = '0000000000000000000000000000000000000000000000000000000000000000'

  return findBlock(index, previousHash, timestamp, data, difficulty)
}

let blockchain = [getGenesisBlock()]

const getLatestBlock = () => {
  return blockchain[blockchain.length - 1]
}

const addBlock = (newBlock) => {
  if (isValidBlock(newBlock, getLatestBlock())) {
    blockchain.push(newBlock)
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

module.exports.generateNextBlock = (blockData) => {
  const previousBlock = getLatestBlock()
  const nextIndex = previousBlock.index + 1
  const nextTimestamp = new Date().getTime()
  const previousHash = previousBlock.hash

  const newBlock = findBlock(nextIndex, previousHash, nextTimestamp, blockData, difficulty)
  addBlock(newBlock)
}

module.exports.getBlockchain = () => {
  return blockchain
}
