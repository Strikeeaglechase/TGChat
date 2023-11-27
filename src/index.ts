import bodyParser from "body-parser";
import { config } from "dotenv";
import express from "express";
import path from "path";
import WebSocket, { WebSocketServer } from "ws";

import { Client } from "./client.js";

config();

class ServerApplication {
	private clients: Client[] = [];

	public async init() {
		const app = express();
		const staticPath = path.resolve("./public/");
		// console.log({ staticPath });
		app.use(express.static(staticPath));
		app.use(bodyParser.json());

		const httpServer = app.listen(parseInt(process.env.PORT), () => {
			console.log(`Server started on port ${process.env.PORT}`);
		});

		const wsServer = new WebSocketServer({ server: httpServer });
		wsServer.on("connection", (ws: WebSocket) => {
			this.broadcast({ type: "message", message: "A new user has joined", username: "Server" });
			const client = new Client(this, ws);
			this.broadcast({ type: "new_conn", userId: client.id });
			this.clients.push(client);
		});
	}

	private tick() {
		this.clients = this.clients.filter(client => client.isAlive);
		this.clients.forEach(c => c.tick());

		this.broadcast({ type: "client_list", clients: this.clients.map(c => c.id) });
		setTimeout(() => this.tick(), 1000);
	}

	public getUserById(id: string) {
		return this.clients.find(c => c.id == id);
	}

	public broadcast(message: object) {
		for (const client of this.clients) {
			client.send(message);
		}
	}
}

const server = new ServerApplication();
server.init();

export { ServerApplication };
