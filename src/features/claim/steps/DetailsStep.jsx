import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, TextField } from '@mui/material';
import { updateDetails } from '../claimWizardSlice';

const DetailsStep = () => {
  const dispatch = useDispatch();
  const details = useSelector((state) => state.claimWizard.details);
  const selectedItem = useSelector((state) => state.claimWizard.catalogueItem);

  const handleChange = (field) => (e) => {
    dispatch(updateDetails({ [field]: e.target.value }));
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Activity Details
      </Typography>
      
      {selectedItem && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 2 }}>
          <Typography variant="subtitle2" color="primary">
            Claiming for: {selectedItem.title}
          </Typography>
          <Typography variant="body2">
            Maximum Points Allowed: {selectedItem.maxPoints}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
        <Box sx={{ gridColumn: '1 / -1' }}>
          <TextField
            required
            fullWidth
            label="Title / Name of Event"
            value={details.title}
            onChange={handleChange('title')}
            placeholder="e.g. NPTEL Python Course, TechFest 2024"
          />
        </Box>

        <Box>
          <TextField
            required
            fullWidth
            type="date"
            label="Start Date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={details.startDate}
            onChange={handleChange('startDate')}
          />
        </Box>

        <Box>
          <TextField
            fullWidth
            type="date"
            label="End Date (Optional)"
            slotProps={{ inputLabel: { shrink: true } }}
            value={details.endDate}
            onChange={handleChange('endDate')}
          />
        </Box>

        <Box sx={{ gridColumn: '1 / -1' }}>
          <TextField
            required
            fullWidth
            multiline
            rows={3}
            label="Description & Learning Outcome"
            value={details.description}
            onChange={handleChange('description')}
            placeholder="Briefly describe the activity and what you learned..."
          />
        </Box>

        {/* Dynamic fields based on if the item is unit-based */}
        {selectedItem?.pointsPerUnit > 0 ? (
          <Box>
            <TextField
              required
              fullWidth
              type="number"
              label={`Number of ${selectedItem.unitLabel || 'Units'}`}
              value={details.hours}
              onChange={handleChange('hours')}
            />
          </Box>
        ) : null}

        <Box>
          <TextField
            required
            fullWidth
            type="number"
            label="Points Claimed"
            value={details.pointsClaimed}
            onChange={handleChange('pointsClaimed')}
            slotProps={{ htmlInput: { min: 0, max: selectedItem?.maxPoints || 100 } }}
            helperText={`Max allowed: ${selectedItem?.maxPoints || 'N/A'}`}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default DetailsStep;
