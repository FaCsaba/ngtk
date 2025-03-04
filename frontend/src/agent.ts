import createAgentWasm from "./assets/agent.wasm?init";
import DigitaltsLime from "./assets/DigitaltsLime.ttf";

type ptr = number;

interface Slice {
    ptr: ptr;
    len: number;
}

export interface AgentExports {
    agent_init: () => ptr;
    agent_deinit: () => void;
    agent_load_font: (agent: ptr, buf: ptr, buf_len: number) => void;
    agent_get_font_atlas: (agent: ptr) => ptr;
    agent_add_char: (agent: ptr, char: number) => void;
    agent_remove_char: (agent: ptr) => void;
    agent_render_text: (agent: ptr) => ptr;
    malloc: (size: number) => ptr;
    free: (buf: ptr) => void;
    memory: WebAssembly.Memory;
}

export class AgentWasm {
    public static readonly RENDERED_TEXT_WIDTH = 420;
    public static readonly RENDERED_TEXT_HEIGHT = 420;

    private wasm!: WebAssembly.Instance;
    private agentPtr!: number;
    private exports!: AgentExports;
    private fontAlloc?: Slice;
    private ctx?: CanvasRenderingContext2D;

    private constructor() { }

    private makeEnvironment(env: any) {
        return new Proxy(env, {
            get(_target, prop, _receiver) {
                if (env[prop] !== undefined) return env[prop].bind(this)
                return (...args: any) => { throw new Error(`NOT IMPLEMENTED: ${prop as string}, args: ${args}`) }
            }
        });
    }

    public static async new(): Promise<AgentWasm> {
        const a = new AgentWasm();
        a.wasm = await createAgentWasm({
            env: a.makeEnvironment({
                _print: (str_ptr: number) => { console.log(a.getString(str_ptr)); },
                _panic: (str_ptr: number) => { throw new Error(a.getString(str_ptr)); },
            }),
        });
        a.exports = a.wasm.exports as unknown as AgentExports;
        a.agentPtr = a.exports.agent_init();
        const font = await fetch(DigitaltsLime).then(res => res.arrayBuffer());
        a.loadFont(font);
        return a
    }

    public setCanvas(ctx: CanvasRenderingContext2D): void {
        this.ctx = ctx;
    }

    public deinit(): void {
        this.exports.agent_deinit();
    }

    public addChar(char: string): void {
        if (char.length != 1) {
            if (char == "Backspace") this.exports.agent_remove_char(this.agentPtr);
        } else {
            const textU8 = new TextEncoder().encode(char);
            this.exports.agent_add_char(this.agentPtr, textU8[0]);
        }
        this.renderText();
    }

    public renderText(): void {
        this.ctx?.clearRect(0, 0, AgentWasm.RENDERED_TEXT_WIDTH, AgentWasm.RENDERED_TEXT_HEIGHT)
        const imgPtr = this.exports.agent_render_text(this.agentPtr);
        const img = this.imgFromAlpha(imgPtr);
        this.ctx?.putImageData(img, 0, 0);
    }

    private loadFont(font: ArrayBuffer): void {
        this.fontAlloc = this.malloc(font.byteLength);

        // Copy the font into wasm memory
        const fontView = new Uint8Array(this.exports.memory.buffer, this.fontAlloc.ptr, this.fontAlloc.len);
        fontView.set(new Uint8Array(font, 0, this.fontAlloc.len));

        this.exports.agent_load_font(this.agentPtr, this.fontAlloc.ptr, this.fontAlloc.len);
        this.free(this.fontAlloc.ptr);
    }

    private malloc(len: number): Slice {
        const ptr = this.exports.malloc(len);
        return { ptr, len };
    }

    private free(buf: ptr): void {
        this.exports.free(buf);
    }

    private imgFromAlpha(imgPtr: ptr): ImageData {
        const imgAlpha = new Uint8Array(this.exports.memory.buffer, imgPtr, AgentWasm.RENDERED_TEXT_HEIGHT * AgentWasm.RENDERED_TEXT_WIDTH);
        const imgData = new Uint8ClampedArray(imgAlpha.length * 4);
        for (let i = 0; i < imgAlpha.length; i++) {
            imgData[i * 4 + 0] = 0;
            imgData[i * 4 + 1] = 0;
            imgData[i * 4 + 2] = 0;
            imgData[i * 4 + 3] = imgAlpha[i];
        }
        return new ImageData(imgData, AgentWasm.RENDERED_TEXT_WIDTH, AgentWasm.RENDERED_TEXT_HEIGHT);
    }

    private getString(str_ptr: number): string {
        const mem = new Uint8Array(this.exports.memory.buffer);
        let len = 0;
        let ptr = str_ptr;
        while (mem[ptr] != 0) {
            len++;
            ptr++;
        }
        const bytes = new Uint8Array(this.exports.memory.buffer, str_ptr, len);
        return new TextDecoder().decode(bytes);
    }
}