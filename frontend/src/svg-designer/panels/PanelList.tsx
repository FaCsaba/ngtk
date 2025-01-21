import {Component} from 'react';

import styles from './styles';
import Vector from '../objects/Vector';

export interface PanelListProps {
  id: string;
}

class PanelList extends Component<PanelListProps> {
  render() {
    let {id} = this.props;

    return (
      <div style={{...styles.propertyPanel}}>
        {Vector.panels.map((Panel, i) => <Panel key={i} {...this.props} id={id} />)}
      </div>
    );
  }
};

export default PanelList;
