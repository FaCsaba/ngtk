import {Component} from 'react';

import PropertyGroup from './PropertyGroup';
import Columns from './Columns';
import Column from './Column';
import { DesignerObject } from '../DesignerObject';

export interface SizePanelProps {
  object: DesignerObject;
  onChange: (property: string) => void;
}

export default class SizePanel extends Component<SizePanelProps> {
  render() {
    let {object} = this.props;
    return (
      <PropertyGroup object={object}>
        {object.width && object.height && <Columns label="Size">
          <Column showIf={!!object.width}
                  label="width" value={object.width}
                  onChange={this.props.onChange.bind(this, 'width')} />
          <Column showIf={!!object.height} label="height"
                  value={object.height}
                  onChange={this.props.onChange.bind(this, 'height')} />
        </Columns>}
        <Columns label="Position">
          <Column showIf={!!object.x}
                  label="top" value={object.x}
                  onChange={this.props.onChange.bind(this, 'x')} />
          <Column showIf={!!object.y} label="top" value={object.y}
                  onChange={this.props.onChange.bind(this, 'y')} />
        </Columns>
        {object.rotate && <Columns label="Rotation">
          <Column label="angle" value={object.rotate}
                  onChange={this.props.onChange.bind(this, 'rotate')} />
        </Columns>}
      </PropertyGroup>
    );
  }
}
