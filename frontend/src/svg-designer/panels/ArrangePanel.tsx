import {Component} from 'react';
import Icon, { IconType } from '../Icon';
import Button from './Button';
import Columns from './Columns';
import Column from './Column';
import PropertyGroup from './PropertyGroup';

export enum ArrangeDir {
  Front = "front",
  Back = "back"
}

export interface ArrangePanelProps {
  onArrange: (dir: string) => void;
}

export default class ArrangePanel extends Component<ArrangePanelProps> {
  render() {
    return (
      <PropertyGroup>
          <Columns label="Arrange">
            <Column>
              <Button onClick={this.props.onArrange.bind(this, ArrangeDir.Back)}>
                <Icon icon={IconType.SendToBack} />
                <span>send to back</span>
              </Button>
              <Button onClick={this.props.onArrange.bind(this, ArrangeDir.Front)}>
                <Icon icon={IconType.BringToFront} />
                <span>bring to front</span>
              </Button>
            </Column>
          </Columns>
        </PropertyGroup>
    );
  }
}
