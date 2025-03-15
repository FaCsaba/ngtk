import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AgentWasm } from "../agent";
import { getKeyMapFromKeyEvent } from "@/models/key-map.model";
import { ColorScheme, colorSchemeFromHsl } from "@/models/color-scheme.model";
import { useTheme } from "./theme-provider.component";

const AgentTextBuffHeight = 420;

function useRefSize<T extends HTMLElement>(ref: React.RefObject<T>): [number, number] {
    const [size, setSize] = useState<[number, number]>([AgentTextBuffHeight, AgentTextBuffHeight]);
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

function useColorScheme(): ColorScheme | undefined {
    const { theme } = useTheme();
    const [scheme, setScheme] = useState<ColorScheme>();
    useEffect(() => {
        const bgHsl = getComputedStyle(document.body).getPropertyValue('--card');
        const fgHsl = getComputedStyle(document.body).getPropertyValue('--card-foreground');
        setScheme(colorSchemeFromHsl(bgHsl, fgHsl));
    }, [theme]);
    return scheme;
}

export const NeographyPreviewer = ({ agent }: { agent: AgentWasm }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const containerSize = useRefSize(containerRef);
    const colorScheme = useColorScheme();

    useEffect(() => {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx === undefined) return;
        if (ctx === null) throw new Error("Your browser does not support canvases");
        agent.setCanvas(ctx);
        if (colorScheme) agent.setColor(colorScheme);
        agent.renderText();
    }, [canvasRef, colorScheme]);

    useEffect(() => {
        const [width, height] = containerSize;
        agent.resize({ width, height });
    }, [containerSize]);

    function onKeyDown(e: React.KeyboardEvent): void {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === "Backspace") {
            agent.removeChar();
            return;
        }

        if (e.key === "Enter") {
            agent.addChar("\n");
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