import React from 'react';

const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`ui-card glass-panel ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
