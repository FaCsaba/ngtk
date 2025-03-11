import { UUID } from "crypto";
import { KeyMap } from "./key-map.model";

export interface Glyph {
    uuid: UUID;
    svg?: SVGElement;
    objs: any[];
    keyMap?: KeyMap; 
}