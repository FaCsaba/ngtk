import { Component, CSSProperties } from 'react';
import { ObjectTypes } from './ObjectTypes';
import { DesignerObject, DesignerObjectType } from './DesignerObject';

export interface SVGRendererProps {
  background: string;
  width: number;
  canvas: {
    width: number;
    height: number;
    canvasWidth: number;
    canvasHeight: number;
    canvasOffsetX: number;
    canvasOffsetY: number;
  };
  height: number;
  objects: DesignerObject[];
  onMouseOver: (i: number) => void;
  objectTypes: Partial<ObjectTypes>
  objectRefs: SVGElement[];
  onRender: (ref: SVGSVGElement) => void;
  onMouseDown: () => void;
  svgStyle: CSSProperties;
}

export default class SVGRenderer extends Component<SVGRendererProps> {
  static defaultProps = {
    onMouseOver() { }
  };

  getObjectComponent(type: DesignerObjectType) {
    let { objectTypes } = this.props;
    return objectTypes[type];
  }

  renderObject(object: DesignerObject, index: number) {
    let { objectRefs, onMouseOver } = this.props;
    let Renderer = this.getObjectComponent(object.type);
    if (Renderer === undefined) throw new Error("Unreachable");
    return (
      <Renderer onRender={(ref: SVGElement) => objectRefs[index] = ref}
        onMouseOver={onMouseOver.bind(this, index)}
        object={object} key={index} index={index} />
    );
  }

  render() {
    let { background, objects, svgStyle, canvas,
      onMouseDown, onRender } = this.props;
    let { width, height, canvasOffsetX, canvasOffsetY } = canvas;

    let style = {
      ...styles.canvas,
      ...background ? {
        backgroundColor: background
      } : styles.grid,
      ...{
        ...svgStyle,
        marginTop: canvasOffsetY,
        marginLeft: canvasOffsetX
      }
    };

    return (
      <svg onMouseDown={onMouseDown}
        ref={onRender}
        width={width}
        height={height}
        style={style}
      >
        {objects.map(this.renderObject.bind(this))}
      </svg>
    );
  }
}

export const styles = {
  canvas: {
    backgroundSize: 400
  },
  grid: {
    backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5'
      + 'vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0'
      + 'PSIyMCIgZmlsbD0iI2ZmZiI+PC9yZWN0Pgo8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9I'
      + 'iNGN0Y3RjciPjwvcmVjdD4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIG'
      + 'ZpbGw9IiNGN0Y3RjciPjwvcmVjdD4KPC9zdmc+)',
    backgroundSize: "auto"
  }
};