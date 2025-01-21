import { Component, CSSProperties, MouseEventHandler, useState } from 'react';

export interface ScaleAnchorProps {
  boundingBox: { height: number; width: number; };
  onMouseDown: () => void;
}

export function ScaleAnchor(props: ScaleAnchorProps) {
  let { boundingBox } = props;
  let style = {
    marginTop: boundingBox.height + 5,
    marginLeft: boundingBox.width + 5
  };
  let [anchorHovered, setAnchorHovered] = useState(false);
  return (
    <div style={{
      ...styles.anchor,
      ...anchorHovered ? styles.anchorHovered : {},
      ...styles.scaleAnchor,
      ...style
    }}
      className={'resize-anchor'}
      onMouseOver={() => setAnchorHovered(true)}
      onMouseOut={() => setAnchorHovered(false)}
      onMouseDown={props.onMouseDown} />
  );
};

export interface RotateAnchorProps {
  boundingBox: { height: number; width: number; };
  onMouseDown: () => void;
}

export function RotateAnchor(props: RotateAnchorProps) {
  let style = {
    marginLeft: props.boundingBox.width + 5
  };
  let [anchorHovered, setAnchorHovered] = useState(false);
  return (
    <div style={{
      ...styles.anchor,
      ...anchorHovered ? styles.anchorHovered : {},
      ...styles.rotateAnchor,
      ...style
    }}
      className={'rotate-anchor'}
      onMouseOver={() => setAnchorHovered(true)}
      onMouseOut={() => setAnchorHovered(false)}
      onMouseDown={props.onMouseDown} />
  )
};

export interface HandlerProps {
  boundingBox: { left: number; top: number; rotate: number; height: number; width: number; };
  onMouseLeave: () => void;
  onDoubleClick: () => void;
  onRotate: () => void;
  onResize: () => void;
  canRotate: boolean;
  canResize: boolean;
  onDrag: MouseEventHandler<HTMLDivElement>;
}

export default class Handler extends Component<HandlerProps> {
  onMouseDown: MouseEventHandler<HTMLDivElement> = (event) => {
    // event.preventDefault();

    if (event.currentTarget.classList.contains('handler')) {
      this.props.onDrag(event);
    }
  }

  render() {
    let props = this.props;
    let { boundingBox } = this.props;

    let handlerStyle = {
      ...styles.handler,
      ...boundingBox,
      rotate: undefined,
      width: boundingBox.width + 10,
      height: boundingBox.height + 10,
      left: boundingBox.left - 5,
      top: boundingBox.top - 5,
      transform: `rotate(${boundingBox.rotate}deg)`
    };

    return (
      <div className={'handler'}
        style={handlerStyle}
        onMouseLeave={props.onMouseLeave}
        onDoubleClick={props.onDoubleClick}
        onMouseDown={this.onMouseDown.bind(this)}>
        {props.canRotate &&
          <RotateAnchor onMouseDown={props.onRotate}
            boundingBox={boundingBox} />}
        {props.canResize &&
          <ScaleAnchor onMouseDown={props.onResize}
            boundingBox={boundingBox} />}
      </div>
    );
  }
}

const styles: { [key in string]: CSSProperties } = {
  handler: {
    'position': 'absolute',
    'border': '2px solid #dedede',
    'zIndex': 999999
  },
  anchor: {
    'width': 10,
    'height': 10
  },
  anchorHovered: {
    'borderColor': 'gray'
  },
  scaleAnchor: {
    'marginTop': -3,
    'borderRight': '2px solid #dedede',
    'borderBottom': '2px solid #dedede',
    'position': 'absolute',
    'zIndex': -1
  },
  rotateAnchor: {
    'marginTop': -8,
    'borderRight': '2px solid #dedede',
    'borderTop': '2px solid #dedede',
    'position': 'absolute',
    'borderTopRightRadius': 3,
    'zIndex': -1
  }
};