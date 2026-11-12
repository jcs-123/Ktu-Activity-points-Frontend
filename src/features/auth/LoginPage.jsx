/**
 * Login Page — S-01
 * Institution branding, username/password form, forgot password link.
 */

import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, Link, InputAdornment, IconButton,
} from '@mui/material';
import {
  Visibility, VisibilityOff, School as SchoolIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useLoginMutation } from '../../api/authApi';
import { setCredentials } from './authSlice';
import { claimApi } from '../../api/claimApi';

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Please enter your username and password.');
      return;
    }

    try {
      const result = await login(formData).unwrap();
      dispatch(claimApi.util.resetApiState());
      dispatch(setCredentials(result));

      // Redirect based on role
      if (result.roles.includes('ADMIN')) {
        navigate('/admin/users');
      } else if (result.roles.includes('PRINCIPAL')) {
        navigate('/principal/dashboard');
      } else if (result.roles.includes('SFA')) {
        navigate('/review');
      } else if (result.roles.includes('HOD') || result.roles.includes('FACULTY')) {
        navigate('/reports/deficiency');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.data?.error?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1F3864 0%, #2E5090 50%, #1F3864 100%)',
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'auto',
        py: { xs: 2.5, sm: 4 },
        px: { xs: 1.5, sm: 2 },
      }}
    >
      {/* Background pattern */}
      <Box sx={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(191,144,0,0.1) 0%, transparent 50%),
                          radial-gradient(circle at 75% 75%, rgba(191,144,0,0.08) 0%, transparent 50%)`,
      }} />

      <Card
        sx={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {/* Gold accent bar */}
        <Box sx={{
          height: 4,
          background: 'linear-gradient(90deg, #BF9000, #D4A833, #BF9000)',
          borderRadius: '12px 12px 0 0',
        }} />

        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          {/* Logo & Institution Name */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1F3864, #2E5090)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                boxShadow: '0 4px 16px rgba(31,56,100,0.3)',
              }}
            >
              <SchoolIcon sx={{ fontSize: 32, color: '#BF9000' }} />
            </Box>
            <Typography variant="h5" color="primary" fontWeight={700}>
              Activity Points Portal
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
              Jyothi Engineering College, Cheruthuruthy
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              KTU 2024 Scheme
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              id="username"
              name="username"
              label="Username / Admission No."
              placeholder="Enter your admission number or employee ID"
              fullWidth
              margin="normal"
              value={formData.username}
              onChange={handleChange}
              autoFocus
              autoComplete="username"
              slotProps={{
                input: {
                  sx: { borderRadius: 2 },
                },
              }}
            />

            <TextField
              id="password"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              slotProps={{
                input: {
                  sx: { borderRadius: 2 },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              id="login-button"
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #1F3864, #2E5090)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #152847, #1F3864)',
                },
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
                color="primary"
                underline="hover"
              >
                Forgot your password?
              </Link>
            </Box>
          </Box>
        </CardContent>

        {/* Footer */}
        <Box sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          px: { xs: 2.5, sm: 4 },
          py: 2,
          textAlign: 'center',
          bgcolor: 'grey.50',
          borderRadius: '0 0 12px 12px',
        }}>
          <Typography variant="caption" color="text.secondary">
            APJ Abdul Kalam Technological University • 2024 Scheme
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default LoginPage;
