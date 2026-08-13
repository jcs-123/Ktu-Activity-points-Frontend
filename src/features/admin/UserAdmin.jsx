import React, { useState } from 'react';
import {
  Box, Typography, Paper, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Tabs, Tab, Chip, Alert, IconButton, Grid, Avatar
} from '@mui/material';
import {
  PersonAdd, Upload, CheckCircle, Error, Group, AdminPanelSettings,
  School, ManageAccounts, Edit as EditIcon
} from '@mui/icons-material';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useBulkImportStudentsMutation,
  useGetClassesQuery
} from '../../api/adminApi';

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
    admissionDate: '2021-08-16',
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

  const [csvString, setCsvString] = useState('');
  const [csvError, setCsvError] = useState('');
  const [importResult, setImportResult] = useState(null);

  // Queries & Mutations
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery({
    limit: 50,
  });
  const { data: classesData } = useGetClassesQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [bulkImport, { isLoading: isImporting }] = useBulkImportStudentsMutation();

  const users = usersData?.data || [];
  const classes = classesData?.data || [];

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
        admissionDate: '2021-08-16',
        gender: 'MALE',
      });
    } catch (err) {
      setCreateError(err.data?.error?.message || err.data?.message || 'Failed to create user account.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvString(event.target.result);
      setCsvError('');
      setImportResult(null);
    };
    reader.onerror = () => {
      setCsvError('Failed to read CSV file.');
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async (dryRun = false) => {
    if (!csvString) {
      setCsvError('Please select a valid CSV file first.');
      return;
    }
    try {
      const res = await bulkImport({ csvData: csvString, dryRun }).unwrap();
      setImportResult(res.data);
    } catch (err) {
      setCsvError(err.data?.error?.message || 'Bulk import failed.');
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
              Create, view, and bulk import accounts for Students, SFAs, and HODs
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => setOpenCreateDialog(true)}
          sx={{ borderRadius: 3 }}
        >
          Create User
        </Button>
      </Box>

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
          <Tab icon={<Group />} iconPosition="start" label="All Accounts" />
          <Tab icon={<Upload />} iconPosition="start" label="Bulk Import CSV" />
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
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Role Type</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
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

      {/* TAB 1: Bulk CSV Upload */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <strong>CSV File Requirements:</strong> The CSV file must contain a header row with the following column names exactly:
            <br />
            <code>admissionNo, fullName, email, mobile, classId, category, admissionDate, gender</code>
          </Alert>

          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed', borderWidth: 2, borderRadius: 2 }}>
            <input
              accept=".csv"
              style={{ display: 'none' }}
              id="csv-file-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="csv-file-upload">
              <Button variant="outlined" component="span" startIcon={<Upload />} sx={{ mb: 2 }}>
                Choose CSV File
              </Button>
            </label>
            <Typography variant="body2" color="text.secondary">
              {csvString ? 'File loaded successfully.' : 'Select a CSV file containing students dataset to upload.'}
            </Typography>
          </Paper>

          {csvError && <Alert severity="error">{csvError}</Alert>}

          {csvString && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                color="secondary"
                disabled={isImporting}
                onClick={() => handleImportSubmit(true)}
              >
                Dry Run Validation
              </Button>
              <Button
                variant="contained"
                disabled={isImporting}
                onClick={() => handleImportSubmit(false)}
              >
                {isImporting ? <CircularProgress size={24} /> : 'Commit Import'}
              </Button>
            </Box>
          )}

          {importResult && (
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CheckCircle color="success" /> Import Completed Summary
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" color="success.main" fontWeight="bold">{importResult.imported}</Typography>
                    <Typography variant="caption" color="text.secondary">Successfully Seeded</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" color="error.main" fontWeight="bold">{importResult.failed.length}</Typography>
                    <Typography variant="caption" color="text.secondary">Failed Rows</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {importResult.failed.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>Failed Rows Details:</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 250 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Row</TableCell>
                          <TableCell>Admission No</TableCell>
                          <TableCell>Error Reason</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importResult.failed.map((fail, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{fail.row}</TableCell>
                            <TableCell>{fail.data?.admissionno}</TableCell>
                            <TableCell color="error">{fail.error}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Paper>
          )}
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
    </Box>
  );
};

export default UserAdmin;
