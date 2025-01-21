import { DesignerObject } from "../DesignerObject";
import { ActionParams } from "./Action";

export default function drag({ object, startPoint, mouse }: ActionParams): DesignerObject {
  return {
    ...object,
    x: mouse.x - (startPoint.clientX - startPoint.objectX),
    y: mouse.y - (startPoint.clientY - startPoint.objectY)
  };
};
