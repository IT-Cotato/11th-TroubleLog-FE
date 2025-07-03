import React from "react";
import "./Input.css";

interface InputProps {
  label: string;
  type: string;
  value: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  name?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  type,
  value,
  placeholder,
  onChange,
  onBlur,
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
        onBlur={onBlur}
        placeholder={placeholder}
        className={`CustomInput ${error ? "InputError" : ""}`}
      />
      {error && <p className="InputErrorMessage">{error}</p>}
    </div>
  );
};

export default Input;
