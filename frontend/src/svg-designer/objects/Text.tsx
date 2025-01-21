import Icon, { IconType } from '../Icon';
import Vector from './Vector';
import WebFont from 'webfontloader';
import { DesignerObjectText, DesignerObjectType } from '../DesignerObject';
import { CSSProperties } from 'react';

export default class Text extends Vector<DesignerObjectType.Text> {
  static meta = {
    icon: <Icon icon={IconType.Text} size={30} />,
    initial: {
      text: "Type some text...",
      rotate: 0,
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
      fill: "black",
      fontSize: 20,
      fontFamily: "Open Sans"
    }
  };

  getStyle(): CSSProperties {
    let { object } = this.props;
    return {
      ...super.getStyle(),
      dominantBaseline: "central",
      fontWeight: object.fontWeight,
      fontStyle: object.fontStyle,
      textDecoration: object.textDecoration,
      mixBlendMode: object.blendMode,
      WebkitUserSelect: "none"
    };
  }

  getTransformMatrix({ rotate, x, y }: DesignerObjectText) {
    return `rotate(${rotate} ${x} ${y})`;
  }

  render() {
    let { object } = this.props;
    WebFont.load({
      google: {
        families: [object.fontFamily]
      }
    });
    const { rotate, ...restOfAttributes } = this.getObjectAttributes()
    return (
      <text style={this.getStyle()}
        {...restOfAttributes}
        path={undefined}
        textAnchor="right"
        fontSize={object.fontSize}
        fontFamily={object.fontFamily}>
        {object.text}
      </text>
    );
  }
}
