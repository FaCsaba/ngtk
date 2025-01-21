import { DesignerObjectType } from '../DesignerObject';
import Icon, { IconType } from '../Icon';

import Vector from './Vector';

export default class Rect extends Vector<DesignerObjectType.Rect> {
  static meta = {
    icon: <Icon icon={IconType.Rectangle} size={30} />,
    initial: {
      width: 5,
      height: 5,
      strokeWidth: 0,
      fill: "blue",
      radius: 0,
      blendMode: "normal",
      rotate: 0
    }
  };

  render() {
    let {object} = this.props;
    return (
      <rect style={this.getStyle()}
         {...this.getObjectAttributes()}
         path={undefined}
         rx={object.radius}
         width={object.width}
         height={object.height} />
    );
  }
}