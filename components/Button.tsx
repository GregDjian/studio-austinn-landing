import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className = '', ...props }) => {
  const baseStyles = "px-8 py-3 uppercase tracking-[0.2em] text-xs font-bold transition-all duration-300 ease-out";
  
  const variants = {
    primary: "bg-stone-900 text-white hover:bg-stone-800 border border-stone-900",
    outline: "bg-transparent text-stone-900 border border-stone-900 hover:bg-stone-900 hover:text-white",
    ghost: "bg-transparent text-stone-600 hover:text-stone-900"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;