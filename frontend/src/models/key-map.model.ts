import { getModsFromKeyEvent } from "./key-mod.enum";
import { getKeyFromCode, Key } from "./key.enum";

export interface KeyMap {
    mods: number;
    key: Key;
}

export function getKeyMapFromKeyEvent(e: React.KeyboardEvent): KeyMap | undefined {
    const key = getKeyFromCode(e.code);
    if (!key) return;

    const mods = getModsFromKeyEvent(e);
    return { key, mods };
}