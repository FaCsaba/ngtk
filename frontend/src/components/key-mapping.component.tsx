import { cn } from "@/lib/utils";
import { Glyph } from "@/models/glyph.model";
import { KeyMap } from "@/models/key-map.model";
import { getHumanReadableFromMod, KeyMod } from "@/models/key-mod.enum";
import { getHumanReadableFromKey, getKeyFromCode } from "@/models/key.enum";
import React, { useState } from "react";

interface KeyMappingProps {
    glyph: Glyph;
    setGlyph: (glyph: Glyph) => void;
}

export function KeyMapping({ glyph, setGlyph, className, ...props }: React.ComponentProps<"div"> & KeyMappingProps) {
    const [isRecording, setIsRecording] = useState(false);

    function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.key === "Enter") {
            setIsRecording(true);
            return;
        }
        if (!isRecording) return;
        const key = getKeyFromCode(e.code);
        if (!key) return;

        var mods = KeyMod.None;
        if (e.shiftKey) mods |= KeyMod.Shift;
        if (e.ctrlKey) mods |= KeyMod.Ctrl;
        if (e.altKey) mods |= KeyMod.Alt;
        const mapping: KeyMap = { key, mods };
        console.log(mapping);
        setGlyph({ ...glyph, keyMap: mapping });
        setIsRecording(false);
    }

    const recClass = isRecording ? "bg-destructive" : "";

    return (
        <div
            className={cn(className, "gap-5 px-5 py-3 cursor-pointer disabled:cursor-not-allowed focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 rounded-xl border bg-card text-card-foreground shadow flex", recClass)}
            tabIndex={0}
            onClick={() => setIsRecording(true)}
            onBlur={() => setIsRecording(false)}
            onKeyDown={onKeyDown}
            {...props}
        >
            <svg className="w-[4rem] h-[4rem]" viewBox="0 0 250 250" ref={(e) => { if (e) e.innerHTML = glyph.svg }} />
            <div className="border-l"></div>
            {glyph.keyMap ? <div className="flex items-center gap-3 text-xl">
                {glyph.keyMap.mods & KeyMod.Ctrl ? <><div className="flex items-center justify-center border w-[6rem] h-[4rem] bg-background shadow rounded-xl">{getHumanReadableFromMod(KeyMod.Ctrl)}</div><p>+</p></> : <></>}
                {glyph.keyMap.mods & KeyMod.Alt ? <><div className="flex items-center justify-center border w-[6rem] h-[4rem] bg-background shadow rounded-xl">{getHumanReadableFromMod(KeyMod.Alt)}</div><p>+</p></> : <></>}
                {glyph.keyMap.mods & KeyMod.Shift ? <><div className="flex items-center justify-center border w-[6rem] h-[4rem] bg-background shadow rounded-xl">{getHumanReadableFromMod(KeyMod.Shift)}</div><p>+</p></> : <></>}
                <div className="flex items-center justify-center w-[4rem] h-[4rem] border bg-background shadow rounded-xl">{getHumanReadableFromKey(glyph.keyMap.key)}</div>
            </div> : <></>}
        </div>
    )
}