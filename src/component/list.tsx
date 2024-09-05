import {FC, ReactNode} from 'react';
import "../App.css";
import { overrideTailwindClasses } from 'tailwind-override';

interface ListElementProps {
    children: ReactNode;
    className?: string;
    invisible?: boolean;
}
export const ListElement: FC<ListElementProps> = ({children, className, invisible})=> {

    const defaultStyle = `w-1 bg-ListElement-color rounded-lg`;
    const style = overrideTailwindClasses(`${defaultStyle} ${className} ${invisible? "bg-transparent":""}`);
    return (
        <div className='w-full flex flex-row space-x-2'>
            <div className={style}/>
            <div className="w-full">
                {children}
            </div>
        </div>
    )
};