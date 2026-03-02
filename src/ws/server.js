import {WebSocketServer} from 'ws'

/**
 * Send a JSON-serializable payload over a WebSocket if the socket is open.
 * @param {WebSocket} socket - The WebSocket connection to send the payload on.
 * @param {*} payload - The value to JSON-stringify and transmit to the client.
 */
function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

/**
 * Broadcast a JSON-serializable payload to every open client connected to the WebSocket server.
 *
 * The function skips clients that are not in the OPEN state and sends the JSON-stringified
 * payload to each open client.
 * @param {import('ws').WebSocketServer} wss - The WebSocket server whose clients will receive the payload.
 * @param {*} payload - The value to send; will be passed through JSON.stringify before sending.
 */
function broadcast(wss, payload) {
    for (const client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) continue;

        client.send(JSON.stringify(payload));
    }
}

/**
 * Attach a WebSocket server to an existing HTTP server and provide a broadcaster for match events.
 *
 * @param {import('http').Server} server - The HTTP server instance to attach the WebSocket server to.
 * @returns {{ broadcastMatchCreated: (match: any) => void }} An object exposing `broadcastMatchCreated(match)`, which broadcasts a `match_created` message containing `match` to all connected WebSocket clients.
 */
export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({server, path: '/ws', maxPayload: 1024 * 1024});

    wss.on('connection', (socket) => {
        sendJson(socket, {type: 'welcome'});

        socket.on('error', console.error)
    })

   function  broadcastMatchCreated(match) {
        broadcast(wss, {type: 'match_created', data: match});
   }

   return {broadcastMatchCreated}

}