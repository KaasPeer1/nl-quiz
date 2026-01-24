import React from 'react';
import MuiCard from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import clsx from 'clsx';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <MuiCard className={clsx(className)}>
      <CardContent>
        {children}
      </CardContent>
    </MuiCard>
  );
};
