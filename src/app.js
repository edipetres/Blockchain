const express = require('express')
const bodyParser = require('body-parser')
const WebSocket = require('ws')
const worker = require('./worker')

const http_port = process.env.HTTP_PORT || 3001;
const p2p_port = process.env.P2P_PORT || 6001;
const initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];

let sockets = []

const initHttpServer = () => {
  const app = express()
  app.use(bodyParser.json())

  app.get('/blocks', (req, res) => res.send(JSON.stringify(worker.getBlockchain())))

  app.post('/mineBlock', (req, res) => {
      const newBlock = generateNextBlock(req.body.data)
      addBlock(newBlock)
      broadcast(responseLatestMsg())
      console.log('block added: ' + JSON.stringify(newBlock))
      res.send()
  })

  app.get('/peers', (req, res) => {
      res.send(sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort))
  })

  app.post('/addPeer', (req, res) => {
      connectToPeers([req.body.peer])
      res.send()
  })

  app.listen(http_port, () => console.log('Listening http on port: ' + http_port))
}

const initP2PServer = () => {
  const server = new WebSocket.server({port: 5000})
  server.on('connection', ws => initConnection(ws))
}

const initConnection = (webSocket) => {
  sockets.push(webSocket)
  initMessageHandler(webSocket)
}

const initMessageHandler = (ws) => {
  ws.on('message', data => {
    console.log('received message', data)
  })
}

const write = (ws, message) => ws.send(JSON.stringify(message))
const broadcast = (message) => sockets.forEach(socket => write(socket, message))


worker.generateNextBlock('test data for block 1')

// addBlock(generateNextBlock('test data for block 2'))

// addBlock(generateNextBlock('test data for block 3'))

// console.log(worker.getBlockchain())

initHttpServer()