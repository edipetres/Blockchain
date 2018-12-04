'use strict'
const topology = require('fully-connected-topology')
const jsonStream = require('duplex-json-stream')
const worker = require('./worker')

const MessageType = {
  MESSAGE: 1,
  QUERY_BLOCKCHAIN: 2,
  BLOCKCHAIN_RESPONSE: 3,
  PEER_STARTED_MINING: 4,
  PEER_FINISHED_MINING: 5,
}

const me = process.argv[2]
let peers = []
let swarm = {}

const initP2PServer = async () => {
  // const peers = await loadPeersFromFile()
  const peers = ['localhost:5000', 'localhost:5001', 'localhost:5002', 'localhost:5003']
  swarm = topology(me, peers)
  initConnection(swarm)
}

const initConnection = (swarm) => {
  swarm.on('connection', (socket, id) => {
    socket = jsonStream(socket)
    initPeer(id, socket)
    
    socket.on('data', data => {
      incomingMessageHandler(data, id)
    })
  })
}


process.stdin.on('data', data => {
  const consoleInput = data.toString().trim()

  if (consoleInput.startsWith('mine')) {
    const blockData = consoleInput.split(':')[1]
    console.log('Announced mining to other peers')
    broadcast({
      type: MessageType.PEER_STARTED_MINING,
      data: blockData
    })
    // this will block the code
    startMining(blockData)
  } else {
    broadcast({
      type: MessageType.MESSAGE,
      message: consoleInput
    })

  }
})


const initPeer = (id, socket) => {
  swarm.add(id)

  // check if peer has already been registered and refresh it with new socket
  const existingPeerIndex = peers.findIndex(peer => peer.id === id)
  if (existingPeerIndex > -1) {
    peers.splice(existingPeerIndex, 1)
  }
  console.log('Adding new peer', id)
  peers.push({ id, socket })
}


const incomingMessageHandler = (data, id) => {
  switch (data.type) {
    case MessageType.MESSAGE:
      console.log(id + '> ' + data.message)
      break;

    case MessageType.PEER_STARTED_MINING:
      console.log('Received command to start mining')
      const blockData = data.data
      startMining(blockData)
      break;

    case MessageType.PEER_FINISHED_MINING:
      console.log('Received command to stop mining')
      // stop mining and valdate new block
      worker.validatePeerBlock(data.block)
      break;

    default:
      break;
  }
}

const startMining = (blockData) => {
  console.log('Started mining...')

  worker.generateNextBlock(blockData)
  .then(newBlock => {
    broadcastNewBlock(newBlock)
  })
  .catch(error => {
    console.log('Error in Promise', error)
  })
}

const broadcastNewBlock = (newBlock) => {
  console.log('Announcing new block to peers')
  broadcast({
    type: MessageType.PEER_FINISHED_MINING,
    block: newBlock
  })
}

const write = (id, data) => {
  const socket = peers.find(peer => peer.id === id).socket
  if (socket) {
    socket.write(data)
  }
}

const broadcast = (data) => {
  console.log('Broadcasting to peers', peers.map(peer => peer.id))
  peers.forEach(peer => write(peer.id, data))
}

initP2PServer()
