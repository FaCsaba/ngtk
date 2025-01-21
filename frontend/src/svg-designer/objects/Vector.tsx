import { Component, CSSProperties, Ref } from 'react';
import { DesignerObject, DesignerObjectType } from '../DesignerObject';
import SizePanel from '../panels/SizePanel';
import TextPanel from '../panels/TextPanel';
import StylePanel from '../panels/StylePanel';
import ImagePanel from '../panels/ImagePanel';
import ArrangePanel from '../panels/ArrangePanel';
import Icon from "../Icon";

export default class Vector<T extends DesignerObjectType> extends Component<{ object: DesignerObject & { type: T }; onRender: Ref<any> }> {
  public meta!: { icon: typeof Icon; initial: DesignerObject & { type: T }, editor?: Component };

  public static readonly panels = [
    SizePanel,
    TextPanel,
    StylePanel,
    ImagePanel,
    ArrangePanel
  ];

  getStyle(): CSSProperties {
    let { object } = this.props;
    return {
      mixBlendMode: object.blendMode
    }
  }

  getTransformMatrix({ rotate, x, y, width, height }: DesignerObject & { type: T }) {
    if (!(rotate && width && height && x && y)) return;
    let centerX = width / 2 + x;
    let centerY = height / 2 + y;
    return `rotate(${rotate} ${centerX} ${centerY})`;
  }

  getObjectAttributes() {
    let { object, onRender, ...rest } = this.props;
    return {
      ...object,
      transform: this.getTransformMatrix(object),
      ref: onRender,
      ...rest
    };
  }
}
