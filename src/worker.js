const SHA256 = require("crypto-js/sha256");
const spawn = require('threads').spawn;
const { addBlock, getLatestBlock, replaceBlockchain, getBlockchain } = require('./helper')
const difficulty = 5

const workerScript = function(input, callback) {
  // Everything we do here will be run in parallel in another execution context.
  // Remember that this function will be executed in the thread's context,
  // so you cannot reference any value of the surrounding code.
  const path = require('path')
  const { index, previousHash, timestamp, data, difficulty, __dirname} = input
  const { Block, calculateHash, hashMatchesDifficulty } = require(path.join(__dirname, '/helper.js'))
  
  let nonce = 0
  while (true) {
    const hash = calculateHash(index, previousHash, timestamp, data, difficulty, nonce)
    if (hashMatchesDifficulty(hash, difficulty)) {
      return callback(new Block(index, hash, previousHash, timestamp, data, difficulty, nonce))
    }
    nonce++
  }
}


let minerThread
module.exports.generateNextBlock = (blockData) => {
  return new Promise((resolve, reject) => {
    const previousBlock = getLatestBlock()
    const nextIndex = previousBlock.index + 1
    const nextTimestamp = new Date().getTime()
    const previousHash = previousBlock.hash

    minerThread = spawn(workerScript)
    minerThread
      .send({index: nextIndex, previousHash, timestamp: nextTimestamp, data: blockData, difficulty, __dirname})
      // handlers
      .on('message', function(newBlock) {
        console.log('Finished working, response', newBlock)
        addBlock(newBlock)
        resolve(newBlock)
        minerThread.kill();
      })
      .on('error', function(error) {
        console.error('Worker errored:', error);
        reject(error)
      })
      .on('exit', function() {
        console.log('Worker has been terminated.');
      });

  })
}

module.exports.validatePeerBlock = (block) => {
  // stop mining and validate block
  minerThread.kill()
  
  const success = addBlock(block)
  success ? console.log('Added new block successfully') : console.log('Invalid block.')
  console.log('My blockchain', getBlockchain())
}

module.exports.getBlockchain = () => {
  return getBlockchain()
}

let blockchainStore = []
// each peer that connects sends their blockchain
// overwrite blockchain each time we have X confirmations
// each new connecting peer above the required confirmation count will trigger the possible update of the blockchain
module.exports.initBlockchain = (peerBlockchain, peerCount) => {
  const requiredConfirmations = 2
  blockchainStore.push(peerBlockchain)

  if (blockchainStore.length >= requiredConfirmations) {
    // compare the blockchains we have
    validateBlockchains(blockchainStore)
  }
}

const validateBlockchains = (blockchainStore) => {
  let latestHashes = {}
  // add the hash of the last block from every incoming blockchain sent by peers
  for (let i = 0; i < blockchainStore.length; i++) {
    const peerBlockchain = blockchainStore[i];
    const lastBlock = peerBlockchain[peerBlockchain.length - 1]
    const peerHash = lastBlock.hash

    // increase hash count
    latestHashes[peerHash] ? latestHashes[peerHash]++ : latestHashes[peerHash] = 1
  }
  // find the most common hash, and copy that blockchain to this node
  hashesSorted = Object.keys(latestHashes).sort(function(a,b){return latestHashes[b]-latestHashes[a]})
  const mostCommonHash = hashesSorted[0]
  const mostCommonBlockchain = getBlockchainBy(blockchainStore, mostCommonHash)
  
  // copy most common blockchain of peers to this node's copy of the blockchain
  replaceBlockchain(mostCommonBlockchain)
}

const getBlockchainBy = (blockchainStore, targetHash) => {
  return blockchainStore.find(blockchain => {
    const lastBlocksHash = blockchain[blockchain.length - 1].hash
    return lastBlocksHash === targetHash
  })
}