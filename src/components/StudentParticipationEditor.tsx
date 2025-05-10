import React from 'react';
import { Box, TextField, RadioGroup, FormControlLabel, Radio, Typography } from '@mui/material';
import { ParticipationLevel } from '../types';

interface Props {
  name?: React.ReactNode;
  participation: ParticipationLevel;
  hoursLearned?: number;
  onParticipationChange: (value: ParticipationLevel) => void;
  onHoursChange: (value: number) => void;
  disabled?: boolean;
}

const participationOptions: { value: ParticipationLevel; label: string }[] = [
  { value: 'DidNotParticipate', label: 'Did not participate' },
  { value: 'InShabbos', label: 'In shabbos' },
  { value: 'OneMealOut', label: 'One meal out' },
  { value: 'OutShabbos', label: 'Out shabbos' },
];

export const StudentParticipationEditor: React.FC<Props> = ({
  name,
  participation,
  hoursLearned = 0,
  onParticipationChange,
  onHoursChange,
  disabled,
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
    {name && <Typography fontWeight="bold">{name}</Typography>}
    <RadioGroup
      row
      value={participation}
      onChange={e => onParticipationChange(e.target.value as ParticipationLevel)}
      name="participation"
    >
      {participationOptions.map(opt => (
        <FormControlLabel
          key={opt.value}
          value={opt.value}
          control={<Radio />}
          label={opt.label}
          disabled={disabled}
        />
      ))}
    </RadioGroup>
    <TextField
      type="number"
      label="Hours Learned"
      value={hoursLearned}
      onChange={e => onHoursChange(Number(e.target.value))}
      inputProps={{ min: 0, step: 0.25 }}
      size="small"
      sx={{ width: 160 }}
      disabled={disabled}
    />
  </Box>
);

export default StudentParticipationEditor;
