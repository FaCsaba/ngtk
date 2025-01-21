import {MouseEventHandler} from 'react';

import styles from './styles.ts';

const Button = ({onClick, ...props}: any) => {
  let _onClick: MouseEventHandler<HTMLAnchorElement> = (e, ...args): void => {
    e.preventDefault();
    if (onClick) onClick(...args); // idk??
  }
  return (
    <a href="#" style={styles.button} onClick={_onClick}>
      {props.children}
    </a>
  );
}

export default Button;
