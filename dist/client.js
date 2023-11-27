import { v4 as uuidv4 } from "uuid";
import WebSocket from "ws";
class Client {
    constructor(server, socket) {
        this.server = server;
        this.socket = socket;
        this.id = uuidv4();
        this.isAlive = true;
        socket.on("message", data => this.onMessage(data));
    }
    onMessage(data) {
        try {
            const message = JSON.parse(data.toString());
            this.handleMessage(message);
        }
        catch (e) {
            console.error(`Unable to parse user message`);
            console.error(e);
        }
    }
    tick() {
        this.send({ type: "ping" });
    }
    handleMessage(message) {
        switch (message.type) {
            case "pong":
                break;
            case "message":
                this.server.broadcast(message);
                break;
        }
    }
    send(message) {
        if (this.socket.readyState != WebSocket.OPEN) {
            this.isAlive = false;
            return;
        }
        message.pid = this.id;
        message.timestamp = Date.now();
        this.socket.send(JSON.stringify(message));
    }
}
export { Client };
