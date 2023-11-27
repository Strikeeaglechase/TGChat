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
            this.addEventListeners();
            this.onResize();
            this.run();
        });
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
