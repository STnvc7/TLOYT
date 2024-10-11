import "../App.css";
import { FC } from 'react';
import { overrideTailwindClasses } from "tailwind-override";

//=======================================================================
interface TextButtonProps {
  text: string;
  className?: string;
  type?: "button" | "submit" | "reset" | undefined;
  onClick?: () => void; 
  form?: string;
  disabled?: boolean;
}
export const TextButton: FC<TextButtonProps> =(props)=>{
  const isDisabled = props.disabled === undefined ? false:props.disabled;
  
  const defaultStyle = "rounded-lg text-TextButton-color bg-white hover:bg-TextButton-color hover:text-white shadow-lg transition duration-200";
  const disabledStyle = 'rounded-lg text-gray-500 bg-gray-100';

  const style = overrideTailwindClasses(`${isDisabled? disabledStyle: defaultStyle} ${props.className}`);
  return (
      <button type={props.type} onClick={props.onClick} className={style} form={props.form} disabled={props.disabled === undefined ? false:props.disabled}>
        {props.text}
      </button>
  );
};


interface RemoveButtonProps {
  text: string;
  className?: string;
  type?: "button" | "submit" | "reset" | undefined;
  onClick?: () => void;
  disabled?: boolean; 
}
export const RemoveButton: FC<RemoveButtonProps>= (props) =>{
  const isDisabled = props.disabled === undefined ? false:props.disabled;
  
  const defaultStyle = 'rounded-lg text-RemoveButton-color bg-white hover:bg-RemoveButton-color hover:text-white shadow-lg transition duration-200';
  const disabledStyle = 'rounded-lg text-gray-500 bg-gray-100';

  const style = overrideTailwindClasses(`${isDisabled? disabledStyle: defaultStyle} ${props.className}`);
  return (
    <button type={props.type} className={style} onClick={props.onClick} disabled={isDisabled}>
      {props.text}
    </button>
  );
};