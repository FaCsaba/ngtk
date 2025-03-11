import React, {Component} from 'react';
import _ from 'lodash';
import styles from './styles';

class PanelList extends Component {
  render() {
    let {object, objectComponent, id} = this.props;

    return (
      <div style={{...styles.propertyPanel}}>
        {objectComponent.panels.map((Panel, i) => <Panel key={i} id={id} {...this.props} />)}
      </div>
    );
  }
};

export default PanelList;
