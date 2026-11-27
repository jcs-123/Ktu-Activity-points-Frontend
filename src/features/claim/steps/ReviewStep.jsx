import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, Divider, Grid, Paper, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { setStep } from '../claimWizardSlice';
import { selectCurrentUser } from '../../auth/authSlice';
import { Button } from '@mui/material';
import { Alert } from '@mui/material';

const ReviewStep = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { catalogueItem, details, attachments, warnings } = useSelector((state) => state.claimWizard);
  const studentClass = user?.student?.class;
  const studentDept = studentClass?.department;
  const derivedSemester = studentClass?.name?.match(/^(S\d+)/i)?.[1]?.toUpperCase() || 'S3';

  const handleEdit = (stepIndex) => {
    dispatch(setStep(stepIndex));
  };

  const isExceedingCap = catalogueItem?.maxPoints && Number(details.pointsClaimed) >= Number(catalogueItem.maxPoints);

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 2 }}>
      <Typography variant="h6" gutterBottom color="primary">
        Review Your Claim
      </Typography>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Please review the details below. Ensure all information is accurate before submitting.
      </Typography>

      {/* Real-time Server & Client CAP Advisory Warnings */}
      {(isExceedingCap || (warnings && warnings.length > 0)) && (
        <Box sx={{ mb: 3 }}>
          {warnings && warnings.length > 0 ? (
            warnings.map((warn, i) => (
              <Alert key={i} severity="warning" sx={{ mb: 1.5, borderRadius: 2, fontWeight: 'bold' }}>
                ⚠️ CAP Alert: {warn}
              </Alert>
            ))
          ) : (
            <Alert severity="warning" sx={{ borderRadius: 2, fontWeight: 'bold' }}>
              ⚠️ Category CAP Warning: Points claimed ({details.pointsClaimed} pts) equal or exceed the category cap of {catalogueItem.maxPoints} pts ({catalogueItem.title}). Any points awarded beyond {catalogueItem.maxPoints} will be capped according to KTU rules.
            </Alert>
          )}
        </Box>
      )}

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">1. Activity Selection</Typography>
          <Button size="small" onClick={() => handleEdit(0)}>Edit</Button>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {catalogueItem ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
              <Typography variant="body2" color="textSecondary">Selected Activity</Typography>
              <Typography variant="body1" fontWeight="600">
                {catalogueItem.itemCode ? `${catalogueItem.itemCode} — ` : ''}{catalogueItem.title}
              </Typography>
              {catalogueItem.headName && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {catalogueItem.headName} {catalogueItem.headMaxPoints ? `(Category Cap: ${catalogueItem.headMaxPoints} pts)` : ''}
                </Typography>
              )}
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">Points Claimed / Allowed</Typography>
              <Typography variant="body1" fontWeight="bold" color="primary">
                {details.pointsClaimed || catalogueItem.points || catalogueItem.maxPoints} Points
              </Typography>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="error">No activity selected.</Typography>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">2. Activity Details</Typography>
          <Button size="small" onClick={() => handleEdit(1)}>Edit</Button>
        </Box>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
            <Typography variant="body2" color="textSecondary">Student</Typography>
            <Typography variant="body1">{user?.fullName ? `${user.fullName} (${user.username})` : user?.username || '—'}</Typography>
          </Box>
          <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
            <Typography variant="body2" color="textSecondary">Department & Class</Typography>
            <Typography variant="body1">
              {[studentDept?.code || studentDept?.name, studentClass?.name].filter(Boolean).join(' • ') || '—'}
            </Typography>
          </Box>
          <Box sx={{ gridColumn: '1 / -1', minWidth: 0, overflowWrap: 'anywhere' }}>
            <Typography variant="body2" color="textSecondary">Title / Name of Event</Typography>
            <Typography variant="body1">{details.title || '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">Semester</Typography>
            <Typography variant="body1">{details.semester || derivedSemester}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">Academic Year</Typography>
            <Typography variant="body1">{details.academicYear || '2026-2027'}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">Start Date</Typography>
            <Typography variant="body1">{details.startDate || '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">End Date</Typography>
            <Typography variant="body1">{details.endDate || '—'}</Typography>
          </Box>
          <Box sx={{ gridColumn: '1 / -1', minWidth: 0, overflowWrap: 'anywhere' }}>
            <Typography variant="body2" color="textSecondary">Description</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{details.description || '—'}</Typography>
          </Box>

          {catalogueItem?.pointsPerUnit > 0 && (
            <Box>
              <Typography variant="body2" color="textSecondary">{catalogueItem.unitLabel || 'Units'}</Typography>
              <Typography variant="body1">{details.hours || '—'}</Typography>
            </Box>
          )}

          <Box>
            <Typography variant="body2" color="textSecondary">Points Claimed</Typography>
            <Typography variant="body1" fontWeight="bold" color="primary">
              {details.pointsClaimed || '0'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">3. Attachments</Typography>
          <Button size="small" onClick={() => handleEdit(2)}>Edit</Button>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {attachments && attachments.length > 0 ? (
          <List dense>
            {attachments.map((file, idx) => (
              <ListItem key={idx} disablePadding sx={{ mb: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <InsertDriveFileIcon color="action" />
                </ListItemIcon>
                <ListItemText
                  sx={{ minWidth: 0, '& .MuiListItemText-primary': { overflowWrap: 'anywhere' } }}
                  primary={file.name}
                  secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="error">
            No proof attachments uploaded. Are you sure you want to proceed?
          </Typography>
        )}
      </Paper>

      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2 }}>
        <CheckCircleOutlineIcon color="success" sx={{ mr: 2 }} />
        <Typography variant="body2" color="textPrimary">
          By clicking Next, you confirm that all information provided is accurate and authentic.
        </Typography>
      </Box>
    </Box>
  );
};

export default ReviewStep;
