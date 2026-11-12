/**
 * App Layout — Sidebar navigation + TopBar
 * Role-based navigation items.
 */

import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, IconButton,
  Avatar, Menu, MenuItem, Divider, Badge, useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, NoteAdd, Assignment,
  RateReview, Assessment, Leaderboard, People,
  History, Notifications, School,
  Logout, ChevronLeft, BarChart, Description,
  AdminPanelSettings, CalendarMonth, Warning, LockReset,
} from '@mui/icons-material';
import { selectCurrentUser, selectUserRoles, clearCredentials } from '../../features/auth/authSlice';
import { useLogoutMutation } from '../../api/authApi';
import { useGetNotificationsQuery } from '../../api/notificationApi';
import { claimApi } from '../../api/claimApi';
import ChangePasswordDialog from '../../features/auth/ChangePasswordDialog';

const DRAWER_WIDTH = 260;

const getNavItems = (roles = []) => {
  const items = [];

  // Student items
  if (roles.includes('STUDENT')) {
    items.push(
      { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { label: 'New Claim', icon: <NoteAdd />, path: '/claims/new' },
      { label: 'My Claims', icon: <Assignment />, path: '/claims' },
      { label: 'My Report', icon: <Description />, path: '/my-report' },
      { label: 'Leaderboard', icon: <Leaderboard />, path: '/leaderboard' },
    );
  }

  // SFA items
  if (roles.includes('SFA')) {
    items.push(
      { divider: true, label: 'SFA Review' },
      { label: 'Review Queue', icon: <RateReview />, path: '/review' },
      { label: 'SFA Dashboard', icon: <BarChart />, path: '/sfa/dashboard' },
    );
  }

  // Principal items
  if (roles.includes('PRINCIPAL')) {
    items.push(
      { divider: true, label: 'Executive Oversight' },
      { label: 'Executive Dashboard', icon: <School />, path: '/principal/dashboard' },
      { label: 'Deficiency Report', icon: <Warning />, path: '/reports/deficiency' },
      { label: 'Leaderboard', icon: <Leaderboard />, path: '/leaderboard' },
    );
  }

  // HOD / Faculty reports
  if ((roles.includes('SFA') || roles.includes('FACULTY') || roles.includes('HOD')) && !roles.includes('PRINCIPAL')) {
    items.push(
      { divider: true, label: 'Reports' },
      { label: 'Deficiency Report', icon: <Warning />, path: '/reports/deficiency' },
      { label: 'Leaderboard', icon: <Leaderboard />, path: '/leaderboard' },
    );
  }

  // HOD / Admin analytics
  if (roles.includes('HOD') || roles.includes('ADMIN')) {
    items.push(
      { label: 'Analytics', icon: <Assessment />, path: '/analytics' },
    );
  }

  // Admin items
  if (roles.includes('ADMIN')) {
    items.push(
      { divider: true, label: 'Administration' },
      { label: 'Users', icon: <People />, path: '/admin/users' },
      { label: 'Catalogue', icon: <AdminPanelSettings />, path: '/admin/catalogue' },
      { label: 'Semesters', icon: <CalendarMonth />, path: '/admin/semesters' },
      { label: 'Audit Log', icon: <History />, path: '/admin/audit' },
    );
  }

  return items;
};

const AppLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const user = useSelector(selectCurrentUser);
  const roles = useSelector(selectUserRoles);
  const [logout] = useLogoutMutation();
  const { data: notifData } = useGetNotificationsQuery(undefined, { pollingInterval: 15000 });
  const unreadCount = notifData?.meta?.unreadCount || 0;

  // Persist sidebar state across refreshes
  const savedDrawer = typeof window !== 'undefined'
    ? localStorage.getItem('sidebarOpen')
    : null;
  const [drawerOpen, setDrawerOpen] = useState(
    savedDrawer !== null ? savedDrawer === 'true' : !isMobile
  );
  const [anchorEl, setAnchorEl] = useState(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  // Sync drawer with screen size changes (mobile/desktop switch without overwriting desktop pref)
  useEffect(() => {
    if (isMobile) {
      setDrawerOpen(false);
    } else {
      const saved = localStorage.getItem('sidebarOpen');
      setDrawerOpen(saved !== null ? saved === 'true' : true);
    }
  }, [isMobile]);

  // Persist drawer toggle only on desktop
  const toggleDrawer = () => {
    const next = !drawerOpen;
    setDrawerOpen(next);
    if (!isMobile) {
      localStorage.setItem('sidebarOpen', String(next));
    }
  };

  const navItems = getNavItems(roles);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // Logout even if API call fails
    }
    dispatch(claimApi.util.resetApiState());
    dispatch(clearCredentials());
    navigate('/login');
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <School sx={{ color: 'secondary.main', fontSize: 28 }} />
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="primary" noWrap>
              Activity Points
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              KTU 2024 Scheme
            </Typography>
          </Box>
        </Box>
        {isMobile && (
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <ChevronLeft />
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {navItems.map((item, index) => {
          if (item.divider) {
            return (
              <Box key={index}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="overline" color="text.secondary" sx={{ px: 2, py: 0.5 }}>
                  {item.label}
                </Typography>
              </Box>
            );
          }

          const isActive = location.pathname === item.path;

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.3 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setDrawerOpen(false);
                }}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '& .MuiListItemIcon-root': { color: 'white' },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'white' : 'primary.main' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: { fontSize: '0.875rem', fontWeight: isActive ? 600 : 400 }
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User Info */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 14 }}>
            {user?.fullName?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.fullName || 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {user?.student?.class?.department
                ? `${user.student.class.name} • ${user.student.class.department.code || user.student.class.department.name}`
                : roles.join(', ')}
            </Typography>
            {user?.student?.class?.department?.name && (
              <Typography variant="caption" color="text.secondary" noWrap display="block" title={user.student.class.department.name}>
                {user.student.class.department.name}
              </Typography>
            )}
          </Box>
          <IconButton
            size="small"
            color="primary"
            onClick={() => {
              setPasswordDialogOpen(true);
              if (isMobile) setDrawerOpen(false);
            }}
            aria-label="Reset / Change Password"
            title="Reset / Change Password"
          >
            <LockReset fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={isMobile ? { keepMounted: true } : undefined}
        sx={{
          width: !isMobile && drawerOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            maxWidth: '82vw',
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* TopBar */}
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Toolbar sx={{ px: { xs: 1.5, sm: 2.5 }, gap: 1 }}>
            <IconButton
              edge="start"
              onClick={toggleDrawer}
              aria-label="Toggle navigation menu"
            >
              <MenuIcon />
            </IconButton>

            {(isMobile || !drawerOpen) && (
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color="primary"
                noWrap
                sx={{ minWidth: 0 }}
              >
                Activity Points
              </Typography>
            )}

            <Box sx={{ flex: 1 }} />

            {/* Notifications */}
            <IconButton onClick={() => navigate('/notifications')} aria-label="Notifications">
              <Badge badgeContent={unreadCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>

            {/* User menu */}
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 0.5 }} aria-label="Account menu">
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: 14 }}>
                {user?.fullName?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{
                paper: {
                  sx: { maxWidth: { xs: 'calc(100vw - 24px)', sm: 340 } },
                },
              }}
            >
              <MenuItem disabled sx={{ whiteSpace: 'normal' }}>
                <Typography variant="body2" fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>
                  {user?.fullName}
                </Typography>
              </MenuItem>
              <MenuItem disabled sx={{ whiteSpace: 'normal' }}>
                <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                  {user?.email}
                </Typography>
              </MenuItem>
              {user?.student?.class?.department && (
                <MenuItem disabled sx={{ whiteSpace: 'normal' }}>
                  <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ whiteSpace: 'normal' }}>
                    {user.student.class.name} • {user.student.class.department.code ? `${user.student.class.department.code} — ` : ''}{user.student.class.department.name}
                  </Typography>
                </MenuItem>
              )}
              <Divider />
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  setPasswordDialogOpen(true);
                }}
              >
                <ListItemIcon><LockReset fontSize="small" /></ListItemIcon>
                Reset / Change Password
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
                Sign Out
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box component="main" sx={{ flex: 1, minWidth: 0, bgcolor: 'background.default', overflowX: 'hidden' }}>
          <Outlet />
        </Box>
      </Box>

      <ChangePasswordDialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        username={user?.username}
      />
    </Box>
  );
};

export default AppLayout;
