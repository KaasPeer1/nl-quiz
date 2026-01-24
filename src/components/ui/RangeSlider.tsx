import React from 'react';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  step?: number;
  onChange: (val: [number, number]) => void;
  formatLabel?: (val: number) => string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({ min, max, value, step = 1, onChange, formatLabel }) => {

  // MUI Slider passes (event, value, activeThumb). We just need value.
  const handleChange = (_: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      onChange(newValue as [number, number]);
    }
  };

  return (
    <Box sx={{ width: '100%', px: 1, py: 2 }}>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        valueLabelDisplay="off"
        // If you provided a formatLabel function, use it for the tooltip
        valueLabelFormat={formatLabel}
      />
      {formatLabel && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {formatLabel(min)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {formatLabel(max)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
