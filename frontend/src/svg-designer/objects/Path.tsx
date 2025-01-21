import Icon, { IconType } from '../Icon';

import Vector from './Vector';
import BezierEditor from '../editors/BezierEditor';
import { DesignerMode } from '../Modes';
import { DesignerObjectPath, DesignerObjectType } from '../DesignerObject';

export default class Path extends Vector<DesignerObjectType.Path> {
  static meta = {
    initial: {
      fill: "#e3e3e3",
      closed: false,
      rotate: 0,
      moveX: 0,
      moveY: 0,
      path: [],
      stroke: "gray",
      strokeWidth: 1
    },
    mode: DesignerMode.DRAW,
    icon: <Icon icon={IconType.Polygon} size={30} />,
    editor: BezierEditor
  };

  buildPath(object: DesignerObjectPath) {
    let {path} = object;
    
    let curves = path.map(({x1, y1, x2, y2, x, y}) => (
      `C ${x1} ${y1}, ${x2} ${y2}, ${x} ${y}`
    ));

    let instructions = [
      `M ${object.moveX} ${object.moveY}`,
      ...curves
    ];

    if (object.closed) {
      instructions = [
        ...instructions, 'Z'
      ];
    }

    return instructions.join('\n');
  }

  getTransformMatrix({rotate, x, y, moveX, moveY}: DesignerObjectPath) {
    return `
      translate(${x - moveX} ${y - moveY})
      rotate(${rotate} ${x} ${y})
    `;
  }

  render() {
    let {object} = this.props;
    let fill = (object.closed ? object.fill
                              : "transparent");
    return (
      <path style={this.getStyle()}
         {...this.getObjectAttributes()}
         path={undefined}
         d={this.buildPath(object)}
         fill={fill} />
    );
  }
}
