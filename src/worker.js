const SHA256 = require("crypto-js/sha256");
const spawn = require('threads').spawn;
const { addBlock, getLatestBlock, blockchain } = require('./helper')
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
  console.log('My blockchain', blockchain)
}

module.exports.getBlockchain = () => {
  return blockchain
}
