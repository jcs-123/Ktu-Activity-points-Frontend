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
    const hasAttachments = attachments && attachments.length > 0;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Ready to Submit?</Typography>
        
        {!hasAttachments ? (
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 2, textAlign: 'center', maxWidth: 450 }}>
            <Typography variant="body1" color="error" fontWeight="bold" gutterBottom>
              ⚠️ Proof Document Required
            </Typography>
            <Typography variant="body2" color="text.secondary">
              At least one proof certificate or evidence document is required before submitting your claim. Please go back to the <strong>Attachments</strong> step and upload your document.
            </Typography>
          </Paper>
        ) : (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 4, textAlign: 'center' }}>
            Your claim with <strong>{attachments.length} attached proof file(s)</strong> is ready. Click below to submit.
          </Typography>
        )}

        <Button 
          variant="contained" 
          color="primary" 
          size="large" 
          disabled={!hasAttachments}
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
