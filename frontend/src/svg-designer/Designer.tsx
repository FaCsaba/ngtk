import { Component, CSSProperties } from 'react';
import { HotKeys } from 'react-hotkeys';

import InsertMenu from './panels/InsertMenu';
import Handler from './Handler';
import drag from './actions/Dragger';
import rotate from './actions/Rotator';
import scale from './actions/Scaler';
import PanelList from './panels/PanelList';
import { DesignerMode } from './Modes';
import Circle from './objects/Circle';
import Rect from './objects/Rect';
import Text from './objects/Text';
import Path from './objects/Path';
import Image from './objects/Image';
import { DesignerObject, DesignerObjectPath, DesignerObjectType } from './DesignerObject';
import { ObjectTypes } from './ObjectTypes';
import StartPoint from './StartPoint';
import Point from './Point';
import { Action } from './actions/Action';
import SVGRenderer from './SVGRenderer';
import { ArrangeDir } from './panels/ArrangePanel';


export interface DesignerProps {
  id: string;
  objects: DesignerObject[];
  onUpdate: (objects: DesignerObject[]) => void;
  width: number;
  height: number;
  style?: CSSProperties
  background?: string;
  svgStyle?: React.CSSProperties;
  snapToGrid?: number;
  insertMenu?: React.ComponentType<any>;
  objectTypes?: Partial<ObjectTypes>;
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface DesingerState {
  mode: DesignerMode;
  handler: {
    top: number;
    left: number;
    width: number;
    height: number;
    rotate: number;
  };
  currentObjectIndex: number | null;
  selectedObjectIndex: number | null;
  selectedTool: DesignerObjectType | null;
  startPoint: StartPoint | null;
  showHandler: boolean;
}

export class Designer extends Component<DesignerProps> {
  static defaultProps = {
    objectTypes: {
      'text': Text,
      'rectangle': Rect,
      'circle': Circle,
      'polygon': Path,
      'image': Image
    },
    snapToGrid: 1,
    svgStyle: {},
    insertMenu: InsertMenu
  };

  svgElement!: SVGElement;

  state: DesingerState = {
    mode: DesignerMode.FREE,
    handler: {
      top: 200,
      left: 200,
      width: 50,
      height: 50,
      rotate: 0
    },
    currentObjectIndex: null,
    selectedObjectIndex: null,
    selectedTool: null,
    startPoint: null,
    showHandler: false,
  };

  keyMap = {
    'removeObject': ['del', 'backspace'],
    'moveLeft': ['left', 'shift+left'],
    'moveRight': ['right', 'shift+right'],
    'moveUp': ['up', 'shift+up'],
    'moveDown': ['down', 'shift+down'],
    'closePath': ['enter']
  };

  objectRefs: Record<number, SVGElement> = {};

  componentDidMount() {
    this.objectRefs = {};
  }

  showHandler(index: number) {
    let { mode } = this.state;
    let { objects } = this.props;
    let object = objects[index];

    if (mode !== DesignerMode.FREE) {
      return;
    }

    this.updateHandler(index, object);
    this.setState({
      currentObjectIndex: index,
      showHandler: true
    });
  }

  hideHandler() {
    let { mode } = this.state;
    if (mode === DesignerMode.FREE) {
      this.setState({
        showHandler: false
      });
    }
  }

  getStartPointBundle(event: React.MouseEvent<HTMLDivElement>, object?: DesignerObject): StartPoint {
    let { currentObjectIndex } = this.state;
    let { objects } = this.props;
    let mouse = this.getMouseCoords(event);
    if (!object && currentObjectIndex === null) throw new Error("Unreachable");
    object = object || objects[currentObjectIndex as number];
    return {
      clientX: mouse.x,
      clientY: mouse.y,
      objectX: object.x,
      objectY: object.y,
      width: object.width,
      height: object.height,
      rotate: object.rotate
    };
  }

  startDrag(mode: DesignerMode, event: React.MouseEvent<HTMLDivElement>) {
    let { currentObjectIndex } = this.state;
    this.setState({
      mode: mode,
      startPoint: this.getStartPointBundle(event),
      selectedObjectIndex: currentObjectIndex
    });
  }

  resetSelection() {
    this.setState({
      selectedObjectIndex: null
    });
  }

  generateUUID() {
    var d = new Date().getTime();
    if (window.performance && typeof window.performance.now === "function") {
      d += performance.now(); //use high-precision timer if available
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
  }

  newObject(event: React.MouseEvent<HTMLDivElement>) {
    let { mode, selectedTool } = this.state;

    this.resetSelection();

    if (mode !== DesignerMode.DRAW) {
      return;
    }

    if (selectedTool === null) throw new Error("Unreachable");
    let { meta } = this.getObjectComponent(selectedTool);
    let mouse = this.getMouseCoords(event);

    let { objects, onUpdate } = this.props;
    let object = {
      ...meta.initial,
      type: selectedTool,
      x: mouse.x,
      y: mouse.y,
      uuid: this.generateUUID()
    };

    onUpdate([...objects, object] as DesignerObject[]);

    this.setState({
      currentObjectIndex: objects.length,
      selectedObjectIndex: objects.length,
      startPoint: this.getStartPointBundle(event, object as DesignerObject),
      mode: meta.editor ? DesignerMode.EDIT_OBJECT : DesignerMode.SCALE,
      selectedTool: null
    });

  }

  updatePath(object: DesignerObjectPath) {
    let { path } = object;
    let diffX = object.x - object.moveX;
    let diffY = object.y - object.moveY;

    let newPath = path.map(({ x1, y1, x2, y2, x, y }) => ({
      x1: diffX + x1,
      y1: diffY + y1,
      x2: diffX + x2,
      y2: diffY + y2,
      x: diffX + x,
      y: diffY + y
    }));

    return {
      ...object,
      path: newPath,
      moveX: object.x,
      moveY: object.y
    };
  }

  updateObject(objectIndex: number | null, changes: Partial<DesignerObject>/**, updatePath?: boolean*/) {
    let { objects, onUpdate } = this.props;
    onUpdate(objects.map((object, index) => {
      if (index === objectIndex) {
        let newObject = {
          ...object,
          ...changes
        };

        // TODO: investigate why updatePath is unused
        // return updatePath
        // ? this.updatePath(newObject)
        // : newObject;
        return newObject as DesignerObject;
      } else {
        // console.log("ID=> ", object.uuid, "CHANGES :", JSON.stringify(changes))
        return object;
      }
    }));
  }

  getOffset() {
    let parent = this.svgElement.getBoundingClientRect();
    let { canvasWidth, canvasHeight } = this.getCanvas();
    return {
      x: parent.left,
      y: parent.top,
      width: canvasWidth,
      height: canvasHeight
    };
  }

  applyOffset(bundle: Point) {
    let offset = this.getOffset();
    return {
      ...bundle,
      x: bundle.x - offset.x,
      y: bundle.y - offset.y
    }
  }

  updateHandler(index: number | null, object: DesignerObject) {
    if (index === null) throw new Error("Unreachable");
    let target = this.objectRefs[index];
    let bbox = target.getBoundingClientRect();
    let { canvasOffsetX, canvasOffsetY } = this.getCanvas();

    let handler = {
      ...this.state.handler,
      width: object.width || bbox.width,
      height: object.height || bbox.height,
      top: object.y + canvasOffsetY,
      left: object.x + canvasOffsetX,
      rotate: object.rotate
    };

    if (!object.width) {
      let offset = this.getOffset();
      handler = {
        ...handler,
        left: bbox.left - offset.x,
        top: bbox.top - offset.y
      };
    }

    this.setState({
      handler: handler
    });
  }

  snapCoordinates({ x, y }: Point) {
    let { snapToGrid } = this.props;
    return {
      x: x - (x % (snapToGrid ?? Designer.defaultProps.snapToGrid)),
      y: y - (y % (snapToGrid ?? Designer.defaultProps.snapToGrid))
    };
  }

  getMouseCoords({ clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
    let coords = this.applyOffset({
      x: clientX,
      y: clientY
    });

    return this.snapCoordinates(coords);
  }

  onDrag(event: React.MouseEvent<HTMLDivElement>) {
    let { currentObjectIndex, startPoint, mode } = this.state;
    let { objects } = this.props;
    if (currentObjectIndex === null) throw new Error("Unreachable");
    let object = objects[currentObjectIndex];
    let mouse = this.getMouseCoords(event);

    let map: Record<DesignerMode, Action | undefined> = {
      [DesignerMode.SCALE]: scale,
      [DesignerMode.ROTATE]: rotate,
      [DesignerMode.DRAG]: drag,
      [DesignerMode.FREE]: undefined,
      [DesignerMode.DRAW]: undefined,
      [DesignerMode.TYPE]: undefined,
      [DesignerMode.EDIT_OBJECT]: undefined
    };

    let action = map[mode];

    if (startPoint === null) throw new Error("Unreachable");

    if (action) {
      let newObject = action({
        object,
        startPoint,
        mouse,
        objectIndex: currentObjectIndex,
        objectRefs: this.objectRefs
      });

      this.updateObject(currentObjectIndex, newObject);
      this.updateHandler(currentObjectIndex, newObject);
    }

    if (currentObjectIndex !== null) {
      this.detectOverlappedObjects(event);
    }
  }

  detectOverlappedObjects(event: React.MouseEvent<HTMLDivElement>) {
    let { currentObjectIndex } = this.state;
    let mouse = this.getMouseCoords(event);

    let refs = this.objectRefs,
      keys = Object.keys(refs),
      offset = this.getOffset();

    if (currentObjectIndex === null) throw new Error("Unreachable");
    let currentRect = (refs[currentObjectIndex]
      .getBoundingClientRect());

    keys.filter(
      (_, index) => index !== currentObjectIndex
    ).forEach((key) => {
      debugger;
      let rect = refs[key as unknown as number].getBoundingClientRect();
      let { left, top, width, height } = rect;

      left -= offset.x;
      top -= offset.y;

      let isOverlapped = (
        mouse.x > left && mouse.x < left + width &&
        mouse.y > top && mouse.y < top + height &&
        currentRect.width > width &&
        currentRect.height > height
      );

      if (isOverlapped) {
        this.showHandler(Number(key));
      }
    });
  }

  stopDrag() {
    let { mode } = this.state;

    if ([DesignerMode.DRAG,
    DesignerMode.ROTATE,
    DesignerMode.SCALE].includes(mode)) {
      this.setState({
        mode: DesignerMode.FREE
      });
    }
  }

  showEditor() {
    let { selectedObjectIndex } = this.state;


    if (selectedObjectIndex === null) throw new Error("Unreachable");
    let { objects } = this.props,
      currentObject = objects[selectedObjectIndex],
      objectComponent = this.getObjectComponent(currentObject.type);

    if (objectComponent.meta.editor) {
      this.setState({
        mode: DesignerMode.EDIT_OBJECT,
        showHandler: false
      });
    }
  }

  getObjectComponent(type: DesignerObjectType) {
    let { objectTypes } = this.props;
    return objectTypes![type]!;
  }

  getCanvas() {
    let { width, height } = this.props;
    let {
      canvasWidth = width,
      canvasHeight = height
    } = this.props;
    return {
      width, height, canvasWidth, canvasHeight,
      canvasOffsetX: (canvasWidth - width) / 2,
      canvasOffsetY: (canvasHeight - height) / 2
    };
  }

  renderSVG() {
    let canvas = this.getCanvas();
    let { width, height } = canvas;
    let { background, objects, objectTypes } = this.props;

    return (
      <SVGRenderer
        background={background}
        width={width}
        canvas={canvas}
        height={height}
        objects={objects}
        onMouseOver={this.showHandler.bind(this)}
        objectTypes={objectTypes}
        objectRefs={this.objectRefs}
        onRender={(ref) => this.svgElement = ref}
        onMouseDown={this.newObject.bind(this)} />
    );
  }

  selectTool(tool: DesignerObjectType) {
    this.setState({
      selectedTool: tool,
      mode: DesignerMode.DRAW,
      currentObjectIndex: null,
      showHandler: false,
      handler: null
    });
  }

  handleObjectChange(key: string, value: DesignerObject[keyof DesignerObject]) {
    let { selectedObjectIndex } = this.state;
    // console.log(this.state, key, value)
    this.updateObject(selectedObjectIndex, {
      [key]: value
    });
  }

  handleArrange(arrange: ArrangeDir) {
    let { selectedObjectIndex } = this.state;
    let { objects } = this.props;

    if (selectedObjectIndex === null) throw new Error("Unreachable");
    let object = objects[selectedObjectIndex];

    let arrangers: Record<ArrangeDir, (rest: DesignerObject[], object: DesignerObject) => [DesignerObject[], number]> = {
      'front': (rest, object) => ([[...rest, object], rest.length]),
      'back': (rest, object) => ([[object, ...rest], 0])
    };

    let rest = objects.filter(
      (_, index) =>
        selectedObjectIndex !== index
    );

    this.setState({
      selectedObjectIndex: null
    }, () => {

      let arranger = arrangers[arrange];
      let [arranged, newIndex] = arranger(rest, object);
      this.props.onUpdate(arranged);
      this.setState({
        selectedObjectIndex: newIndex
      });
    });
  }

  removeCurrent() {
    let { selectedObjectIndex } = this.state;
    let { objects } = this.props;

    let rest = objects.filter(
      (_, index) =>
        selectedObjectIndex !== index
    );

    this.setState({
      currentObjectIndex: null,
      selectedObjectIndex: null,
      showHandler: false,
      handler: null
    }, () => {
      this.objectRefs = {};
      this.props.onUpdate(rest);
    });
  }

  moveSelectedObject(attr: keyof DesignerObject, points: number, key: string) {
    let { selectedObjectIndex } = this.state;
    let { objects } = this.props;
    if (selectedObjectIndex === null) throw new Error("Unreachable");
    let object = objects[selectedObjectIndex];

    if (key.startsWith('shift')) {
      points *= 10;
    }

    let changes = {
      ...object,
      [attr]: object[attr] as number + points
    };

    this.updateObject(selectedObjectIndex, changes);
    this.updateHandler(selectedObjectIndex, changes);
  }

  getKeymapHandlers(): Record<string, (keyEvent: KeyboardEvent | undefined) => void> {
    let handlers = {
      removeObject: this.removeCurrent.bind(this),
      moveLeft: this.moveSelectedObject.bind(this, 'x', -1),
      moveRight: this.moveSelectedObject.bind(this, 'x', 1),
      moveUp: this.moveSelectedObject.bind(this, 'y', -1),
      moveDown: this.moveSelectedObject.bind(this, 'y', 1),
      closePath: () => this.setState({ mode: DesignerMode.FREE })
    };

    return Object.entries(handlers).map(([handler_name, handler]) => ({
      [handler_name]: (keyEvent: KeyboardEvent | undefined) => {
        if (keyEvent && (keyEvent.target as HTMLElement)?.tagName !== 'INPUT') {
          keyEvent.preventDefault();
          handler(keyEvent.key);
        }
      }
    })).reduce((prev, curr) => ({...prev, ...curr}), {});
  }

  render() {
    let { showHandler, handler, mode,
      selectedObjectIndex, selectedTool } = this.state;

    let {
      objects,
      objectTypes,
      insertMenu: InsertMenuComponent
    } = this.props;

    if (selectedObjectIndex === null) throw new Error("Unreachable");
    let currentObject = objects[selectedObjectIndex],
      isEditMode = mode === DesignerMode.EDIT_OBJECT,
      showPropertyPanel = selectedObjectIndex !== null;

    let { width, height } = this.getCanvas();

    let objectComponent, objectWithInitial, ObjectEditor;
    if (currentObject) {
      objectComponent = this.getObjectComponent(currentObject.type);
      objectWithInitial = {
        ...objectComponent.meta.initial,
        ...currentObject
      };
      ObjectEditor = objectComponent.meta.editor;
    }

    return (
      <HotKeys
        keyMap={this.keyMap}
        style={styles.keyboardManager}
        handlers={this.getKeymapHandlers()}>
        <div className={'container'}
          style={{
            ...styles.container,
            ...this.props.style,
            padding: 0
          }}
          onMouseMove={this.onDrag.bind(this)}
          onMouseUp={this.stopDrag.bind(this)}>

          {/* Left Panel: Displays insertion tools (shapes, images, etc.) */}
          {InsertMenuComponent && (
            <InsertMenuComponent tools={objectTypes}
              currentTool={selectedTool}
              onSelect={this.selectTool.bind(this)} />
          )}

          {/* Center Panel: Displays the preview */}
          <div style={styles.canvasContainer}>
            {isEditMode && ObjectEditor && (
              <ObjectEditor object={currentObject}
                offset={this.getOffset()}
                onUpdate={(object) =>
                  this.updateObject(selectedObjectIndex, object)}
                onClose={() => this.setState({ mode: DesignerMode.FREE })}
                width={width}
                height={height} />)}

            {showHandler && (
              <Handler
                boundingBox={handler}
                canResize={_(currentObject).has('width') ||
                  _(currentObject).has('height')}
                canRotate={_(currentObject).has('rotate')}
                onMouseLeave={this.hideHandler.bind(this)}
                onDoubleClick={this.showEditor.bind(this)}
                onDrag={this.startDrag.bind(this, DesignerMode.DRAG)}
                onResize={this.startDrag.bind(this, DesignerMode.SCALE)}
                onRotate={this.startDrag.bind(this, DesignerMode.ROTATE)} />)}

            {this.renderSVG()}
          </div>

          {/* Right Panel: Displays text, styling and sizing tools */}
          {showPropertyPanel && (
            <PanelList
              id={this.props.id}
              object={objectWithInitial}
              onArrange={this.handleArrange.bind(this)}
              onChange={this.handleObjectChange.bind(this)}
              objectComponent={objectComponent} />
          )}
        </div>
      </HotKeys>
    );
  }
}

export const styles: Record<string, CSSProperties> = {
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row'
  },
  canvasContainer: {
    position: 'relative'
  },
  keyboardManager: {
    outline: 'none'
  }
}

export default Designer;
