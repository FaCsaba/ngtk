import { Component, MouseEventHandler } from 'react';
import { ColorResult, SketchPicker } from 'react-color';

import styles from './styles';

class ColorInput extends Component<{ onChange: (rgb: string) => void; value: string }> {
  state = {
    show: false
  };

  toggleVisibility: MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (event.preventDefault) {
      event.preventDefault();
    }

    let { show } = this.state;
    this.setState({
      show: !show
    })
  }

  handleChange = (color: ColorResult) => {
    let { r, g, b, a } = color.rgb;
    this.props.onChange(`rgba(${r}, ${g}, ${b}, ${a})`);
  }

  handleClose: MouseEventHandler<HTMLDivElement> = (event) => {
    if (event.preventDefault) {
      event.preventDefault();
    }

    this.setState({
      show: false
    })
  }

  render() {
    let { show } = this.state;
    let { value } = this.props;

    return (
      <div>
        <a href="#"
          style={styles.colorInput}
          onClick={this.toggleVisibility.bind(this)}>
          <span style={{ ...styles.color, backgroundColor: value }} />
        </a>
        {show && <div style={styles.colorPopover}>
          <div style={styles.colorCover} onClick={this.handleClose} />
          <SketchPicker
            color={value}
            onChange={this.handleChange}
          />
        </div>}
      </div>
    );
  }
}

export default ColorInput;
