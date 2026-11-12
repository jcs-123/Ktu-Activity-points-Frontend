import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, TextField, FormControl, InputLabel, Select, MenuItem, FormHelperText, Chip } from '@mui/material';
import { updateDetails } from '../claimWizardSlice';
import { selectCurrentUser } from '../../auth/authSlice';

const SEMESTER_OPTIONS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];
const ACADEMIC_YEAR_OPTIONS = ['2024-2025', '2025-2026', '2026-2027', '2027-2028'];

const DetailsStep = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const details = useSelector((state) => state.claimWizard.details);
  const selectedItem = useSelector((state) => state.claimWizard.catalogueItem);

  const studentClass = user?.student?.class;
  const studentDept = studentClass?.department;
  const derivedSemester = studentClass?.name?.match(/^(S\d+)/i)?.[1]?.toUpperCase() || 'S3';

  // Auto-populate semester & academicYear from student's class on initial load
  React.useEffect(() => {
    const updates = {};
    if (!details.semester) {
      updates.semester = derivedSemester;
    }
    if (!details.academicYear) {
      updates.academicYear = '2026-2027';
    }
    if (Object.keys(updates).length > 0) {
      dispatch(updateDetails(updates));
    }
  }, [derivedSemester, details.semester, details.academicYear, dispatch]);

  // Auto-populate pointsClaimed on load or when selectedItem changes
  React.useEffect(() => {
    if (selectedItem?.maxPoints !== undefined && selectedItem?.maxPoints !== null) {
      if (!selectedItem.pointsPerUnit) {
        // Automatically populate with the item/option's default point value
        dispatch(updateDetails({ pointsClaimed: selectedItem.maxPoints }));
      }
    }
  }, [selectedItem, dispatch]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    if (field === 'hours' && selectedItem?.pointsPerUnit) {
      const computedPoints = Number(value) * selectedItem.pointsPerUnit;
      dispatch(updateDetails({
        hours: value,
        pointsClaimed: computedPoints > 0 ? computedPoints : '',
      }));
    } else {
      dispatch(updateDetails({ [field]: value }));
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', mt: { xs: 1, sm: 2 } }}>
      <Typography variant="h6" gutterBottom>
        Activity Details
      </Typography>

      {user && (studentDept || studentClass) && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(16, 42, 67, 0.05)', borderRadius: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            Submitting as:
          </Typography>
          <Chip size="small" label={`${user.fullName || user.username} (${user.username})`} />
          {studentDept && <Chip size="small" color="primary" variant="outlined" label={`${studentDept.code || ''} — ${studentDept.name || ''}`.replace(/^ — | — $/g, '')} />}
          {studentClass?.name && <Chip size="small" variant="outlined" label={`Class: ${studentClass.name}`} />}
        </Box>
      )}

      {selectedItem && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 2 }}>
          <Typography variant="subtitle2" color="primary" sx={{ overflowWrap: 'anywhere' }}>
            Claiming for: {selectedItem.title}
          </Typography>
          <Typography variant="body2">
            Maximum Points Allowed: {selectedItem.maxPoints}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 2, sm: 3 } }}>
        <Box sx={{ gridColumn: '1 / -1' }}>
          <TextField
            required
            fullWidth
            label="Title / Name of Event"
            value={details.title}
            onChange={handleChange('title')}
            placeholder="e.g. NPTEL Python Course, TechFest 2026"
          />
        </Box>

        <Box>
          <FormControl fullWidth required>
            <InputLabel id="claim-semester-label">Semester</InputLabel>
            <Select
              labelId="claim-semester-label"
              value={details.semester || derivedSemester}
              label="Semester"
              onChange={handleChange('semester')}
            >
              {SEMESTER_OPTIONS.map((sem) => (
                <MenuItem key={sem} value={sem}>{sem}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box>
          <FormControl fullWidth required>
            <InputLabel id="claim-academic-year-label">Academic Year</InputLabel>
            <Select
              labelId="claim-academic-year-label"
              value={details.academicYear || '2026-2027'}
              label="Academic Year"
              onChange={handleChange('academicYear')}
            >
              {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                <MenuItem key={yr} value={yr}>{yr}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box>
          <TextField
            required
            fullWidth
            type="date"
            label="Start Date"
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { max: new Date().toISOString().split('T')[0] }
            }}
            value={details.startDate}
            onChange={handleChange('startDate')}
            helperText="Future dates not allowed"
          />
        </Box>

        <Box>
          <TextField
            fullWidth
            type="date"
            label="End Date (Optional)"
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { max: new Date().toISOString().split('T')[0] }
            }}
            value={details.endDate}
            onChange={handleChange('endDate')}
            helperText="Future dates not allowed"
          />
        </Box>



        {/* BR-16: Approved Skilling Course selection for item 3.17 */}
        {(selectedItem?.itemCode === '3.17' || selectedItem?.title?.toLowerCase().includes('skilling') || selectedItem?.title?.toLowerCase().includes('mooc') || selectedItem?.title?.toLowerCase().includes('nptel')) && (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Typography variant="body2" color="primary" fontWeight="bold" sx={{ mb: 1 }}>
              * Select Approved Skilling / MOOC Course (BR-16 Required)
            </Typography>
            <FormControl fullWidth required>
              <InputLabel id="skilling-course-label">Approved Skilling Course</InputLabel>
              <Select
                labelId="skilling-course-label"
                value={details.skillingCourseId || ''}
                label="Approved Skilling Course"
                onChange={handleChange('skillingCourseId')}
                MenuProps={{ slotProps: { paper: { sx: { maxWidth: 'calc(100vw - 32px)' } } } }}
                sx={{ '& .MuiSelect-select': { whiteSpace: 'normal' } }}
              >
                <MenuItem value="" sx={{ whiteSpace: 'normal' }}><em>-- Select Approved Skilling Course --</em></MenuItem>
                <MenuItem value="6a744fd806f8f5bed47f76dd" sx={{ whiteSpace: 'normal' }}>Introduction to Python programming (40 Hours)</MenuItem>
                <MenuItem value="6a744fd806f8f5bed47f76de" sx={{ whiteSpace: 'normal' }}>AI/ML Fundamentals (30 Hours)</MenuItem>
                <MenuItem value="6a744fd806f8f5bed47f76df" sx={{ whiteSpace: 'normal' }}>Web Development Bootcamp (48 Hours)</MenuItem>
              </Select>
              <FormHelperText>Must select an approved course from the KTU university registry</FormHelperText>
            </FormControl>
          </Box>
        )}

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
            label="Points Claimed (Auto-fetched)"
            value={details.pointsClaimed}
            disabled
            sx={{
              '& .MuiInputBase-input.Mui-disabled': {
                WebkitTextFillColor: '#1F3864',
                fontWeight: 'bold',
                fontSize: '1.1rem',
              },
              '& .MuiInputLabel-root.Mui-disabled': {
                color: '#1F3864',
                fontWeight: 'bold',
              },
              '& .MuiFormHelperText-root': {
                fontWeight: 'bold',
                color: '#2E5090',
              },
            }}
            slotProps={{
              input: { readOnly: true },
              htmlInput: { min: 0, max: selectedItem?.maxPoints || 100 }
            }}
            helperText={`Auto-calculated point value (Max: ${selectedItem?.maxPoints || 'N/A'})`}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default DetailsStep;
