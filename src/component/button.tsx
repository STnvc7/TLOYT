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
  const defaultStyle = "rounded-lg bg-TextButton-color hover:bg-TextButton-hover-color text-white shadow-lg";
  const style = overrideTailwindClasses(`${defaultStyle} ${props.className}`);
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
  const defaultStyle = 'rounded-lg bg-RemoveButton-color text-white shadow-lg';
  const style = overrideTailwindClasses(`${defaultStyle} ${props.className}`);

  return (
    <button type={props.type} className={style} onClick={props.onClick} disabled={props.disabled === undefined ? false:props.disabled}>
      {props.text}
    </button>
  );
};