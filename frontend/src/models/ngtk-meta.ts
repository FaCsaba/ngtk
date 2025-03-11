import { toBytes } from "@/lib/utils";
import { encodeKeyMap, KeyMap } from "./key-map.model";

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
 * | type | name | description             |
 * |---------------------------------------|
 * | u8   | mods | bitmap of modifier keys |
 * | u16  | key  | the actual key          |
 */
export class NgtkMeta {
    private static readonly NgtkMetaVersion = 1;

    public constructor(
        private keyMaps: KeyMap[]
    ) { }

    public encode(): number[] {
        let meta: number[] = [];
        meta = meta.concat(toBytes(NgtkMeta.NgtkMetaVersion, 1));
        meta = meta.concat(toBytes(this.keyMaps.length, 4));
        this.keyMaps.forEach(keyMap => {
            meta = meta.concat(encodeKeyMap(keyMap))
        })
        return meta;
    }
}