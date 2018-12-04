const SHA256 = require("crypto-js/sha256");

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

const getGenesisBlock = () => {
  return new Block(0, '0000869bdae234d6628706fc1748d4ece869c9cc8a824bda3b8349085c1bf2b9', '0000000000000000000000000000000000000000000000000000000000000000', '1543944440996', 'Genesis block', 4, 164239)
}

let blockchain = [getGenesisBlock()]

const calculateHash = (index, previousHash, timestamp, data, difficulty, nonce) => {
  return SHA256(index.toString() + previousHash + timestamp.toString() + data + difficulty.toString() + nonce.toString()).toString()
}

const calculateHashForBlock = (block) => {
  return calculateHash(block.index, block.previousHash, block.timestamp, block.data, block.difficulty, block.nonce)
}

const hashMatchesDifficulty = (hash, difficulty) => {
  const target = Math.floor(Math.random() * 10) // get random int between 0-9
  const requiredPrefix = target.toString().repeat(difficulty)
  return hash.startsWith(requiredPrefix)
}

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

module.exports = {
  Block,
  isValidBlock, 
  addBlock,
  getLatestBlock, 
  hashMatchesDifficulty, 
  calculateHashForBlock, 
  calculateHash,
  blockchain
}