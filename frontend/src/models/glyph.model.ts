import { UUID } from "crypto";
import { KeyMap } from "./key-map.model";

export interface Glyph {
    uuid: UUID;
    svg: string;
    objs: any[];
    keyMap?: KeyMap; 
}