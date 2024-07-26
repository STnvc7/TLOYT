import "../App.css";

//=======================================================================
export const TestComponentButton=(props)=>{
  return (
        <button type={props.type} onClick={props.onClick} className="
          bg-blue-500 hover:bg-blue-700 transition duration-500
          text-white font-bold py-2 px-4 shadow-lg rounded-lg">
        {props.text}</button>
  );
};