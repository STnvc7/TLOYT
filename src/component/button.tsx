import "../App.css";
import { FC } from 'react';

//=======================================================================
interface TestComponentButtonProps {
  text: string;
  className?: string;
  type?: "button" | "submit" | "reset" | undefined;
  onClick?: () => void; 
  form?: string;
}
export const TestComponentButton: FC<TestComponentButtonProps> =(props)=>{
  let buttonStyle = "bg-blue-500 hover:bg-blue-700 transition duration-500 text-white shadow-lg rounded-lg " + props.className;
  return (
        <button type={props.type} onClick={props.onClick} className={buttonStyle} form={props.form}>
        {props.text}
        </button>
  );
};


interface RemoveButtonProps {
  text: string;
  className?: string;
  type?: "button" | "submit" | "reset" | undefined;
  onClick?: () => void; 
}
export const RemoveButton: FC<RemoveButtonProps>= (props) =>{
  const style = 'text-red-700 rounded-md shadow-sm ' + props.className;
  return (
    <button type={props.type} className={style}onClick={props.onClick}>{props.text}</button>
  );
};