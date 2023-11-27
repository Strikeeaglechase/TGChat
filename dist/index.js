var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import bodyParser from "body-parser";
import { config } from "dotenv";
import express from "express";
import path from "path";
import { WebSocketServer } from "ws";
import { Client } from "./client.js";
config();
class ServerApplication {
    constructor() {
        this.clients = [];
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const app = express();
            const staticPath = path.resolve("./public/");
            // console.log({ staticPath });
            app.use(express.static(staticPath));
            app.use(bodyParser.json());
            const httpServer = app.listen(parseInt(process.env.PORT), () => {
                console.log("Server started on port 8000");
            });
            const wsServer = new WebSocketServer({ server: httpServer });
            wsServer.on("connection", (ws) => this.clients.push(new Client(this, ws)));
        });
    }
    tick() {
        this.clients = this.clients.filter(client => client.isAlive);
        this.clients.forEach(c => c.tick());
        setTimeout(() => this.tick(), 1000);
    }
    broadcast(message) {
        for (const client of this.clients) {
            client.send(message);
        }
    }
}
const server = new ServerApplication();
server.init();
export { ServerApplication };
