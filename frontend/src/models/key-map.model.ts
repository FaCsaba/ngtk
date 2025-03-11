import { toBytes } from "@/lib/utils";
import { encodeKey, Key } from "./key.enum";

export interface KeyMap {
    mods: number;
    key: Key;
}

export function encodeKeyMap(keyMap: KeyMap): number[] {
    const mods = toBytes(keyMap.mods, 1);
    return mods.concat(encodeKey(keyMap.key));
}