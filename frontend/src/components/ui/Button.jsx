
import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-lg font-medium transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-transparent border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-black hover:shadow-[0_0_20px_var(--primary-glow)]",
    secondary: "bg-transparent border border-[var(--secondary)] text-[var(--secondary)] hover:bg-[var(--secondary)] hover:text-white hover:shadow-[0_0_20px_var(--secondary-glow)]",
    ghost: "bg-transparent text-[var(--text-muted)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]",
    gradient: "bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white border-none hover:opacity-90 hover:shadow-[0_0_30px_rgba(0,240,255,0.3)]"
  };

  // We are using vanilla CSS classes defined in a style object to simulate Tailwind-like utility usage if we were using it, 
  // but since we are using vanilla CSS, we will map these to inline styles or just use specific classes.
  // actually, let's use a module-like approach with inline styles for simplicity or just BEM classes.
  // Given the complexity of hover states in inline styles, let's stick to a BEM-like approach and add styles to index.css or a component css file.
  // WAIT - I can just use style objects or Styled Components if I had them. 
  // Let's write pure CSS in index.css for these utility-like classes or just use direct styles.
  
  // Revised approach: Return a button with a specific class that hooks into index.css global styles I will add, 
  // OR just use style attributes for dynamic stuff and classes for static.
  
  // Let's redefine the Button to use the `glass-panel` and custom classes.
  
  return (
    <button 
      className={`ui-btn ui-btn-${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
