import React, { useState } from 'react';
import {
  Box, Typography, Paper, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Tabs, Tab, Chip, Alert, IconButton, Grid, Avatar,
  TablePagination, Card, CardContent, InputAdornment
} from '@mui/material';
import {
  PersonAdd, Upload, Group, Search, Clear,
  School, ManageAccounts, Edit as EditIcon, Badge as BadgeIcon, Add as AddIcon,
  VerifiedUser, SwapHoriz, LockReset
} from '@mui/icons-material';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetClassesQuery,
  useGetDepartmentsQuery,
  useGetRoleAssignmentsQuery,
  useCreateRoleAssignmentMutation
} from '../../api/adminApi';
import BulkStudentCreate from './BulkStudentCreate';
import { PasswordTextField } from '../auth/AuthCardLayout';

const detectLateralPattern = (username = '', email = '') => {
  const uUpper = String(username).trim().toUpperCase();
  const eLower = String(email).trim().toLowerCase();
  return (
    /^L([A-Z]{2,4})?\d{2}/.test(uUpper) ||
    uUpper.startsWith('LJEC') ||
    /\.l(?:ec|cs|ce|me|ee|ad|cy|mr|e)?\d*@/.test(eLower)
  );
};

const UserAdmin = () => {
  const [activeTab, setActiveTab] = useState(0);

  // Tab 0 Filters & Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Create User Dialog
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [createError, setCreateError] = useState('');
  const [categoryManuallySet, setCategoryManuallySet] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mobile: '',
    password: '1234',
    fullName: '',
    userType: 'STUDENT',
    role: 'SFA',
    classId: '',
    category: 'REGULAR',
    admissionDate: '2025-08-01',
    gender: 'OTHER',
  });

  // Edit User State
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editError, setEditError] = useState('');
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    userType: 'STUDENT',
    status: 'ACTIVE',
    category: 'REGULAR',
    classId: '',
  });

  // Quick Password Reset State (any user account)
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Role Assignment State (Class SFA Desks & Admin/Principal)
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [roleError, setRoleError] = useState('');
  const [selectedRoleDeptFilter, setSelectedRoleDeptFilter] = useState('');
  const [roleFormData, setRoleFormData] = useState({
    userId: '',
    role: 'SFA',
    scopeType: 'CLASS',
    scopeId: '',
  });

  // Queries & Mutations
  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(searchInput.trim() && { search: searchInput.trim() }),
    ...(roleFilter && { role: roleFilter }),
    ...(departmentFilter && { departmentId: departmentFilter }),
    ...(classFilter && { classId: classFilter }),
    ...(categoryFilter && { category: categoryFilter }),
  };

  const { data: usersData, isLoading: isLoadingUsers, isFetching: isFetchingUsers } = useGetUsersQuery(
    queryParams,
    { skip: activeTab === 2 || activeTab === 3 }
  );
  const { data: staffUsersData } = useGetUsersQuery(
    { userType: 'FACULTY', limit: 200 },
    { skip: !openRoleDialog }
  );
  const {
    data: classesData,
    refetch: refetchClasses,
    isFetching: isFetchingClasses,
  } = useGetClassesQuery();
  const { data: departmentsData } = useGetDepartmentsQuery(undefined, {
    skip: activeTab === 2,
  });
  const { data: roleAssignmentsData, isLoading: isLoadingRoles } = useGetRoleAssignmentsQuery(
    undefined,
    { skip: activeTab !== 1 }
  );

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [createRoleAssignment, { isLoading: isAssigningRole }] = useCreateRoleAssignmentMutation();

  const users = usersData?.data || [];
  const totalUsersCount = usersData?.meta?.total || 0;
  const dbCounts = usersData?.meta?.counts || {};
  const staffUsers = staffUsersData?.data || [];
  const classes = [...(classesData?.data || [])].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const departments = departmentsData?.data || [];
  const roleAssignments = roleAssignmentsData?.data || [];

  const filteredClassesForFilter = departmentFilter
    ? classes.filter((cls) => (cls.department?._id || cls.department) === departmentFilter)
    : classes;

  const filteredRoleAssignments = roleAssignments.filter((assignment) => {
    if (!selectedRoleDeptFilter) return true;
    return (assignment.departmentName || '').toLowerCase().includes(selectedRoleDeptFilter.toLowerCase());
  });

  const handleResetFilters = () => {
    setSearchInput('');
    setRoleFilter('');
    setDepartmentFilter('');
    setClassFilter('');
    setCategoryFilter('');
    setPage(0);
  };

  const handleRoleAssignSubmit = async () => {
    setRoleError('');
    if (!roleFormData.userId || !roleFormData.role || !roleFormData.scopeType) {
      setRoleError('User, Role, and Scope Type are required.');
      return;
    }
    if (roleFormData.scopeType !== 'INSTITUTION' && !roleFormData.scopeId) {
      setRoleError('Please select a Target Scope (Class or Department).');
      return;
    }
    try {
      await createRoleAssignment(roleFormData).unwrap();
      setOpenRoleDialog(false);
      setRoleFormData({ userId: '', role: 'SFA', scopeType: 'CLASS', scopeId: '' });
    } catch (err) {
      setRoleError(err.data?.error?.message || err.data?.message || 'Failed to assign role.');
    }
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditError('');
    setEditFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      mobile: user.mobile || '',
      password: '',
      userType: user.userType || 'STUDENT',
      status: user.status || 'ACTIVE',
      category: user.studentProfile?.category || 'REGULAR',
      classId: user.studentProfile?.class?._id || user.studentProfile?.class || '',
    });
    setOpenEditDialog(true);
  };

  const handleEditFormChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleUpdateUserSubmit = async () => {
    setEditError('');
    if (!editFormData.fullName || !editFormData.email) {
      setEditError('Full Name and Email are required.');
      return;
    }
    try {
      const payload = {
        id: editingUser._id,
        fullName: editFormData.fullName,
        email: editFormData.email,
        mobile: editFormData.mobile,
        userType: editFormData.userType,
        status: editFormData.status,
        category: editFormData.category,
        classId: editFormData.classId,
      };
      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim();
      }
      await updateUser(payload).unwrap();
      setOpenEditDialog(false);
      setEditingUser(null);
    } catch (err) {
      setEditError(err.data?.error?.message || err.data?.message || 'Failed to update user account.');
    }
  };

  const handleOpenQuickReset = (targetUser) => {
    setResetTargetUser(targetUser);
    setResetNewPassword('');
    setResetError('');
    setResetSuccess('');
  };

  const handleQuickResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    const trimmed = resetNewPassword.trim();
    if (trimmed.length < 4) {
      setResetError('Password must be at least 4 characters.');
      return;
    }
    try {
      await updateUser({ id: resetTargetUser._id, password: trimmed }).unwrap();
      setResetSuccess(`Password updated for ${resetTargetUser.username}.`);
      setResetNewPassword('');
    } catch (err) {
      setResetError(err?.data?.error?.message || err?.data?.message || 'Failed to reset password.');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const next = { ...formData, [name]: value };

    if (name === 'category') {
      setCategoryManuallySet(true);
    }

    if ((name === 'username' || name === 'email') && !categoryManuallySet && next.userType === 'STUDENT') {
      next.category = detectLateralPattern(next.username, next.email) ? 'LATERAL_ENTRY' : 'REGULAR';
    }

    setFormData(next);
  };

  const handleCreateUserSubmit = async () => {
    setCreateError('');
    if (!formData.username || !formData.email || !formData.password || !formData.fullName) {
      setCreateError('Username, Full Name, Email, and Password are required.');
      return;
    }
    if (formData.userType === 'STUDENT' && !formData.classId) {
      setCreateError('Please select a Class for the student account.');
      return;
    }
    if (formData.userType === 'FACULTY' && formData.role === 'SFA' && !formData.classId) {
      setCreateError('Please select the Target Class for this Class SFA Desk login.');
      return;
    }
    try {
      await createUser(formData).unwrap();
      setOpenCreateDialog(false);
      setCategoryManuallySet(false);
      setFormData({
        username: '',
        email: '',
        mobile: '',
        password: '1234',
        fullName: '',
        userType: 'STUDENT',
        role: 'SFA',
        classId: '',
        category: 'REGULAR',
        admissionDate: '2025-08-01',
        gender: 'OTHER',
      });
    } catch (err) {
      setCreateError(err.data?.error?.message || err.data?.message || 'Failed to create user account.');
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <ManageAccounts sx={{ fontSize: { xs: 32, sm: 40 }, color: 'primary.main', flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" fontWeight="bold">
              User & Login Management
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage Regular (120 pts) & Lateral Entry (90 pts) students, Class SFA Desks, and Bulk Imports
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Upload />}
            onClick={() => setActiveTab(2)}
            sx={{ borderRadius: 3 }}
          >
            Bulk Student Login Create
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setOpenCreateDialog(true)}
            sx={{ borderRadius: 3 }}
          >
            Create User
          </Button>
        </Box>
      </Box>

      {/* Institutional Account Summary Strip */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderLeft: '4px solid #1F3864', borderRadius: 2 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL ACCOUNTS</Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                {dbCounts.totalUsers ?? totalUsersCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderLeft: '4px solid #0284C7', borderRadius: 2 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>REGULAR STUDENTS (120 PTS)</Typography>
              <Typography variant="h5" fontWeight="bold" color="#0284C7">
                {dbCounts.regularStudents ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderLeft: '4px solid #7C3AED', borderRadius: 2 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>LATERAL ENTRY (90 PTS)</Typography>
              <Typography variant="h5" fontWeight="bold" color="#7C3AED">
                {dbCounts.lateralStudents ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderLeft: '4px solid #D97706', borderRadius: 2 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>CLASS SFA DESKS</Typography>
              <Typography variant="h5" fontWeight="bold" color="#D97706">
                {dbCounts.sfaDesks ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
          <Tab icon={<Group />} iconPosition="start" label={`All Accounts (${dbCounts.totalUsers ?? totalUsersCount})`} />
          <Tab icon={<BadgeIcon />} iconPosition="start" label="Class SFA Desks & Staff Roles" />
          <Tab icon={<Upload />} iconPosition="start" label="Bulk Student Login Creation (CSV)" />
          <Tab icon={<School />} iconPosition="start" label={`Departments & Classes (${classes.length})`} />
        </Tabs>
      </Paper>

      {/* TAB 0: All Accounts list with Search, Filters & Pagination */}
      {activeTab === 0 && (
        <Box>
          <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search username (e.g. LJEC25EC063, s3ece_sfa), name..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setPage(0);
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={roleFilter}
                    label="Role"
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="">All Roles</MenuItem>
                    <MenuItem value="SFA">SFA Desk</MenuItem>
                    <MenuItem value="STUDENT">Student</MenuItem>
                    <MenuItem value="ADMIN">Admin</MenuItem>
                    <MenuItem value="PRINCIPAL">Principal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={departmentFilter}
                    label="Department"
                    onChange={(e) => {
                      setDepartmentFilter(e.target.value);
                      setClassFilter('');
                      setPage(0);
                    }}
                  >
                    <MenuItem value="">All Departments</MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept._id} value={dept._id}>
                        {dept.code} — {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Class / Batch</InputLabel>
                  <Select
                    value={classFilter}
                    label="Class / Batch"
                    onChange={(e) => {
                      setClassFilter(e.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="">All Classes</MenuItem>
                    {filteredClassesForFilter.map((cls) => (
                      <MenuItem key={cls._id} value={cls._id}>
                        {cls.name} {cls.batch?.name ? `(${cls.batch.name})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Category"
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    <MenuItem value="REGULAR">Regular (120 Pts)</MenuItem>
                    <MenuItem value="LATERAL_ENTRY">Lateral Entry (90 Pts)</MenuItem>
                    <MenuItem value="PWD">PwD (60 Pts)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 6, sm: 4, md: 2, lg: 1 }}>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={handleResetFilters}
                  disabled={!searchInput && !roleFilter && !departmentFilter && !classFilter && !categoryFilter}
                >
                  Clear
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', opacity: isFetchingUsers ? 0.75 : 1 }}>
            <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
              {isLoadingUsers ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Table sx={{ minWidth: 800 }} size="small">
                <TableHead sx={{ backgroundColor: 'primary.main' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1.5 }}>Name & Admission Category</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Username / ID</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Class / Scope</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email / Mobile</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Role</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        No user accounts match your current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => {
                      const isLateral = user.studentProfile?.category === 'LATERAL_ENTRY';
                      const primaryRole = user.roles?.[0] || user.userType;
                      const classLabel = user.studentProfile?.class?.name
                        || user.roleAssignments?.find((ra) => ra.scopeType === 'CLASS')?.targetName
                        || (primaryRole === 'ADMIN' || primaryRole === 'PRINCIPAL' ? 'Institution' : '—');

                      return (
                        <TableRow key={user._id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                              <Avatar
                                sx={{
                                  bgcolor: isLateral ? '#7C3AED' : primaryRole === 'SFA' ? '#D97706' : 'secondary.main',
                                  width: 32,
                                  height: 32,
                                  fontSize: 13,
                                }}
                              >
                                {user.fullName?.charAt(0) || '?'}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">{user.fullName}</Typography>
                                {user.userType === 'STUDENT' && user.studentProfile?.category && (
                                  <Chip
                                    label={isLateral ? 'LATERAL ENTRY • 90 PTS' : `${user.studentProfile.category} • 120 PTS`}
                                    size="small"
                                    variant={isLateral ? 'filled' : 'outlined'}
                                    color={isLateral ? 'secondary' : 'default'}
                                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: isLateral ? 700 : 500, mt: 0.3 }}
                                  />
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{user.username}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>{classLabel}</Typography>
                            {user.studentProfile?.class?.batch?.name && (
                              <Typography variant="caption" color="text.secondary">
                                {user.studentProfile.class.batch.name}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{user.email}</Typography>
                            <Typography variant="caption" color="text.secondary">{user.mobile || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={primaryRole === 'SFA' ? 'SFA DESK' : primaryRole}
                              size="small"
                              color={
                                primaryRole === 'ADMIN' ? 'error'
                                : primaryRole === 'SFA' ? 'warning'
                                : primaryRole === 'PRINCIPAL' ? 'info'
                                : 'default'
                              }
                              sx={{ fontWeight: 'bold' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.status}
                              size="small"
                              color={user.status === 'ACTIVE' ? 'success' : 'warning'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenEdit(user)}
                                title="Edit User"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => handleOpenQuickReset(user)}
                                title="Reset Password"
                              >
                                <LockReset fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
            </TableContainer>
            <TablePagination
              component="div"
              count={totalUsersCount}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[25, 50, 100]}
            />
          </Paper>
        </Box>
      )}

      {/* TAB 1: Class SFA Desk Logins & Staff Roles */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="info" icon={<VerifiedUser />} sx={{ borderRadius: 2 }}>
            <strong>Class-Based SFA Desk Model:</strong> Personal faculty identities are not shown. Each class uses one dedicated generic SFA desk login (e.g. <code>s3ece_sfa</code>, <code>s3ce_sfa</code>) scoped strictly to that class. New classes automatically provision their own SFA desk login.
          </Alert>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Active Class SFA Desk Logins & Administrative Roles ({filteredRoleAssignments.length})
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
                <InputLabel>Filter by Department</InputLabel>
                <Select
                  value={selectedRoleDeptFilter}
                  label="Filter by Department"
                  onChange={(e) => setSelectedRoleDeptFilter(e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Departments</em>
                  </MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d._id} value={d.name}>
                      {d.name} ({d.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                color="secondary"
                startIcon={<AddIcon />}
                onClick={() => setOpenRoleDialog(true)}
                sx={{ borderRadius: 2 }}
              >
                Assign / Switch Role Scope
              </Button>
            </Box>
          </Box>

          <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflowX: 'auto', width: '100%' }}>
            {isLoadingRoles ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ backgroundColor: 'secondary.main' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Desk Account / Display Name</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Login Username</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Assigned Role</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Department</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Scoped Class / Target</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Assigned Date</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Reset Password</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRoleAssignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        No Class SFA Desk or Administrative role assignments found for this selection.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRoleAssignments.map((assignment) => (
                      <TableRow key={assignment._id} hover>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          {assignment.user?.fullName || 'Desk Account'}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {assignment.user?.username}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={assignment.role}
                            size="small"
                            color={assignment.role === 'SFA' ? 'warning' : assignment.role === 'ADMIN' ? 'error' : 'info'}
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {assignment.departmentName || 'All Departments'}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {assignment.targetName || assignment.scopeId?.name || 'Institution-wide'}
                        </TableCell>
                        <TableCell>
                          {new Date(assignment.validFrom || assignment.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {assignment.user?._id && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              startIcon={<LockReset fontSize="small" />}
                              onClick={() => handleOpenQuickReset(assignment.user)}
                            >
                              Reset
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </Box>
      )}

      {/* TAB 2: Bulk Student Login Creation (CSV) */}
      {activeTab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <BulkStudentCreate embedded />

          {/* Class ID Reference Card with One-Click Copy */}
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, mt: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <School color="primary" /> Class ID Reference Table
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click any <strong>Class ID (_id)</strong> badge below to copy it directly to your clipboard.
            </Typography>
            <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
              <Table size="small" sx={{ minWidth: 640 }}>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Class Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Batch / Year</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Class ID (_id) — Click to Copy</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No active classes found. Please create a class first.
                      </TableCell>
                    </TableRow>
                  ) : (
                    classes.map((cls) => (
                      <TableRow key={cls._id} hover>
                        <TableCell sx={{ fontWeight: 'bold' }}>{cls.name}</TableCell>
                        <TableCell>{cls.department?.name || cls.department?.code || 'N/A'}</TableCell>
                        <TableCell>{cls.batch?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={cls._id}
                            size="small"
                            clickable
                            onClick={() => {
                              navigator.clipboard.writeText(cls._id);
                              alert(`Copied Class ID: ${cls._id}`);
                            }}
                            color="primary"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {/* TAB 3: Departments & Classes Overview */}
      {activeTab === 3 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Academic Departments ({departments.length})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Synced to Excel structure: {departments.map((d) => d.code).join(', ')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={`Classes: ${classes.length}`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
                <Chip
                  label={`Students: ${classes.reduce((sum, c) => sum + (c.studentCount || 0), 0)}`}
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
                <Chip
                  label={`Regular: ${classes.reduce((sum, c) => sum + (c.regularCount || 0), 0)}`}
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
                <Chip
                  label={`Lateral Entry: ${classes.reduce((sum, c) => sum + (c.lateralCount || 0), 0)}`}
                  color="warning"
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            </Box>

            <Grid container spacing={2}>
              {departments.map((dept) => {
                const deptClasses = classes.filter(
                  (c) => (c.department?._id || c.department) === dept._id
                );
                const totalStudents = deptClasses.reduce((sum, c) => sum + (c.studentCount || 0), 0);
                const regularStudents = deptClasses.reduce((sum, c) => sum + (c.regularCount || 0), 0);
                const lateralStudents = deptClasses.reduce((sum, c) => sum + (c.lateralCount || 0), 0);

                return (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={dept._id}>
                    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 2 }}>
                      <CardContent sx={{ pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Chip label={dept.code} size="small" color="primary" sx={{ fontWeight: 'bold' }} />
                          <Typography variant="caption" color="text.secondary">
                            {deptClasses.length} {deptClasses.length === 1 ? 'Class' : 'Classes'}
                          </Typography>
                        </Box>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          {dept.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                          <Chip label={`${totalStudents} Students`} size="small" variant="outlined" />
                          <Chip label={`${regularStudents} Reg`} size="small" color="success" variant="outlined" />
                          {lateralStudents > 0 && (
                            <Chip label={`${lateralStudents} LET`} size="small" color="warning" variant="outlined" />
                          )}
                        </Box>
                      </CardContent>
                      <Box sx={{ px: 2, pb: 2 }}>
                        <Button
                          size="small"
                          fullWidth
                          variant="text"
                          onClick={() => {
                            setDepartmentFilter(dept._id);
                            setClassFilter('');
                            setRoleFilter('');
                            setCategoryFilter('');
                            setPage(0);
                            setActiveTab(0);
                          }}
                        >
                          View Dept Accounts
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>

          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Class Roster &amp; SFA Desk Mapping ({classes.length} Classes)
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => refetchClasses()}
                disabled={isFetchingClasses}
              >
                {isFetchingClasses ? 'Refreshing...' : 'Refresh Counts'}
              </Button>
            </Box>
            <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
              <Table size="small" sx={{ minWidth: 780 }}>
                <TableHead sx={{ backgroundColor: 'primary.main' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Class</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Department</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Batch</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>SFA Desk Username</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Regular</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Lateral</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Total</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        No active classes found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    classes.map((cls) => (
                      <TableRow key={cls._id} hover>
                        <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>{cls.name}</TableCell>
                        <TableCell>
                          {cls.department?.code ? `${cls.department.code} — ${cls.department.name}` : 'N/A'}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{cls.batch?.name || 'N/A'}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {cls.sfaUsername ? (
                            <Chip
                              label={cls.sfaUsername}
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">Unassigned</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">{cls.regularCount ?? 0}</TableCell>
                        <TableCell align="right">
                          {(cls.lateralCount ?? 0) > 0 ? (
                            <Chip label={cls.lateralCount} size="small" color="warning" variant="outlined" />
                          ) : (
                            0
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {cls.studentCount ?? 0}
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ whiteSpace: 'nowrap' }}
                            onClick={() => {
                              setDepartmentFilter(cls.department?._id || '');
                              setClassFilter(cls._id);
                              setRoleFilter('');
                              setCategoryFilter('');
                              setPage(0);
                              setActiveTab(0);
                            }}
                          >
                            View Accounts
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {/* CREATE USER DIALOG */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Create User / Desk Account</DialogTitle>
        <DialogContent dividers>
          {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
          {formData.userType === 'STUDENT' && formData.category === 'LATERAL_ENTRY' && (
            <Alert severity="info" icon={<SwapHoriz />} sx={{ mb: 2 }}>
              <strong>Lateral Entry Detected:</strong> Target rules automatically set to <strong>90 Total Points</strong> &amp; <strong>30 Points per Group</strong>.
            </Alert>
          )}
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Username / Admission No."
                placeholder="e.g. JEC25EC001 or LJEC25EC063 or s3ece_sfa"
                name="username"
                value={formData.username}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Full Name / Desk Title"
                placeholder="e.g. VAISHNAV N R or S3 ECE Staff Advisor"
                name="fullName"
                value={formData.fullName}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Password (Plain Text)"
                name="password"
                value={formData.password}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>User Type</InputLabel>
                <Select
                  name="userType"
                  value={formData.userType}
                  label="User Type"
                  onChange={handleFormChange}
                >
                  <MenuItem value="STUDENT">Student</MenuItem>
                  <MenuItem value="FACULTY">Class SFA Desk</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.userType === 'FACULTY' && (
              <Grid size={12}>
                <FormControl fullWidth>
                  <InputLabel>Assign SFA Desk to Class</InputLabel>
                  <Select
                    name="classId"
                    value={formData.classId}
                    label="Assign SFA Desk to Class"
                    onChange={handleFormChange}
                  >
                    {classes.map((c) => (
                      <MenuItem key={c._id} value={c._id}>
                        {c.name} {c.batch?.name ? `(${c.batch.name})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {formData.userType === 'STUDENT' && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Class</InputLabel>
                    <Select
                      name="classId"
                      value={formData.classId}
                      label="Class"
                      onChange={handleFormChange}
                    >
                      {classes.map((c) => (
                        <MenuItem key={c._id} value={c._id}>
                          {c.name} {c.batch?.name ? `(${c.batch.name})` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={formData.category}
                      label="Category"
                      onChange={handleFormChange}
                    >
                      <MenuItem value="REGULAR">Regular (120 Pts)</MenuItem>
                      <MenuItem value="LATERAL_ENTRY">Lateral Entry (90 Pts)</MenuItem>
                      <MenuItem value="PWD">PwD (60 Pts)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Admission Date"
                    name="admissionDate"
                    type="date"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={formData.admissionDate}
                    onChange={handleFormChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      name="gender"
                      value={formData.gender}
                      label="Gender"
                      onChange={handleFormChange}
                    >
                      <MenuItem value="MALE">Male</MenuItem>
                      <MenuItem value="FEMALE">Female</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button variant="contained" disabled={isCreating} onClick={handleCreateUserSubmit}>
            {isCreating ? <CircularProgress size={24} /> : 'Save User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT USER DIALOG */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Edit Account ({editingUser?.username})
        </DialogTitle>
        <DialogContent dividers>
          {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Full Name / Desk Title"
                name="fullName"
                value={editFormData.fullName}
                onChange={handleEditFormChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={editFormData.email}
                onChange={handleEditFormChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Mobile"
                name="mobile"
                value={editFormData.mobile}
                onChange={handleEditFormChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Reset Password (optional)"
                placeholder="Leave blank to keep existing"
                name="password"
                value={editFormData.password}
                onChange={handleEditFormChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>User Type</InputLabel>
                <Select
                  name="userType"
                  value={editFormData.userType}
                  label="User Type"
                  onChange={handleEditFormChange}
                >
                  <MenuItem value="STUDENT">Student</MenuItem>
                  <MenuItem value="FACULTY">SFA Desk / Faculty</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={editFormData.status}
                  label="Status"
                  onChange={handleEditFormChange}
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="LOCKED">Locked</MenuItem>
                  <MenuItem value="GRADUATED">Graduated</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {editFormData.userType === 'STUDENT' && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Class</InputLabel>
                    <Select
                      name="classId"
                      value={editFormData.classId}
                      label="Class"
                      onChange={handleEditFormChange}
                    >
                      {classes.map((c) => (
                        <MenuItem key={c._id} value={c._id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={editFormData.category}
                      label="Category"
                      onChange={handleEditFormChange}
                    >
                      <MenuItem value="REGULAR">Regular (120 Pts)</MenuItem>
                      <MenuItem value="LATERAL_ENTRY">Lateral Entry (90 Pts)</MenuItem>
                      <MenuItem value="PWD">PwD (60 Pts)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button variant="contained" disabled={isUpdating} onClick={handleUpdateUserSubmit}>
            {isUpdating ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ASSIGN ROLE DIALOG */}
      <Dialog open={openRoleDialog} onClose={() => setOpenRoleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Assign Class SFA Desk / Admin Role</DialogTitle>
        <DialogContent dividers>
          {roleError && <Alert severity="error" sx={{ mb: 2 }}>{roleError}</Alert>}
          <Grid container spacing={2.5}>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>Select Desk / Staff Account</InputLabel>
                <Select
                  name="userId"
                  value={roleFormData.userId}
                  label="Select Desk / Staff Account"
                  onChange={(e) => setRoleFormData({ ...roleFormData, userId: e.target.value })}
                >
                  {staffUsers.length === 0 ? (
                    <MenuItem disabled value="">
                      No Staff / Desk accounts found. Create a Class SFA Desk account first.
                    </MenuItem>
                  ) : (
                    staffUsers.map((u) => (
                      <MenuItem key={u._id} value={u._id}>
                        {u.fullName} ({u.username})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={roleFormData.role}
                  label="Role"
                  onChange={(e) => {
                    const r = e.target.value;
                    const scopeType = r === 'SFA' ? 'CLASS' : r === 'HOD' ? 'DEPARTMENT' : 'INSTITUTION';
                    setRoleFormData({ ...roleFormData, role: r, scopeType, scopeId: '' });
                  }}
                >
                  <MenuItem value="SFA">SFA (Class Staff Advisor Desk)</MenuItem>
                  <MenuItem value="HOD">HOD (Head of Department)</MenuItem>
                  <MenuItem value="PRINCIPAL">Principal</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Scope Type</InputLabel>
                <Select
                  name="scopeType"
                  value={roleFormData.scopeType}
                  label="Scope Type"
                  onChange={(e) => setRoleFormData({ ...roleFormData, scopeType: e.target.value, scopeId: '' })}
                >
                  <MenuItem value="CLASS">Class (for SFA Desk)</MenuItem>
                  <MenuItem value="DEPARTMENT">Department (for HOD)</MenuItem>
                  <MenuItem value="INSTITUTION">Institution (for Principal / Admin)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {roleFormData.scopeType === 'CLASS' && (
              <Grid size={12}>
                <FormControl fullWidth>
                  <InputLabel>Target Class</InputLabel>
                  <Select
                    name="scopeId"
                    value={roleFormData.scopeId}
                    label="Target Class"
                    onChange={(e) => setRoleFormData({ ...roleFormData, scopeId: e.target.value })}
                  >
                    {classes.map((c) => (
                      <MenuItem key={c._id} value={c._id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {roleFormData.scopeType === 'DEPARTMENT' && (
              <Grid size={12}>
                <FormControl fullWidth>
                  <InputLabel>Target Department</InputLabel>
                  <Select
                    name="scopeId"
                    value={roleFormData.scopeId}
                    label="Target Department"
                    onChange={(e) => setRoleFormData({ ...roleFormData, scopeId: e.target.value })}
                  >
                    {departments.map((d) => (
                      <MenuItem key={d._id} value={d._id}>
                        {d.name} ({d.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenRoleDialog(false)}>Cancel</Button>
          <Button variant="contained" color="secondary" disabled={isAssigningRole} onClick={handleRoleAssignSubmit}>
            {isAssigningRole ? <CircularProgress size={24} /> : 'Assign Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Quick Password Reset for Any User */}
      <Dialog open={Boolean(resetTargetUser)} onClose={() => setResetTargetUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: 'primary.main' }}>
          <LockReset color="warning" />
          Reset Login Password
        </DialogTitle>
        <Box component="form" onSubmit={handleQuickResetSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {resetTargetUser && (
              <Typography variant="body2" color="text.secondary">
                Set a new password for <strong>{resetTargetUser.fullName}</strong> (<code>{resetTargetUser.username}</code>).
              </Typography>
            )}
            {resetError && <Alert severity="error">{resetError}</Alert>}
            {resetSuccess && <Alert severity="success">{resetSuccess}</Alert>}
            <PasswordTextField
              name="resetPassword"
              label="New Password"
              value={resetNewPassword}
              onChange={(e) => {
                setResetNewPassword(e.target.value);
                setResetError('');
              }}
              size="small"
              helperText="Also unlocks any temporary login lockout"
              autoComplete="new-password"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setResetTargetUser(null)}>
              {resetSuccess ? 'Close' : 'Cancel'}
            </Button>
            <Button type="submit" variant="contained" color="warning" disabled={isUpdating}>
              {isUpdating ? <CircularProgress size={20} color="inherit" /> : 'Save New Password'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default UserAdmin;
