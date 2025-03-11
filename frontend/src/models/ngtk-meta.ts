import { toBytes } from "@/lib/utils";
import { Glyph } from "./glyph.model";
import { KeyMap } from "./key-map.model";

/**
 * NGTK Meta data
 * 
 * This encodes the information necessary to translate a keystroke into a character that can be displayed
 * 
 * The encoded format is the following
 * | type     | name    | description                           |
 * |------------------------------------------------------------|
 * | u8       | version | version of the metadata               |
 * | u32      | length  | length of the keymap array            |
 * | keymap[] | keymaps | an array of keymaps indexed by length |
 * 
 * Keymaps are encoded as follows
 * | type | name | description                    |
 * |----------------------------------------------|
 * | u8   | mods | bitmap of modifier keys        |
 * | u16  | key  | the actual key                 |
 * | u32  | char | the character this key maps to |
 */
export class NgtkMeta {
    private static readonly NgtkMetaVersion = 1;

    public constructor(
        private glyphs: Glyph[]
    ) { }

    public encode(): number[] {
        const version = toBytes(NgtkMeta.NgtkMetaVersion, 1);
        const keyMapLength = toBytes(this.glyphs.length, 4);
        const keyMaps = this.glyphs.reduce<number[]>((m, glyph, i) => m.concat(this.encodeKeyMap(glyph.keyMap!, 0xE000 + i)), []);
        return version.concat(keyMapLength).concat(keyMaps);
    }

    private encodeKeyMap(keyMap: KeyMap, char: number): number[] {
        const mods = toBytes(keyMap.mods, 1);
        const key = toBytes(keyMap.key, 2);
        const charB = toBytes(char, 4);
        return mods.concat(key).concat(charB);
    }
}