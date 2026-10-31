import React, { useState } from 'react';
import {
  Box, Typography, Paper, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Tabs, Tab, Chip, Alert, IconButton, Grid, Avatar
} from '@mui/material';
import {
  PersonAdd, Upload, Group,
  School, ManageAccounts, Edit as EditIcon, Badge as BadgeIcon, Add as AddIcon
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

const UserAdmin = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [createError, setCreateError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mobile: '',
    password: '',
    fullName: '',
    userType: 'STUDENT',
    classId: '',
    category: 'REGULAR',
    admissionDate: '2025-08-01',
    gender: 'MALE',
  });

  // Edit User State
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editError, setEditError] = useState('');
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    userType: 'STUDENT',
    status: 'ACTIVE',
    category: 'REGULAR',
    classId: '',
  });

  // Role Assignment State (Assign SFA / HOD)
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
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery(
    { limit: 200 },
    { skip: activeTab === 2 }
  );
  const { data: classesData } = useGetClassesQuery();
  const { data: departmentsData } = useGetDepartmentsQuery(undefined, {
    skip: activeTab !== 1,
  });
  const { data: roleAssignmentsData, isLoading: isLoadingRoles } = useGetRoleAssignmentsQuery(
    undefined,
    { skip: activeTab !== 1 }
  );

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [createRoleAssignment, { isLoading: isAssigningRole }] = useCreateRoleAssignmentMutation();

  const users = usersData?.data || [];
  const classes = classesData?.data || [];
  const departments = departmentsData?.data || [];
  const roleAssignments = roleAssignmentsData?.data || [];

  const filteredRoleAssignments = roleAssignments.filter(assignment => {
    if (!selectedRoleDeptFilter) return true;
    return (assignment.departmentName || '').toLowerCase().includes(selectedRoleDeptFilter.toLowerCase());
  });

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
      await updateUser({
        id: editingUser._id,
        ...editFormData,
      }).unwrap();
      setOpenEditDialog(false);
      setEditingUser(null);
    } catch (err) {
      setEditError(err.data?.error?.message || err.data?.message || 'Failed to update user account.');
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    try {
      await createUser(formData).unwrap();
      setOpenCreateDialog(false);
      // Reset form
      setFormData({
        username: '',
        email: '',
        mobile: '',
        password: '',
        fullName: '',
        userType: 'STUDENT',
        classId: '',
        category: 'REGULAR',
        admissionDate: '2025-08-01',
        gender: 'MALE',
      });
    } catch (err) {
      setCreateError(err.data?.error?.message || err.data?.message || 'Failed to create user account.');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ManageAccounts sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              User Management
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Create, view, and bulk import student logins, SFAs, and HODs
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

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
          <Tab icon={<Group />} iconPosition="start" label="All Accounts" />
          <Tab icon={<BadgeIcon />} iconPosition="start" label="Assign SFA / HOD Roles" />
          <Tab icon={<Upload />} iconPosition="start" label="Bulk Student Login Creation (CSV)" />
        </Tabs>
      </Paper>

      {/* TAB 0: All Accounts list */}
      {activeTab === 0 && (
        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflowX: 'auto', width: '100%' }}>
          {isLoadingUsers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ backgroundColor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Username / ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Mobile</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Role Type</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      No user accounts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user._id} hover>
                      <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32, fontSize: 14 }}>
                          {user.fullName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">{user.fullName}</Typography>
                          {user.userType === 'STUDENT' && user.studentProfile?.category && (
                            <Chip
                              label={user.studentProfile.category}
                              size="small"
                              variant="outlined"
                              color={user.studentProfile.category === 'LATERAL_ENTRY' ? 'secondary' : 'default'}
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.mobile || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.userType}
                          size="small"
                          color={user.userType === 'ADMIN' ? 'error' : user.userType === 'FACULTY' ? 'secondary' : 'default'}
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
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenEdit(user)}
                          title="Edit User"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      )}

      {/* TAB 1: Role Assignments (Assign SFA / HOD) */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Active Role Assignments (SFA, HOD, Principal)
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 220 }}>
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
                Assign Role to Faculty
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
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Faculty Member</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Assigned Role</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Department</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Scope Type</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Target Class / Scope</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Assigned Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRoleAssignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        No SFA or HOD role assignments configured for this selection.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRoleAssignments.map((assignment) => (
                      <TableRow key={assignment._id} hover>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          {assignment.user?.fullName || 'User'} ({assignment.user?.username})
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={assignment.role}
                            size="small"
                            color={assignment.role === 'SFA' ? 'primary' : assignment.role === 'HOD' ? 'secondary' : 'default'}
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {assignment.departmentName || 'All Departments'}
                        </TableCell>
                        <TableCell>{assignment.scopeType}</TableCell>
                        <TableCell>
                          {assignment.targetName || assignment.scopeId?.name || assignment.scopeId?.code || 'Institution-wide'}
                        </TableCell>
                        <TableCell>
                          {new Date(assignment.validFrom || assignment.createdAt).toLocaleDateString()}
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
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mt: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <School color="primary" /> Class ID Reference Table
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click any <strong>Class ID (_id)</strong> badge below to copy it directly to your clipboard.
            </Typography>
            <TableContainer>
              <Table size="small">
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

      {/* CREATE USER DIALOG */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Create User Account</DialogTitle>
        <DialogContent dividers>
          {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username / ID"
                name="username"
                value={formData.username}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Default Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>User Type</InputLabel>
                <Select
                  name="userType"
                  value={formData.userType}
                  label="User Type"
                  onChange={handleFormChange}
                >
                  <MenuItem value="STUDENT">Student</MenuItem>
                  <MenuItem value="FACULTY">Faculty</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.userType === 'STUDENT' && (
              <>
                <Grid item xs={12} sm={6}>
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
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={formData.category}
                      label="Category"
                      onChange={handleFormChange}
                    >
                      <MenuItem value="REGULAR">Regular</MenuItem>
                      <MenuItem value="LATERAL_ENTRY">Lateral Entry</MenuItem>
                      <MenuItem value="PWD">PwD</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Admission Date"
                    name="admissionDate"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={formData.admissionDate}
                    onChange={handleFormChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
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
          Edit User Account ({editingUser?.username})
        </DialogTitle>
        <DialogContent dividers>
          {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={editFormData.fullName}
                onChange={handleEditFormChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={editFormData.email}
                onChange={handleEditFormChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mobile"
                name="mobile"
                value={editFormData.mobile}
                onChange={handleEditFormChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>User Type</InputLabel>
                <Select
                  name="userType"
                  value={editFormData.userType}
                  label="User Type"
                  onChange={handleEditFormChange}
                >
                  <MenuItem value="STUDENT">Student</MenuItem>
                  <MenuItem value="FACULTY">Faculty</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
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
                  <MenuItem value="SUSPENDED">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {editFormData.userType === 'STUDENT' && (
              <>
                <Grid item xs={12} sm={6}>
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
                <Grid item xs={12} sm={6}>
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
        <DialogTitle sx={{ fontWeight: 'bold' }}>Assign Role (SFA / HOD / Principal)</DialogTitle>
        <DialogContent dividers>
          {roleError && <Alert severity="error" sx={{ mb: 2 }}>{roleError}</Alert>}
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Faculty Member</InputLabel>
                <Select
                  name="userId"
                  value={roleFormData.userId}
                  label="Select Faculty Member"
                  onChange={(e) => setRoleFormData({ ...roleFormData, userId: e.target.value })}
                >
                  {users.filter((u) => u.userType !== 'STUDENT').length === 0 ? (
                    <MenuItem disabled value="">
                      No Faculty accounts found. Please create a Faculty user account first.
                    </MenuItem>
                  ) : (
                    users
                      .filter((u) => u.userType !== 'STUDENT')
                      .map((u) => (
                        <MenuItem key={u._id} value={u._id}>
                          {u.fullName} ({u.username} • {u.userType})
                        </MenuItem>
                      ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
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
                  <MenuItem value="SFA">SFA (Senior Faculty Advisor)</MenuItem>
                  <MenuItem value="HOD">HOD (Head of Department)</MenuItem>
                  <MenuItem value="PRINCIPAL">Principal</MenuItem>
                  <MenuItem value="FACULTY">Faculty</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Scope Type</InputLabel>
                <Select
                  name="scopeType"
                  value={roleFormData.scopeType}
                  label="Scope Type"
                  onChange={(e) => setRoleFormData({ ...roleFormData, scopeType: e.target.value, scopeId: '' })}
                >
                  <MenuItem value="CLASS">Class (for SFA)</MenuItem>
                  <MenuItem value="DEPARTMENT">Department (for HOD)</MenuItem>
                  <MenuItem value="INSTITUTION">Institution (for Principal)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {roleFormData.scopeType === 'CLASS' && (
              <Grid item xs={12}>
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
              <Grid item xs={12}>
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
    </Box>
  );
};

export default UserAdmin;
