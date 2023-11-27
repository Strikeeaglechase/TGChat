interface Offer {
	type: "offer";
	targetUser: string;
	sourceUser: string;
	offer: RTCSessionDescriptionInit;
}

interface Answer {
	type: "answer";
	targetUser: string;
	sourceUser: string;
	answer: RTCSessionDescriptionInit;
}

interface Candidate {
	type: "candidate";
	targetUser: string;
	sourceUser: string;
	candidate: RTCIceCandidateInit;
}

class Application {
	private keys: Record<string, boolean> = {};
	private ws: WebSocket;
	private micStream: MediaStream;
	private myId: string;

	private connections: Record<string, RTCPeerConnection> = {};

	public async init() {
		// this.addEventListeners();
		this.onResize();
		await this.getMicStream();

		this.connectWs();
		this.setupMessageBox();
		this.run();
	}

	private async getMicStream() {
		this.micStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
	}

	private createNewRTCConnection(userId: string) {
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
				const candidateMessage: Candidate = {
					type: "candidate",
					targetUser: userId,
					sourceUser: this.myId,
					candidate: e.candidate
				};

				this.send(candidateMessage);
			}
		});

		parent.appendChild(audio);

		setInterval(async () => {
			const s = await connection.getStats();
			s.forEach(stat => {
				if (stat.type != "outbound-rtp" || stat.isRemote) return;
				console.log(`Bytes sent: ${stat.bytesSent}`);
			});
		}, 1000);

		this.connections[userId] = connection;

		return connection;
	}

	private async setupNewUser(userId: string) {
		console.log(`Setting up connection to ${userId}`);

		const connection = this.createNewRTCConnection(userId);
		const offer = await connection.createOffer();
		await connection.setLocalDescription(offer);

		const offerMessage: Offer = {
			type: "offer",
			targetUser: userId,
			sourceUser: this.myId,
			offer: offer
		};

		this.send(offerMessage);
	}

	private async handleOffer(message: Offer) {
		console.log(`Received offer from ${message.sourceUser}`);
		const connection = this.createNewRTCConnection(message.sourceUser);
		await connection.setRemoteDescription(new RTCSessionDescription(message.offer));

		const answer = await connection.createAnswer();
		await connection.setLocalDescription(answer);

		const answerMessage: Answer = {
			type: "answer",
			targetUser: message.sourceUser,
			sourceUser: this.myId,
			answer: answer
		};

		this.send(answerMessage);
	}

	private async handleAnswer(message: Answer) {
		console.log(`Received answer from ${message.sourceUser}`);
		const connection = this.connections[message.sourceUser];
		await connection.setRemoteDescription(new RTCSessionDescription(message.answer));
	}

	private async handleCandidate(message: Candidate) {
		console.log(`Received candidate from ${message.sourceUser}`);
		const connection = this.connections[message.sourceUser];
		await connection.addIceCandidate(new RTCIceCandidate(message.candidate));
	}

	private setupMessageBox() {
		const messageBox = document.getElementById("message-box") as HTMLInputElement;
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

	private connectWs() {
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

		this.ws.onmessage = (message: MessageEvent) => {
			try {
				const data = JSON.parse(message.data);
				this.handleMessage(data);
			} catch (e) {
				console.error(`Unable to parse server message`);
				console.error(e);
			}
		};
	}

	private send(message: any) {
		message.pid = Math.floor(Math.random() * 10000000)
			.toString()
			.padStart(8, "0");
		message.timestamp = Date.now();

		this.ws.send(JSON.stringify(message));
	}

	private handleMessage(message: any) {
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

	private getName() {
		const elm = document.getElementById("name-box") as HTMLInputElement;
		return elm.value || "Anonymous";
	}

	private run() {
		const now = Date.now();
		requestAnimationFrame(() => this.run());
	}

	private addEventListeners() {
		window.addEventListener("resize", () => this.onResize());
		window.addEventListener("mousedown", e => this.onMouseDown(e));
		window.addEventListener("mouseup", e => this.onMouseUp(e));
		window.addEventListener("mousemove", e => this.onMouseMove(e));
		window.addEventListener("keydown", e => this.onKeyDown(e));
		window.addEventListener("keyup", e => this.onKeyUp(e));
	}

	private onMouseDown(e: MouseEvent) {
		e.preventDefault();
	}
	private onMouseUp(e: MouseEvent) {}
	private onMouseMove(e: MouseEvent) {}
	private onKeyDown(e: KeyboardEvent) {
		this.keys[e.key] = true;
	}
	private onKeyUp(e: KeyboardEvent) {
		this.keys[e.key] = false;
	}

	private onResize() {}
}

const app = new Application();
window.onload = () => {
	// @ts-ignore
	window.app = app;
	app.init();
};

export { Application };
