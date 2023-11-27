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
		wsServer.on("connection", (ws: WebSocket) => this.clients.push(new Client(this, ws)));
	}

	private tick() {
		this.clients = this.clients.filter(client => client.isAlive);
		this.clients.forEach(c => c.tick());
		setTimeout(() => this.tick(), 1000);
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
