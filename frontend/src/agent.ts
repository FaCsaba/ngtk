import createAgentWasm from "./assets/agent.wasm?init";
import BloodyTerror from "./assets/BloodyTerror-GOW9Z.ttf";

type ptr = number;

interface Slice {
    ptr: ptr;
    len: number;
}

export interface AgentExports {
    agent_init: () => ptr;
    agent_load_font: (agent: ptr, buf: ptr, buf_len: number) => void;
    agent_get_font_atlas: (agent: ptr) => ptr;
    malloc: (size: number) => ptr;
    memory: WebAssembly.Memory;
}

export class AgentWasm {
    private wasm!: WebAssembly.Instance;
    private agent_ptr!: number;
    private exports!: AgentExports;

    private makeEnvironment(env: any) {
        return new Proxy(env, {
            get(_target, prop, _receiver) {
                if (env[prop] !== undefined) return env[prop].bind(this)
                return (...args: any) => { throw new Error(`NOT IMPLEMENTED: ${prop as string}, args: ${args}`) }
            }
        });
    }

    private getString(mem_buffer: ArrayBuffer, str_ptr: number): string {
        const mem = new Uint8Array(mem_buffer);
        let len = 0;
        let ptr = str_ptr;
        while (mem[ptr] != 0) {
            len++;
            ptr++;
        }
        const bytes = new Uint8Array(mem_buffer, str_ptr, len);
        return new TextDecoder().decode(bytes);
    }

    public static async new(): Promise<AgentWasm> {
        const a = new AgentWasm();
        a.wasm = await createAgentWasm({
            env: a.makeEnvironment({
                _print: (str_ptr: number) => { console.log(a.getString((<any>a.wasm.exports.memory).buffer, str_ptr)); },
                _panic: (str_ptr: number) => { throw new Error(a.getString((<any>a.wasm.exports.memory).buffer, str_ptr)); },
            }),
        });
        a.exports = a.wasm.exports as unknown as AgentExports;
        debugger;
        a.agent_ptr = a.exports.agent_init();
        const font = await fetch(BloodyTerror).then(res => res.arrayBuffer());
        const fontAlloc = a.malloc(font.byteLength);
        const fontView = new Uint8Array(a.exports.memory.buffer, fontAlloc.ptr, fontAlloc.len);
        fontView.set(new Uint8Array(font, 0, fontAlloc.len));
        a.exports.agent_load_font(a.agent_ptr, fontAlloc.ptr, fontAlloc.len);
        const img = a.exports.agent_get_font_atlas(a.agent_ptr);
        debugger;

        (<HTMLImageElement>document.getElementById("testImg")).src = `data:image/bmp;base64,${img.toBase64()}`;
        // const icedsoda = await fetch(IcedSoda).then(resp => resp.arrayBuffer());
        // const buff = new Uint8Array(a.agent_buff);
        // buff.set(new Uint8Array(icedsoda, icedsoda.byteLength));
        // (<Function>a.agent.exports.load_font)(buff.byteOffset, buff.byteLength);
        return a
    }

    private malloc(len: number): Slice {
        const ptr = this.exports.malloc(len);
        return { ptr, len };
    }
}