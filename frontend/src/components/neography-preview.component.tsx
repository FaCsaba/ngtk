import { useEffect } from "react";
import { AgentWasm } from "../agent";
import { getKeyMapFromKeyEvent } from "@/models/key-map.model";

const AgentTextBuffWidth = 420;
const AgentTextBuffHeight = 420;

export const NeographyPreviewer = ({ agent }: { agent: AgentWasm }) => {
    useEffect(() => {
        agent.renderText();
    }, []);

    function onKeyDown(e: React.KeyboardEvent): void {
        if (e.key === "Backspace") {
            agent.removeChar();
            return;
        }

        const keyMap = getKeyMapFromKeyEvent(e);
        if (keyMap && agent.hasKey(keyMap)) {
            agent.putKey(keyMap);
        } else if (e.key.length === 1) {
            agent.addChar(e.key);
        }

    }

    return <div>
        <h3>Preview: </h3>
        <canvas
            className="focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 rounded-xl border bg-card text-card-foreground shadow"
            tabIndex={0}
            onKeyDown={onKeyDown}
            width={AgentTextBuffWidth}
            height={AgentTextBuffHeight}
            ref={(r) => agent.setCanvas(r?.getContext("2d")!)}
        />
    </div>
}