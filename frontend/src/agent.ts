import createAgentWasm from "./assets/agent.wasm?init";
import { KeyMap } from "./models/key-map.model";

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
    agent_put_key: (agent: ptr, mod: number, key: number) => void;
    agent_has_key: (agent: ptr, mod: number, key: number) => boolean;
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
        this.ctx?.clearRect(0, 0, AgentWasm.RENDERED_TEXT_WIDTH, AgentWasm.RENDERED_TEXT_HEIGHT)
        const imgPtr = this.exports.agent_render_text(this.agentPtr);
        const img = this.imgFromAlpha(imgPtr);
        this.ctx?.putImageData(img, 0, 0);
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

    private imgFromAlpha(imgPtr: ptr): ImageData {
        const imgAlpha = new Uint8Array(this.exports.memory.buffer, imgPtr, AgentWasm.RENDERED_TEXT_HEIGHT * AgentWasm.RENDERED_TEXT_WIDTH);
        const imgData = new Uint8ClampedArray(imgAlpha.length * 4);
        const bgHsl = getComputedStyle(document.body).getPropertyValue('--card');
        const bg = hslToRgb(bgHsl);
        const fgHsl = getComputedStyle(document.body).getPropertyValue('--card-foreground');
        const fg = hslToRgb(fgHsl);

        for (let i = 0; i < imgAlpha.length; i++) {
            const alpha = imgAlpha[i] / 255;

            imgData[i * 4 + 0] = (1 - alpha) * bg.r + alpha * fg.r; // r
            imgData[i * 4 + 1] = (1 - alpha) * bg.g + alpha * fg.g; // g
            imgData[i * 4 + 2] = (1 - alpha) * bg.b + alpha * fg.b; // b
            imgData[i * 4 + 3] = 255;                               // a
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

function hslToRgb(hsl: string) {
    const [hstr, sstr, lstr] = hsl.split(" ")
    const h = Number(hstr);
    const s = Number(sstr.split("%")[0]) / 100;
    const l = Number(lstr.split("%")[0]) / 100;

    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c / 2,
        r = 0,
        g = 0,
        b = 0;

    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return { r, g, b };
}