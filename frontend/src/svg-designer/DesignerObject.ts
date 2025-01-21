import { CSSProperties } from "react";

export enum DesignerObjectType {
    Text = 'text',
    Rect = 'rect',
    Path = 'path',
    Image = 'image',
    Cirle = 'circle',
}

export type DesignerObjectText = DesignerObjectBase & {
    type: DesignerObjectType.Text;
    text: string;
    fontWeight: CSSProperties['fontWeight'];
    fontStyle: CSSProperties['fontStyle'];
    textDecoration: CSSProperties['textDecoration'];
    fontSize: CSSProperties['fontSize'];
    fontFamily: string;
}

export type DesignerObjectImage = DesignerObjectBase & {
    type: DesignerObjectType.Image;
    xlinkHref: string;
}

export type DesignerObjectCircle = DesignerObjectBase & {
    type: DesignerObjectType.Cirle;
    radius: number;
}

export type DesignerObjectPath = DesignerObjectBase & {
    type: DesignerObjectType.Path;
    path: {x1: number, y1: number, x2: number, y2: number, x: number, y: number}[];
    closed: boolean;
    moveX: number;
    moveY: number;
}

export type DesignerObjectRect = DesignerObjectBase & {
    type: DesignerObjectType.Rect;
    radius: number;
}

export interface DesignerObjectBase {
    x: number;
    y: number;
    width: number;
    height: number;
    rotate: number;
    fill?: CSSProperties['fill'];
    blendMode?: CSSProperties['mixBlendMode'];
    stroke?: CSSProperties['stroke'];
    strokeWidth?: CSSProperties['strokeWidth'];
}

export type DesignerObject = (DesignerObjectText | DesignerObjectImage | DesignerObjectCircle | DesignerObjectRect | DesignerObjectPath);