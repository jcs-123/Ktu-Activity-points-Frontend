import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, Divider, Grid, Paper, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { setStep } from '../claimWizardSlice';
import { Button } from '@mui/material';

const ReviewStep = () => {
  const dispatch = useDispatch();
  const { catalogueItem, details, attachments } = useSelector((state) => state.claimWizard);

  const handleEdit = (stepIndex) => {
    dispatch(setStep(stepIndex));
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 2 }}>
      <Typography variant="h6" gutterBottom color="primary">
        Review Your Claim
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Please review the details below. Ensure all information is accurate before submitting.
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">1. Activity Selection</Typography>
          <Button size="small" onClick={() => handleEdit(0)}>Edit</Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        {catalogueItem ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="body2" color="textSecondary">Selected Activity</Typography>
              <Typography variant="body1">{catalogueItem.title}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">Maximum Points</Typography>
              <Typography variant="body1">{catalogueItem.maxPoints}</Typography>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="error">No activity selected.</Typography>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">2. Activity Details</Typography>
          <Button size="small" onClick={() => handleEdit(1)}>Edit</Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Typography variant="body2" color="textSecondary">Title / Name of Event</Typography>
            <Typography variant="body1">{details.title || '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">Start Date</Typography>
            <Typography variant="body1">{details.startDate || '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">End Date</Typography>
            <Typography variant="body1">{details.endDate || '—'}</Typography>
          </Box>
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Typography variant="body2" color="textSecondary">Description</Typography>
            <Typography variant="body1">{details.description || '—'}</Typography>
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

      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
