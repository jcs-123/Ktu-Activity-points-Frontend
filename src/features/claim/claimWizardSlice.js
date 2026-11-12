import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentStep: 0,
  claimId: null,
  catalogueItem: null,
  details: {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    semester: '',
    academicYear: '2026-2027',
    hours: '',
    pointsClaimed: '',
  },
  attachments: [],
  warnings: [],
  isSubmitting: false,
  error: null,
};

const claimWizardSlice = createSlice({
  name: 'claimWizard',
  initialState,
  reducers: {
    nextStep: (state) => {
      state.currentStep += 1;
    },
    prevStep: (state) => {
      if (state.currentStep > 0) {
        state.currentStep -= 1;
      }
    },
    setStep: (state, action) => {
      state.currentStep = action.payload;
    },
    setCatalogueItem: (state, action) => {
      state.catalogueItem = action.payload;
    },
    setClaimId: (state, action) => {
      state.claimId = action.payload;
    },
    updateDetails: (state, action) => {
      state.details = { ...state.details, ...action.payload };
    },
    addAttachment: (state, action) => {
      state.attachments.push(action.payload);
    },
    removeAttachment: (state, action) => {
      state.attachments = state.attachments.filter((_, index) => index !== action.payload);
    },
    setWarnings: (state, action) => {
      state.warnings = action.payload || [];
    },
    resetWizard: (state) => {
      return initialState;
    },
  },
});

export const {
  nextStep,
  prevStep,
  setStep,
  setCatalogueItem,
  setClaimId,
  updateDetails,
  addAttachment,
  removeAttachment,
  setWarnings,
  resetWizard,
} = claimWizardSlice.actions;

export default claimWizardSlice.reducer;
