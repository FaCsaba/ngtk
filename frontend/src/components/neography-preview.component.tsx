import { AgentWasm } from "../agent";

const AgentTextBuffWidth = 420;
const AgentTextBuffHeight = 420;

export const NeographyPreviewer = ({ agent }: { agent: AgentWasm }) => {
    return <div>
        <h3>Preview: </h3>
        <canvas
            className="border-4 border-solid border-black rounded-xl"
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent<HTMLCanvasElement>) => agent.addChar(e.key)}
            width={AgentTextBuffWidth}
            height={AgentTextBuffHeight}
            ref={(r) => agent.setCanvas(r?.getContext("2d")!)}
        />
    </div>
}