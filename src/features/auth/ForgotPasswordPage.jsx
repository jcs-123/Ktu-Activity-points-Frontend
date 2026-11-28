import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Alert, CircularProgress, Link, Typography,
} from '@mui/material';
import { ArrowBack, Email as EmailIcon, Key as KeyIcon } from '@mui/icons-material';
import { useForgotPasswordMutation } from '../../api/authApi';
import AuthCardLayout from './AuthCardLayout';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [responseInfo, setResponseInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResponseInfo(null);

    if (!identifier.trim()) {
      setError('Please enter your Username, Admission No., or Registered Email.');
      return;
    }

    try {
      const res = await forgotPassword({ identifier: identifier.trim(), email: identifier.trim() }).unwrap();
      setResponseInfo(res);
    } catch (err) {
      setError(err?.data?.error?.message || 'Unable to process reset request right now.');
    }
  };

  return (
    <AuthCardLayout
      title="Forgot Password"
      subtitle="Enter your Admission No., Desk ID, or registered email address to reset your password."
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {responseInfo && (
        <Alert severity={responseInfo.devResetToken ? 'success' : responseInfo.emailConfigured === false ? 'info' : 'success'} sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={500}>{responseInfo.message}</Typography>
          {responseInfo.devResetToken && (
            <Box sx={{ mt: 1.5 }}>
              <Button
                fullWidth
                size="medium"
                variant="contained"
                color="primary"
                startIcon={<KeyIcon />}
                onClick={() => navigate(`/reset-password?token=${encodeURIComponent(responseInfo.devResetToken)}`)}
                sx={{ fontWeight: 700, textTransform: 'none', py: 1 }}
              >
                Continue to Set New Password
              </Button>
            </Box>
          )}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          id="identifier"
          name="identifier"
          label="Username / Admission No. / Email"
          placeholder="e.g. JEC25EC006, s3ce_sfa, or email@jecc.ac.in"
          fullWidth
          margin="normal"
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            setError('');
          }}
          autoFocus
          slotProps={{
            input: { sx: { borderRadius: 2 } },
          }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <EmailIcon />}
          sx={{
            mt: 2.5,
            mb: 2,
            py: 1.4,
            background: 'linear-gradient(135deg, #1F3864, #2E5090)',
            '&:hover': {
              background: 'linear-gradient(135deg, #152847, #1F3864)',
            },
          }}
        >
          {isLoading ? 'Sending...' : 'Request Password Reset'}
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Link
            component={RouterLink}
            to="/login"
            variant="body2"
            underline="hover"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            <ArrowBack fontSize="small" />
            Back to Sign In
          </Link>

          <Link component={RouterLink} to="/reset-password" variant="body2" underline="hover">
            Have a reset token?
          </Link>
        </Box>
      </Box>
    </AuthCardLayout>
  );
};

export default ForgotPasswordPage;

