import createAgentWasm from "./assets/agent.wasm?init";
import { ColorScheme } from "./models/color-scheme.model";
import { KeyMap } from "./models/key-map.model";

type ptr = number;
type color = number;

interface Slice {
    ptr: ptr;
    len: number;
}

interface Size {
    width: number;
    height: number;
}

export interface AgentExports {
    agent_init: () => ptr;
    agent_deinit: () => void;
    agent_load_font: (agent: ptr, buf: ptr, buf_len: number) => void;
    agent_get_font_atlas: (agent: ptr) => ptr;
    agent_add_char: (agent: ptr, char: number) => void;
    agent_put_key: (agent: ptr, mod: number, key: number) => void;
    agent_has_key: (agent: ptr, mod: number, key: number) => boolean;
    agent_remove_char: (agent: ptr) => void;
    agent_render_text: (agent: ptr) => ptr;
    agent_resize: (agent: ptr, width: number, height: number) => void;
    agent_set_color: (agent: ptr, bg: color, fg: color) => void;
    malloc: (size: number) => ptr;
    free: (buf: ptr) => void;
    memory: WebAssembly.Memory;
}

const COLOR_SIZE = 4;

export class AgentWasm {
    private wasm!: WebAssembly.Instance;
    private agentPtr!: number;
    private exports!: AgentExports;
    private fontAlloc?: Slice;
    private ctx?: CanvasRenderingContext2D;
    private renderSize: Size = { width: 420, height: 420 };

    private textDecoder = new TextDecoder();

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
                _print: (str_ptr: number, len: number) => { console.log(a.getString(str_ptr, len)); },
                _panic: (str_ptr: number, len: number) => { throw new Error(a.getString(str_ptr, len)); },
            }),
        });
        a.exports = a.wasm.exports as unknown as AgentExports;
        a.agentPtr = a.exports.agent_init();
        return a
    }

    public setCanvas(ctx: CanvasRenderingContext2D): void {
        this.ctx = ctx;
    }

    public deinit(): void {
        this.exports.agent_deinit();
    }

    public addChar(char: string): void {
        this.exports.agent_add_char(this.agentPtr, char.codePointAt(0)!);
        this.renderText();
    }

    public putKey(keyMap: KeyMap): void {
        this.exports.agent_put_key(this.agentPtr, keyMap.mods, keyMap.key);
        this.renderText();
    }

    public hasKey(keyMap: KeyMap): boolean {
        return this.exports.agent_has_key(this.agentPtr, keyMap.mods, keyMap.key);
    }

    public removeChar(): void {
        this.exports.agent_remove_char(this.agentPtr);
        this.renderText();
    }

    public renderText(): void {
        this.ctx?.clearRect(0, 0, this.renderSize.width, this.renderSize.height)
        const imgPtr = this.exports.agent_render_text(this.agentPtr);
        const img = this.imgFromPtr(imgPtr);
        this.ctx?.putImageData(img, 0, 0);
    }

    public resize({ width, height }: Size): void {
        this.exports.agent_resize(this.agentPtr, width, height);
        this.renderSize = { width, height };
        this.renderText();
    }

    public setColor({ bg, fg }: ColorScheme): void {
        this.exports.agent_set_color(this.agentPtr, bg, fg);
    }

    public loadFont(font: ArrayBuffer): void {
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

    private imgFromPtr(imgPtr: ptr): ImageData {
        const imgData = new Uint8ClampedArray(this.exports.memory.buffer, imgPtr, this.renderSize.width * this.renderSize.height * COLOR_SIZE);
        return new ImageData(imgData, this.renderSize.width, this.renderSize.height);
    }

    private getString(str_ptr: number, len: number): string {
        const bytes = new Uint8Array(this.exports.memory.buffer, str_ptr, len);
        return this.textDecoder.decode(bytes);
    }
}