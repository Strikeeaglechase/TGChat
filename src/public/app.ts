class Application {
	private keys: Record<string, boolean> = {};

	private ws: WebSocket;

	public async init() {
		// this.addEventListeners();
		this.onResize();
		this.connectWs();

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

		this.run();
	}

	private connectWs() {
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

		this.ws.onmessage = (message: MessageEvent) => {
			console.log(message.data);

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
