import React, { useState } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem
} from '@mui/material';
import { CalendarMonth, Lock, LockOpen, Add } from '@mui/icons-material';
import {
  useGetSemestersQuery,
  useCreateSemesterMutation,
  useGetClassesQuery
} from '../../api/adminApi';
import { useLockSemesterMutation } from '../../api/reviewApi';

const SemesterConfig = () => {
  const [openCreate, setOpenCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: 'S1',
    academicYear: '2026-2027',
    submissionOpenDate: '',
    submissionCloseDate: '',
    reviewDeadline: '',
  });

  const [lockDialog, setLockDialog] = useState(false);
  const [selectedSem, setSelectedSem] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [lockError, setLockError] = useState('');
  const [lockSuccess, setLockSuccess] = useState('');

  // Queries & Mutations
  const { data: semestersData, isLoading: isLoadingSemesters } = useGetSemestersQuery();
  const { data: classesData } = useGetClassesQuery();
  const [createSemester, { isLoading: isCreating }] = useCreateSemesterMutation();
  const [lockSemester, { isLoading: isLocking }] = useLockSemesterMutation();

  const semesters = semestersData?.data || [];
  const classes = classesData?.data || [];

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateSubmit = async () => {
    try {
      await createSemester(formData).unwrap();
      setOpenCreate(false);
      setFormData({
        name: 'S1',
        academicYear: '2026-2027',
        submissionOpenDate: '',
        submissionCloseDate: '',
        reviewDeadline: '',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLockClick = (sem) => {
    setSelectedSem(sem);
    setLockError('');
    setLockSuccess('');
    setLockDialog(true);
  };

  const handleLockConfirm = async () => {
    if (!selectedClassId) {
      setLockError('Please select a class to lock.');
      return;
    }
    setLockError('');
    setLockSuccess('');
    try {
      const res = await lockSemester({
        semesterId: selectedSem._id,
        classId: selectedClassId,
      }).unwrap();
      setLockSuccess(res.message || 'Semester successfully locked for the selected class!');
      setTimeout(() => {
        setLockDialog(false);
        setSelectedClassId('');
      }, 1500);
    } catch (err) {
      setLockError(err.data?.error?.message || 'Failed to lock semester.');
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 3, md: 4 }, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
          <CalendarMonth sx={{ fontSize: { xs: 32, sm: 40 }, color: 'primary.main', flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" fontWeight="bold">
              Semester Configuration
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Create semesters, configure deadlines, and lock class scores (snapshots)
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenCreate(true)}
          sx={{ borderRadius: 3 }}
        >
          Add Semester
        </Button>
      </Box>

      {/* Semesters list */}
      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        {isLoadingSemesters ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table sx={{ minWidth: 680 }}>
            <TableHead sx={{ backgroundColor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Semester Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Academic Year</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Open Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Close Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Review Deadline</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {semesters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    No semesters configured.
                  </TableCell>
                </TableRow>
              ) : (
                semesters.map((sem) => (
                  <TableRow key={sem._id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>{sem.name}</TableCell>
                    <TableCell>{sem.academicYear}</TableCell>
                    <TableCell>{sem.submissionOpenDate ? new Date(sem.submissionOpenDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{sem.submissionCloseDate ? new Date(sem.submissionCloseDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{sem.reviewDeadline ? new Date(sem.reviewDeadline).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        color="warning"
                        startIcon={<Lock />}
                        onClick={() => handleLockClick(sem)}
                        size="small"
                      >
                        Lock Class Score
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* CREATE SEMESTER DIALOG */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Add Academic Semester</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            fullWidth
            label="Semester Name (e.g. S5)"
            name="name"
            value={formData.name}
            onChange={handleFormChange}
          />
          <TextField
            fullWidth
            label="Academic Year (e.g. 2026-2027)"
            name="academicYear"
            value={formData.academicYear}
            onChange={handleFormChange}
          />
          <TextField
            fullWidth
            label="Submission Open Date"
            name="submissionOpenDate"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={formData.submissionOpenDate}
            onChange={handleFormChange}
          />
          <TextField
            fullWidth
            label="Submission Close Date"
            name="submissionCloseDate"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={formData.submissionCloseDate}
            onChange={handleFormChange}
          />
          <TextField
            fullWidth
            label="SFA Review Deadline"
            name="reviewDeadline"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={formData.reviewDeadline}
            onChange={handleFormChange}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button variant="contained" disabled={isCreating} onClick={handleCreateSubmit}>
            {isCreating ? <CircularProgress size={24} /> : 'Save Semester'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* LOCK CLASS DIALOG */}
      <Dialog open={lockDialog} onClose={() => setLockDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Lock color="warning" /> Lock Semester for Class
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Select a class to generate immutable score snapshots and lock submissions for <strong>{selectedSem?.name}</strong> ({selectedSem?.academicYear}).
          </Typography>

          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Target Class</InputLabel>
            <Select
              value={selectedClassId}
              label="Target Class"
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              {classes.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {lockError && <Alert severity="error" sx={{ mt: 1 }}>{lockError}</Alert>}
          {lockSuccess && <Alert severity="success" sx={{ mt: 1 }}>{lockSuccess}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setLockDialog(false)}>Cancel</Button>
          <Button variant="contained" color="warning" disabled={isLocking} onClick={handleLockConfirm}>
            {isLocking ? <CircularProgress size={24} /> : 'Confirm Lock'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SemesterConfig;
