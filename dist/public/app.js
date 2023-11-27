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
        this.connections = {};
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            // this.addEventListeners();
            this.onResize();
            yield this.getMicStream();
            this.connectWs();
            this.setupMessageBox();
            this.run();
        });
    }
    getMicStream() {
        return __awaiter(this, void 0, void 0, function* () {
            this.micStream = yield navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        });
    }
    createNewRTCConnection(userId) {
        const configuration = {
            iceServers: [{ urls: ["stun:stun2.1.google.com:19302"] }]
        };
        const connection = new RTCPeerConnection(configuration);
        this.micStream.getTracks().forEach(track => console.log(track));
        this.micStream.getTracks().forEach(track => connection.addTrack(track, this.micStream));
        const parent = document.getElementById("sidebar");
        const audio = document.createElement("audio");
        audio.autoplay = true;
        audio.controls = true;
        connection.addEventListener("track", e => {
            console.log(`Received track from ${userId}`);
            audio.srcObject = e.streams[0];
        });
        connection.addEventListener("icecandidate", e => {
            if (e.candidate) {
                console.log(`Got ICE candidate event for ${userId}`);
                const candidateMessage = {
                    type: "candidate",
                    targetUser: userId,
                    sourceUser: this.myId,
                    candidate: e.candidate
                };
                this.send(candidateMessage);
            }
        });
        parent.appendChild(audio);
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            const s = yield connection.getStats();
            s.forEach(stat => {
                if (stat.type != "outbound-rtp" || stat.isRemote)
                    return;
                console.log(`Bytes sent: ${stat.bytesSent}`);
            });
        }), 1000);
        this.connections[userId] = connection;
        return connection;
    }
    setupNewUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Setting up connection to ${userId}`);
            const connection = this.createNewRTCConnection(userId);
            const offer = yield connection.createOffer();
            yield connection.setLocalDescription(offer);
            const offerMessage = {
                type: "offer",
                targetUser: userId,
                sourceUser: this.myId,
                offer: offer
            };
            this.send(offerMessage);
        });
    }
    handleOffer(message) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Received offer from ${message.sourceUser}`);
            const connection = this.createNewRTCConnection(message.sourceUser);
            yield connection.setRemoteDescription(new RTCSessionDescription(message.offer));
            const answer = yield connection.createAnswer();
            yield connection.setLocalDescription(answer);
            const answerMessage = {
                type: "answer",
                targetUser: message.sourceUser,
                sourceUser: this.myId,
                answer: answer
            };
            this.send(answerMessage);
        });
    }
    handleAnswer(message) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Received answer from ${message.sourceUser}`);
            const connection = this.connections[message.sourceUser];
            yield connection.setRemoteDescription(new RTCSessionDescription(message.answer));
        });
    }
    handleCandidate(message) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Received candidate from ${message.sourceUser}`);
            const connection = this.connections[message.sourceUser];
            yield connection.addIceCandidate(new RTCIceCandidate(message.candidate));
        });
    }
    setupMessageBox() {
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
    }
    connectWs() {
        const proto = location.protocol.includes("s") ? "wss://" : "ws://";
        this.ws = new WebSocket(proto + window.location.host);
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
                this.send({ type: "pong" });
                break;
            case "conn":
                this.myId = message.userId;
                break;
            case "new_conn":
                this.setupNewUser(message.userId);
                break;
            case "offer":
                this.handleOffer(message);
                break;
            case "answer":
                this.handleAnswer(message);
                break;
            case "candidate":
                this.handleCandidate(message);
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
