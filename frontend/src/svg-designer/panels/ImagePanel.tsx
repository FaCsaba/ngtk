import { Component } from 'react';

import PropertyGroup from './PropertyGroup';
import Columns from './Columns';
import Column from './Column';
import Dropzone from 'react-dropzone';
import { DesignerObject } from '../DesignerObject';

export default class ImagePanel extends Component<{ object: DesignerObject, onChange: (ch: 'xlinkHref', e: string | ArrayBuffer | null | undefined) => void }> {
  onDrop(acceptedFiles: File[]) {
    if (acceptedFiles.length == 0) {
      return;
    }

    const file = acceptedFiles[0];
    const fr = new FileReader();

    const setImage = (e: ProgressEvent<FileReader>) => {
      this.props.onChange('xlinkHref', e.target?.result);
    };
    fr.onload = setImage;
    fr.readAsDataURL(file);
  }

  render() {
    const { object } = this.props;
    return (
      <PropertyGroup object={object} showIf={'xlinkHref' in object}>
        <Columns label="Image">
          <Column>
            <Dropzone
              // accept="image/*"
              onDrop={this.onDrop.bind(this)}
              multiple={false}
            // style={{
            //   float:'left',
            //   marginRight: '3px',
            //   padding: '3px',
            //   border: '1px solid gray',
            //   color: 'gray',
            //   borderRadius: '3px',
            //   width: '100px',
            //   textAlign: 'center',
            // }}
            // activeStyle={{
            //   border: '1px solid blue',
            //   backgroundColor: 'white',
            //   color: 'black',
            // }}
            >
              {({ getRootProps, getInputProps }) => (
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  <p>Drop new file</p>
                </div>
              )}
            </Dropzone>
          </Column>
        </Columns>
      </PropertyGroup>
    );
  }
}
