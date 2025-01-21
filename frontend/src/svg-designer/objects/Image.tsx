import { DesignerObjectType } from '../DesignerObject';
import Icon, { IconType } from '../Icon';

import Vector from './Vector';

export default class Image extends Vector<DesignerObjectType.Image> {
  static meta = {
    icon: <Icon icon={IconType.Image} size={30} />,
    initial: {
      width: 100,
      height: 100,
      // Just a simple base64-encoded outline
      xlinkHref: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAhSURBVHgBtYmxDQAADII8lv9faBNH4yoJLAi4ppxgMZoPoxQrXYyeEfoAAAAASUVORK5CYII="
    }
  };

  render() {
    let {object} = this.props;

    return (
      <image
         {...this.getObjectAttributes()}
         path={undefined}
         width={object.width}
         height={object.height} />
    );
  }
}
