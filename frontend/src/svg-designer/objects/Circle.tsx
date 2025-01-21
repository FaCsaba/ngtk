import { DesignerObjectType } from '../DesignerObject';
import Icon, { IconType } from '../Icon';

import Vector from './Vector';

export default class Circle extends Vector<DesignerObjectType.Cirle> {
  static meta = {
    icon: <Icon icon={IconType.Circle} size={30} />,
    initial: {
      width: 5,
      height: 5,
      rotate: 0,
      fill: "yellow",
      strokeWidth: 0,
      blendMode: "normal"
    }
  };

  render() {
    let {object} = this.props;
    return (
      <ellipse style={this.getStyle()}
         {...this.getObjectAttributes()}
         path={undefined}
         rx={object.width! / 2}
         ry={object.height! / 2}
         cx={object.x! + object.width! / 2}
         cy={object.y! + object.height! / 2} />
    );
  }
}