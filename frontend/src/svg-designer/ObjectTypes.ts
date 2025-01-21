import { DesignerObjectType } from "./DesignerObject";
import Vector from "./objects/Vector";

export type ObjectTypes = {
    [key in DesignerObjectType]: Vector<key>
}