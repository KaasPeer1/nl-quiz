import clsx from 'clsx';
import React from 'react';
import { Button as MuiButton, type ButtonProps as MuiButtonProps } from '@mui/material';

interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'secondaryOutline';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  className,
  children,
  ...props
}) => {
  const getMuiProps = () => {
    switch (variant) {
      case 'primary': return { variant: 'contained' as const, color: 'primary' as const };
      case 'secondary': return { variant: 'contained' as const, color: 'secondary' as const };
      case 'danger': return { variant: 'contained' as const, color: 'error' as const };
      case 'outline': return { variant: 'outlined' as const, color: 'primary' as const };
      case 'ghost': return { variant: 'text' as const, color: 'inherit' as const };
      case 'secondaryOutline': return { variant: 'outlined' as const, color: 'secondary' as const }
      default: return { variant: 'contained' as const, color: 'primary' as const };
    }
  };

  return (
    <MuiButton
      {...getMuiProps()}
      {...props}
      className={clsx(className)} // Allows Tailwind classes (margins, etc) to still pass through
    >
      {children}
    </MuiButton>
  );
};
