import React from "react";
import "./Button.css";

interface ButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ onClick, icon }) => {
  return (
    <button className="custom-button" onClick={onClick}>
      {icon && <span className="icon">{icon}</span>} <span></span>{" "}
    </button>
  );
};

export default Button;
