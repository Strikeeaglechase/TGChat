var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Application {
    constructor() {
        this.keys = {};
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            // this.addEventListeners();
            this.onResize();
            this.connectWs();
            const messageBox = document.getElementById("message-box");
            messageBox.onkeyup = e => {
                if (e.key == "Enter") {
                    const packet = {
                        type: "message",
                        username: this.getName(),
                        message: messageBox.value
                    };
                    this.send(packet);
                    messageBox.value = "";
                }
            };
            this.run();
        });
    }
    connectWs() {
        this.ws = new WebSocket("ws://" + window.location.host);
        this.ws.onopen = () => {
            console.log("Connected to server");
        };
        this.ws.onclose = () => {
            console.log("Disconnected from server");
            setTimeout(() => {
                this.connectWs();
            }, 1000);
        };
        this.ws.onmessage = (message) => {
            console.log(message.data);
            try {
                const data = JSON.parse(message.data);
                this.handleMessage(data);
            }
            catch (e) {
                console.error(`Unable to parse server message`);
                console.error(e);
            }
        };
    }
    send(message) {
        message.pid = Math.floor(Math.random() * 10000000)
            .toString()
            .padStart(8, "0");
        message.timestamp = Date.now();
        this.ws.send(JSON.stringify(message));
    }
    handleMessage(message) {
        switch (message.type) {
            case "ping":
                break;
            case "message":
                const elm = document.getElementById("messages");
                const p = document.createElement("p");
                p.innerText = `[${message.username}] ${message.message}`;
                elm.appendChild(p);
                setTimeout(() => {
                    const currentScrollOffset = Math.abs(elm.scrollTop + elm.clientHeight - elm.scrollHeight);
                    if (currentScrollOffset < 100) {
                        elm.scrollTop = elm.scrollHeight;
                    }
                }, 0);
                break;
        }
    }
    getName() {
        const elm = document.getElementById("name-box");
        return elm.value || "Anonymous";
    }
    run() {
        const now = Date.now();
        requestAnimationFrame(() => this.run());
    }
    addEventListeners() {
        window.addEventListener("resize", () => this.onResize());
        window.addEventListener("mousedown", e => this.onMouseDown(e));
        window.addEventListener("mouseup", e => this.onMouseUp(e));
        window.addEventListener("mousemove", e => this.onMouseMove(e));
        window.addEventListener("keydown", e => this.onKeyDown(e));
        window.addEventListener("keyup", e => this.onKeyUp(e));
    }
    onMouseDown(e) {
        e.preventDefault();
    }
    onMouseUp(e) { }
    onMouseMove(e) { }
    onKeyDown(e) {
        this.keys[e.key] = true;
    }
    onKeyUp(e) {
        this.keys[e.key] = false;
    }
    onResize() { }
}
const app = new Application();
window.onload = () => {
    // @ts-ignore
    window.app = app;
    app.init();
};
export { Application };
