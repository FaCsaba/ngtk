import { useEffect } from "react";
import { AgentWasm } from "../agent";
import { useTheme } from "./theme-provider.component";

const AgentTextBuffWidth = 420;
const AgentTextBuffHeight = 420;

export const NeographyPreviewer = ({ agent }: { agent: AgentWasm }) => {
    const theme = useTheme();
    useEffect(() => {
        agent.renderText();
        theme.setTheme('dark');
    }, []);

    return <div>
        <h3>Preview: </h3>
        <canvas
            className="rounded-xl border bg-card text-card-foreground shadow"
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent<HTMLCanvasElement>) => agent.addChar(e.key)}
            width={AgentTextBuffWidth}
            height={AgentTextBuffHeight}
            ref={(r) => agent.setCanvas(r?.getContext("2d")!)}
        />
    </div>
}