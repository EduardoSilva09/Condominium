type Props = {
  id: string;
  text: string;
  isChecked: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}

function SwitchInput(props: Props) {
  function OnSwitchChange(evt: React.ChangeEvent<HTMLInputElement>) {
    const isChecked = evt.target.value === "true";
    evt.target.value = `${!isChecked}`;
    props.onChange(evt);
  }
  function getIsChecked(): boolean {
    if (typeof props.isChecked === "string")
      return props.isChecked === "true";

    return props.isChecked;
  }
  return (
    <div className="form-check form-switch d-flex align-items-center mb-3">
      <input className="form-check-input" type="checkbox" id={props.id} checked={getIsChecked() || false} onChange={OnSwitchChange} />
      <label className="form-check-label mb-0 ms-3" htmlFor={props.id}>{props.text}</label>
    </div>
  )
}

export default SwitchInput;