import { DesignerObject } from "../DesignerObject";
import Point from "../Point";
import StartPoint from "../StartPoint";

export interface ActionParams {
    object: DesignerObject;
    mouse: Point;
    startPoint: StartPoint;
    objectIndex: number;
    objectRefs: Record<number, SVGElement>;
}

export type Action = (params: ActionParams) => DesignerObject;