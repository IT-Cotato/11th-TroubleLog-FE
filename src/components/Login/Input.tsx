import React from "react";
import "./Input.css";

interface InputProps {
  label: string;
  type: string;
  value: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  name?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  type,
  value,
  placeholder,
  onChange,
  error,
  name,
}) => {
  return (
    <div className="InputHolder">
      <label className="InputLabel">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`CustomInput ${error ? "InputError" : ""}`}
      />
      {error && <p className="InputErrorMessage">{error}</p>}
    </div>
  );
};

export default Input;
