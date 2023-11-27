import { v4 as uuidv4 } from "uuid";
import WebSocket from "ws";

import { ServerApplication } from "./index.js";

class Client {
	public id = uuidv4();
	public isAlive = true;

	constructor(private server: ServerApplication, private socket: WebSocket) {
		socket.on("message", data => this.onMessage(data));

		this.send({ type: "conn", userId: this.id });
	}

	private onMessage(data: WebSocket.RawData) {
		try {
			const message = JSON.parse(data.toString());
			this.handleMessage(message);
		} catch (e) {
			console.error(`Unable to parse user message`);
			console.error(e);
		}
	}

	public tick() {
		this.send({ type: "ping" });
	}

	private handleMessage(message: any) {
		switch (message.type) {
			case "pong":
				break;

			case "offer": {
				const user = this.server.getUserById(message.targetUser);
				if (user) user.send(message);
				else console.error(`Unable to find user ${message.userId} for offer`);
				break;
			}

			case "answer": {
				const user = this.server.getUserById(message.targetUser);
				if (user) user.send(message);
				else console.error(`Unable to find user ${message.userId} for answer`);
				break;
			}

			case "candidate": {
				const user = this.server.getUserById(message.targetUser);
				if (user) user.send(message);
				else console.error(`Unable to find user ${message.userId} for ice`);
				break;
			}

			case "message":
				this.server.broadcast(message);
				break;

			default:
				console.error(`Unknown message type ${message.type}`);
				break;
		}
	}

	public send(message: any) {
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
