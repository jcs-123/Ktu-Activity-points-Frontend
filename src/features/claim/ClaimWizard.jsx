import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Paper, Stepper, Step, StepLabel, Button, Typography, Container } from '@mui/material';
import { nextStep, prevStep, setClaimId } from './claimWizardSlice';
import { useNavigate } from 'react-router-dom';
import { useCreateClaimMutation, useUpdateClaimMutation } from '../../api/claimApi';

// Placeholder components for the steps
import SelectCatalogueStep from './steps/SelectCatalogueStep';
import DetailsStep from './steps/DetailsStep';
import AttachmentsStep from './steps/AttachmentsStep';
import ReviewStep from './steps/ReviewStep';
import SubmitStep from './steps/SubmitStep';

import { useTheme, useMediaQuery } from '@mui/material';

const steps = ['Select Activity', 'Details', 'Attachments', 'Review', 'Submit'];

const ClaimWizard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentStep, catalogueItem, details, claimId } = useSelector((state) => state.claimWizard);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [createClaim, { isLoading: isCreating }] = useCreateClaimMutation();
  const [updateClaim, { isLoading: isUpdating }] = useUpdateClaimMutation();

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!details.title || !details.startDate) {
        alert('Please fill in at least the Title and Start Date.');
        return;
      }
      const payload = {
        activity_option_id: catalogueItem?.optionId || catalogueItem?._id || catalogueItem?.itemId,
        title: details.title,
        description: details.description,
        activity_date_from: details.startDate,
        activity_date_to: details.endDate || undefined,
        quantity: Number(details.hours) || 1,
        semester: 'S1',
        academic_year: '2023-2024',
      };

      try {
        if (!claimId) {
          const res = await createClaim(payload).unwrap();
          dispatch(setClaimId(res.id));
        } else {
          await updateClaim({ id: claimId, ...payload }).unwrap();
        }
        dispatch(nextStep());
      } catch (err) {
        console.error(err);
        alert(err.data?.error?.message || 'Failed to save draft claim.');
      }
    } else {
      dispatch(nextStep());
    }
  };

  const handleBack = () => {
    dispatch(prevStep());
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0: return <SelectCatalogueStep />;
      case 1: return <DetailsStep />;
      case 2: return <AttachmentsStep />;
      case 3: return <ReviewStep />;
      case 4: return <SubmitStep />;
      default: return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 2, md: 4 }, 
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
        }}
      >
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          New Activity Claim
        </Typography>
        
        <Stepper activeStep={currentStep} alternativeLabel={!isMobile} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{isMobile && index !== currentStep ? '' : label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <React.Fragment>
          {currentStep === steps.length - 1 ? (
            <React.Fragment>
              {getStepContent(currentStep)}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button variant="contained" onClick={() => navigate('/claims')}>
                  Go to My Claims
                </Button>
              </Box>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Box sx={{ minHeight: '300px', py: 2 }}>
                {getStepContent(currentStep)}
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                {currentStep !== 0 && (
                  <Button onClick={handleBack} sx={{ mr: 1 }}>
                    Back
                  </Button>
                )}
                
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  {currentStep === steps.length - 2 ? 'Submit Claim' : 'Next'}
                </Button>
              </Box>
            </React.Fragment>
          )}
        </React.Fragment>
      </Paper>
    </Container>
  );
};

export default ClaimWizard;
