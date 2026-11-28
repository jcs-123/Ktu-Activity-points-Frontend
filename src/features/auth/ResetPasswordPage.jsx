import { useState, useEffect } from 'react';
import { Link as RouterLink, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Alert, CircularProgress, Link,
} from '@mui/material';
import { ArrowBack, LockReset, Login as LoginIcon } from '@mui/icons-material';
import { useResetPasswordMutation } from '../../api/authApi';
import AuthCardLayout, { PasswordTextField } from './AuthCardLayout';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const [formData, setFormData] = useState({
    token: searchParams.get('token') || '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const queryToken = searchParams.get('token');
    if (queryToken) {
      setFormData((prev) => ({ ...prev, token: queryToken }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.token.trim() || !formData.newPassword || !formData.confirmPassword) {
      setError('Reset token, new password, and confirmation are required.');
      return;
    }

    if (formData.newPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    try {
      const res = await resetPassword({
        token: formData.token.trim(),
        new_password: formData.newPassword,
      }).unwrap();
      setSuccess(res?.message || 'Password has been reset successfully.');
      setFormData((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
    } catch (err) {
      setError(err?.data?.error?.message || 'Failed to reset password. The token may be invalid or expired.');
    }
  };

  return (
    <AuthCardLayout
      title="Set New Password"
      subtitle="Enter your reset token and choose a new password (minimum 4 characters)."
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {success ? (
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<LoginIcon />}
          onClick={() => navigate('/login')}
          sx={{
            mt: 1,
            py: 1.4,
            background: 'linear-gradient(135deg, #1F3864, #2E5090)',
          }}
        >
          Sign In with New Password
        </Button>
      ) : (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            name="token"
            label="Reset Token"
            placeholder="Paste the reset token from your email"
            fullWidth
            value={formData.token}
            onChange={handleChange}
            slotProps={{
              input: { sx: { borderRadius: 2 } },
            }}
          />

          <PasswordTextField
            name="newPassword"
            label="New Password"
            value={formData.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
            helperText="Minimum 8 characters"
          />

          <PasswordTextField
            name="confirmPassword"
            label="Confirm New Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LockReset />}
            sx={{
              mt: 0.5,
              py: 1.4,
              background: 'linear-gradient(135deg, #1F3864, #2E5090)',
              '&:hover': {
                background: 'linear-gradient(135deg, #152847, #1F3864)',
              },
            }}
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
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
          </Box>
        </Box>
      )}
    </AuthCardLayout>
  );
};

export default ResetPasswordPage;

