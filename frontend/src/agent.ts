import createAgentWasm from "./assets/agent.wasm?init";
import DigitaltsLime from "./assets/DigitaltsLime.ttf";

type ptr = number;

interface Slice {
    ptr: ptr;
    len: number;
}

export interface AgentExports {
    agent_init: () => ptr;
    agent_load_font: (agent: ptr, buf: ptr, buf_len: number) => void;
    agent_get_font_atlas: (agent: ptr) => ptr;
    agent_render_text: (agent: ptr, str: ptr, str_len: number) => ptr;
    malloc: (size: number) => ptr;
    free: (buf: ptr) => void;
    memory: WebAssembly.Memory;
}

export class AgentWasm {
    private readonly RENDERED_TEXT_WIDTH = 420;
    private readonly RENDERED_TEXT_HEIGHT = 420;

    private wasm!: WebAssembly.Instance;
    private agentPtr!: number;
    private exports!: AgentExports;
    private fontAlloc?: Slice;
    private ctx!: CanvasRenderingContext2D;

    private makeEnvironment(env: any) {
        return new Proxy(env, {
            get(_target, prop, _receiver) {
                if (env[prop] !== undefined) return env[prop].bind(this)
                return (...args: any) => { throw new Error(`NOT IMPLEMENTED: ${prop as string}, args: ${args}`) }
            }
        });
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

    public static async new(): Promise<AgentWasm> {
        const a = new AgentWasm();
        a.ctx = (<HTMLCanvasElement>document.getElementById("agentText")).getContext("2d")!;
        a.wasm = await createAgentWasm({
            env: a.makeEnvironment({
                _print: (str_ptr: number) => { console.log(a.getString(str_ptr)); },
                _panic: (str_ptr: number) => { throw new Error(a.getString(str_ptr)); },
            }),
        });
        a.exports = a.wasm.exports as unknown as AgentExports;
        debugger;
        a.agentPtr = a.exports.agent_init();
        const font = await fetch(DigitaltsLime).then(res => res.arrayBuffer());
        a.load_font(font);
        a.renderText("tükörfúrógép");

        // (<HTMLImageElement>document.getElementById("testImg")).src = `data:image/bmp;base64,${imgPtr.toBase64()}`;
        // const icedsoda = await fetch(IcedSoda).then(resp => resp.arrayBuffer());
        // const buff = new Uint8Array(a.agent_buff);
        // buff.set(new Uint8Array(icedsoda, icedsoda.byteLength));
        // (<Function>a.agent.exports.load_font)(buff.byteOffset, buff.byteLength);
        return a
    }

    private load_font(font: ArrayBuffer): void {
        this.fontAlloc = this.malloc(font.byteLength);

        // Copy the font into wasm memory
        const fontView = new Uint8Array(this.exports.memory.buffer, this.fontAlloc.ptr, this.fontAlloc.len);
        fontView.set(new Uint8Array(font, 0, this.fontAlloc.len));

        this.exports.agent_load_font(this.agentPtr, this.fontAlloc.ptr, this.fontAlloc.len);
    }

    private malloc(len: number): Slice {
        const ptr = this.exports.malloc(len);
        return { ptr, len };
    }

    private free(buf: ptr): void {
        this.exports.free(buf);
    }

    public renderText(text: string): void {
        const textU8 = new TextEncoder().encode(text);
        const textAlloc = this.malloc(textU8.length);

        const textView = new Uint8Array(this.exports.memory.buffer, textAlloc.ptr, textAlloc.len);
        textView.set(textU8);

        const imgPtr = this.exports.agent_render_text(this.agentPtr, textAlloc.ptr, textAlloc.len);

        this.free(textAlloc.ptr);
        const img = this.imgFromAlpha(imgPtr);
        this.ctx.putImageData(img, 0, 0);
    }

    private imgFromAlpha(imgPtr: ptr): ImageData {
        const imgAlpha = new Uint8Array(this.exports.memory.buffer, imgPtr, this.RENDERED_TEXT_HEIGHT * this.RENDERED_TEXT_WIDTH);
        const imgData = new Uint8ClampedArray(imgAlpha.length*4);
        for (let i = 0; i < imgAlpha.length; i++) {
            imgData[i * 4 + 0] = 0;
            imgData[i * 4 + 1] = 0;
            imgData[i * 4 + 2] = 0;
            imgData[i * 4 + 3] = imgAlpha[i];
        }
        return new ImageData(imgData, this.RENDERED_TEXT_WIDTH);
    }
}