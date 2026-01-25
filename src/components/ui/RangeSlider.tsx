import React from 'react';
import MuiSlider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface BaseSliderProps {
  min: number;
  max: number;
  step?: number;
  formatLabel?: (val: number) => string;
}

interface RangeSliderProps extends BaseSliderProps {
  value: [number, number];
  onChange: (val: [number, number]) => void;
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
      <MuiSlider
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

interface SimpleSliderProps extends BaseSliderProps {
  value: number;
  onChange: (val: number) => void;
}

export const SimpleSlider: React.FC<SimpleSliderProps> = ({ min, max, value, step = 1, onChange }) => {
  const handleChange = (_: Event, newValue: number | number[]) => {
    // MUI returns a number when value is a number
    if (typeof newValue === 'number') {
      onChange(newValue);
    }
  };

  return (
    <Box sx={{ width: '100%', px: 1, py: 2 }}>
      <MuiSlider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        valueLabelDisplay="off"
      />
    </Box>
  );
};
