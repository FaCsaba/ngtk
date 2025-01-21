import Icon, { IconType } from '../Icon';

export interface SwitchStateProps<T> {
  value: T;
  defaultValue: T;
  nextState: T;
  icon: IconType;
  onChange: (newValue: T) => void;
}

export default function SwitchState<T>(props: SwitchStateProps<T>) {
  let selected = props.value !== props.defaultValue;
  let newValue = selected ? props.defaultValue : props.nextState;
  return (
    <Icon icon={props.icon} active={selected}
      onClick={() => props.onChange(newValue)} />
  );
}
