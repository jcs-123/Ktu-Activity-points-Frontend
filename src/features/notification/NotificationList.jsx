import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Paper, CircularProgress, 
  List, ListItem, ListItemText, ListItemIcon, 
  Button, Chip, Divider, IconButton
} from '@mui/material';
import { 
  CheckCircle, Cancel, Warning, Info, 
  DoneAll, ArrowForward
} from '@mui/icons-material';
import { 
  useGetNotificationsQuery, 
  useMarkAsReadMutation, 
  useMarkAllAsReadMutation 
} from '../../api/notificationApi';

const TYPE_ICONS = {
  CLAIM_APPROVED: <CheckCircle sx={{ color: 'success.main' }} />,
  CLAIM_REJECTED: <Cancel sx={{ color: 'error.main' }} />,
  CLAIM_REVERTED: <Warning sx={{ color: 'warning.main' }} />,
  SYSTEM: <Info sx={{ color: 'info.main' }} />,
};

const NotificationList = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetNotificationsQuery();
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await markAsRead(notif._id).unwrap();
      } catch (err) {
        console.error(err);
      }
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error" variant="h6">Failed to load notifications.</Typography>
      </Box>
    );
  }

  const notifications = data?.data || [];
  const unreadCount = data?.meta?.unreadCount || 0;

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 4 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Notification Centre
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Stay updated on your claim submission statuses and reviewer updates.
          </Typography>
        </Box>

        {unreadCount > 0 && (
          <Button 
            variant="outlined" 
            startIcon={<DoneAll />}
            onClick={() => markAllAsRead()}
            disabled={isMarkingAll}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Mark All as Read
          </Button>
        )}
      </Box>

      {/* Notifications Paper List */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {notifications.length === 0 ? (
          <Box sx={{ p: { xs: 4, sm: 6 }, textAlign: 'center' }}>
            <Info sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="h6" color="text.secondary">No notifications yet.</Typography>
            <Typography variant="body2" color="text.secondary">
              Notifications will appear here when an advisor reviews your submitted claims.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((notif, index) => (
              <React.Fragment key={notif._id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    py: 2,
                    pl: { xs: 1.5, sm: 3 },
                    pr: { xs: 6, sm: 7 },
                    bgcolor: notif.isRead ? 'background.paper' : 'rgba(33, 150, 243, 0.08)',
                    cursor: 'pointer',
                    alignItems: 'flex-start',
                    '&:hover': {
                      bgcolor: notif.isRead ? 'grey.50' : 'rgba(33, 150, 243, 0.14)',
                    },
                  }}
                  onClick={() => handleNotificationClick(notif)}
                  secondaryAction={
                    <IconButton edge="end" aria-label="Open notification">
                      <ArrowForward fontSize="small" color="action" />
                    </IconButton>
                  }
                >
                  <ListItemIcon sx={{ minWidth: { xs: 36, sm: 44 }, mt: 0.5 }}>
                    {TYPE_ICONS[notif.type] || TYPE_ICONS.SYSTEM}
                  </ListItemIcon>

                  <ListItemText
                    slotProps={{
                      primary: { component: 'div' },
                      secondary: { component: 'div' },
                    }}
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                        <Typography variant="body1" fontWeight={notif.isRead ? 500 : 700} sx={{ overflowWrap: 'anywhere' }}>
                          {notif.title}
                        </Typography>
                        {!notif.isRead && (
                          <Chip label="NEW" color="primary" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 'bold' }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.primary" sx={{ mb: 0.5, overflowWrap: 'anywhere' }}>
                          {notif.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notif.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default NotificationList;
