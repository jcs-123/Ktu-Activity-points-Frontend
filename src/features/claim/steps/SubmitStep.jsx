import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, CircularProgress, Button, Paper } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import { useSubmitClaimMutation } from '../../../api/claimApi';
import { resetWizard } from '../claimWizardSlice';

const SubmitStep = () => {
  const dispatch = useDispatch();
  const { catalogueItem, details, attachments, claimId } = useSelector((state) => state.claimWizard);
  
  const [submitClaim, { isLoading, isSuccess, isError, error }] = useSubmitClaimMutation();

  const handleConfirmSubmit = () => {
    if (!claimId) return;
    submitClaim(claimId);
  };

  const handleStartNew = () => {
    dispatch(resetWizard());
  };

  // If mutation hasn't started yet, show a confirmation screen
  if (!isLoading && !isSuccess && !isError) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Ready to Submit?</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 4, textAlign: 'center' }}>
          Your claim is ready. Click the button below to submit it to the system.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          size="large" 
          onClick={handleConfirmSubmit}
        >
          Confirm & Submit Claim
        </Button>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8, mb: 8 }}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h6">Submitting your claim...</Typography>
        <Typography variant="body2" color="textSecondary">Please do not refresh the page.</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 500, mx: 'auto', mt: 4, borderTop: '4px solid #f44336' }}>
        <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h5" color="error" gutterBottom>
          Submission Failed
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          {error?.data?.error?.message || 'An unexpected error occurred while submitting your claim.'}
        </Typography>
        <Button variant="outlined" onClick={handleStartNew}>
          Try Again
        </Button>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 500, mx: 'auto', mt: 4, borderTop: '4px solid #4caf50' }}>
      <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
      <Typography variant="h5" color="success.main" gutterBottom>
        Claim Submitted Successfully!
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        Your activity claim has been forwarded to your Staff Advisor for verification.
      </Typography>
      <Button variant="outlined" onClick={handleStartNew} sx={{ mt: 2 }}>
        Submit Another Claim
      </Button>
    </Paper>
  );
};

export default SubmitStep;
