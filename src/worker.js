module.exports = (input, done) => {
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
      return done(new Block(index, hash, previousHash, timestamp, data, difficulty, nonce))
    }
    nonce++
  }
}