import React from 'react';

const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  ...props
}) => {
  return (
    <div className={`ui-input-group ${className}`}>
      {label && <label className="ui-label">{label}</label>}
      <input
        type={type}
        className="ui-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  );
};

export default Input;
