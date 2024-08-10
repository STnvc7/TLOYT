import "../App.css";
import { FC } from 'react';

//=======================================================================
interface TestComponentButtonProps {
  text: string;
  className?: string;
  type?: "button" | "submit" | "reset" | undefined;
  onClick?: () => void; 
}
export const TestComponentButton: FC<TestComponentButtonProps> =(props)=>{
  let buttonStyle = "bg-blue-500 hover:bg-blue-700 transition duration-500 text-white shadow-lg rounded-lg " + props.className;
  return (
        <button type={props.type} onClick={props.onClick} className={buttonStyle}>
        {props.text}
        </button>
  );
};