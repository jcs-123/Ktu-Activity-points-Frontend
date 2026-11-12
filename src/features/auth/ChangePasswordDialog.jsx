import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Alert, Box, Typography, CircularProgress,
} from '@mui/material';
import { LockReset } from '@mui/icons-material';
import { useChangePasswordMutation } from '../../api/authApi';
import { PasswordTextField } from './AuthCardLayout';

/**
 * Self-service password change dialog accessible to every authenticated login role.
 */
const ChangePasswordDialog = ({ open, onClose, username }) => {
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleClose = () => {
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setError('');
    setSuccess('');
    onClose();
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('All password fields are required.');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    try {
      const res = await changePassword({
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
      }).unwrap();
      setSuccess(res?.message || 'Password changed successfully.');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err?.data?.error?.message || 'Failed to update password. Please check your current password.');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: 'primary.main' }}>
        <LockReset color="primary" />
        Reset / Change Password
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {username && (
            <Typography variant="body2" color="text.secondary">
              Updating password for account <strong>{username}</strong>.
            </Typography>
          )}

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <PasswordTextField
            name="currentPassword"
            label="Current Password"
            value={formData.currentPassword}
            onChange={handleChange}
            autoComplete="current-password"
            size="small"
          />

          <PasswordTextField
            name="newPassword"
            label="New Password"
            value={formData.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
            helperText="Minimum 8 characters"
            size="small"
          />

          <PasswordTextField
            name="confirmPassword"
            label="Confirm New Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            size="small"
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} color="inherit" disabled={isLoading}>
            {success ? 'Close' : 'Cancel'}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <LockReset />}
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ChangePasswordDialog;

