import { AgentWasm } from "../agent"

const AgentTextBuffWidth = 420;
const AgentTextBuffHeight = 420;

export const NeographyPreviewer = ({ agent }: { agent: AgentWasm }) => {
    return <div>
        <input onInput={(e) => agent.renderText((e.target as any).value)} />
        <canvas width={AgentTextBuffWidth} height={AgentTextBuffHeight} ref={(r) => agent.setCanvas(r?.getContext("2d")!)}></canvas>
    </div>
}