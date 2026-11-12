import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, InputAdornment, IconButton,
} from '@mui/material';
import {
  School as SchoolIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';

/**
 * Shared password input with visibility toggle.
 */
export const PasswordTextField = ({ label, value, onChange, name, autoComplete, helperText, ...rest }) => {
  const [show, setShow] = useState(false);

  return (
    <TextField
      name={name}
      label={label}
      type={show ? 'text' : 'password'}
      fullWidth
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      helperText={helperText}
      slotProps={{
        input: {
          sx: { borderRadius: 2 },
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShow((prev) => !prev)}
                edge="end"
                size="small"
                aria-label={`Toggle ${label} visibility`}
              >
                {show ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      {...rest}
    />
  );
};

/**
 * Shared responsive card layout for public auth flows (Forgot / Reset Password).
 */
const AuthCardLayout = ({ title, subtitle, children }) => (
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
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(191,144,0,0.1) 0%, transparent 50%),
                          radial-gradient(circle at 75% 75%, rgba(191,144,0,0.08) 0%, transparent 50%)`,
      }}
    />

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
      <Box
        sx={{
          height: 4,
          background: 'linear-gradient(90deg, #BF9000, #D4A833, #BF9000)',
          borderRadius: '12px 12px 0 0',
        }}
      />

      <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1F3864, #2E5090)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1.5,
              boxShadow: '0 4px 16px rgba(31,56,100,0.3)',
            }}
          >
            <SchoolIcon sx={{ fontSize: 28, color: '#BF9000' }} />
          </Box>
          <Typography variant="h5" color="primary" fontWeight={700}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {children}
      </CardContent>

      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          px: { xs: 2.5, sm: 4 },
          py: 2,
          textAlign: 'center',
          bgcolor: 'grey.50',
          borderRadius: '0 0 12px 12px',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Jyothi Engineering College • KTU Activity Points Portal
        </Typography>
      </Box>
    </Card>
  </Box>
);

export default AuthCardLayout;

