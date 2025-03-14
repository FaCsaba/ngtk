import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AgentWasm } from "../agent";
import { getKeyMapFromKeyEvent } from "@/models/key-map.model";

const AgentTextBuffHeight = 420;

function useRefSize<T extends HTMLElement>(ref: React.RefObject<T>) {
    const [size, setSize] = useState<[number, number]>([0, 0]);
    useLayoutEffect(() => {
        function updateSize() {
            setSize([ref.current?.clientWidth ?? 0, ref.current?.clientHeight ?? 0]);
        }
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);
    return size;
}


export const NeographyPreviewer = ({ agent }: { agent: AgentWasm }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const containerSize = useRefSize(containerRef);

    useEffect(() => {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx === undefined) return;
        if (ctx === null) throw new Error("Your browser does not support canvases");
        agent.setCanvas(ctx);
        agent.renderText();
    }, [canvasRef]);

    useEffect(() => {
        const [width, height] = containerSize;
        const timeout = setTimeout(() => agent.resize({ width, height }), 500);
        return () => clearTimeout(timeout);
    }, [containerSize]);


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

    return <div ref={containerRef}>
        <h3>Preview: </h3>
        <canvas
            className="focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 rounded-xl border bg-card text-card-foreground shadow"
            tabIndex={0}
            onKeyDown={onKeyDown}
            width={containerSize[0]}
            height={AgentTextBuffHeight}
            ref={canvasRef}
        />
    </div>
}