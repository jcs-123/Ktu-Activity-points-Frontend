import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, CircularProgress,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Alert, Button,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Warning, Download as DownloadIcon, Print as PrintIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useGetClassDeficiencyQuery } from '../../api/reportApi';
import { useGetClassesQuery } from '../../api/adminApi';
import { selectCurrentUser, selectUserRoles } from '../auth/authSlice';

const DeficiencyReport = () => {
  const user = useSelector(selectCurrentUser);
  const roles = useSelector(selectUserRoles) || [];
  const roleAssignments = useSelector((state) => state.auth.roleAssignments) || [];

  const isStaff = roles.some(r => ['SFA', 'FACULTY', 'HOD', 'ADMIN', 'PRINCIPAL'].includes(r))
    || ['FACULTY', 'ADMIN'].includes(user?.userType);

  const [selectedClassId, setSelectedClassId] = useState('');

  const { data: classesData, isLoading: isLoadingClasses } = useGetClassesQuery(undefined, { skip: !isStaff });
  const classesList = classesData?.data || [];

  // Automatically select the user's assigned class, or default to the first class in the list
  useEffect(() => {
    if (classesList.length > 0) {
      if (!selectedClassId) {
        const classAssignment = roleAssignments.find(r => (r.scopeType === 'CLASS' || r.role === 'SFA') && r.scopeId);
        const assignedClassId = classAssignment?.scopeId?._id || classAssignment?.scopeId;
        const matched = classesList.find(c => c._id?.toString() === assignedClassId?.toString());
        if (matched) {
          setSelectedClassId(matched._id);
        } else {
          setSelectedClassId(classesList[0]._id);
        }
      }
    }
  }, [classesList, roleAssignments, selectedClassId]);

  const effectiveClassId = selectedClassId || (classesList.length > 0 ? classesList[0]._id : null);

  const { data, isLoading, isError, refetch } = useGetClassDeficiencyQuery(effectiveClassId, {
    skip: !effectiveClassId || !isStaff
  });

  const meta = data?.meta || {};
  const report = data?.data || [];
  const selectedClassObj = classesList.find(c => c._id === effectiveClassId);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!report || report.length === 0) return;

    const headers = ['Student Name', 'Admission No', 'Category', 'Group I Pts', 'Group II Pts', 'Group III Pts', 'Target Points', 'Earned Points', 'Deficit', 'Status'];
    const rows = report.map(s => [
      `"${s.name}"`,
      `"${s.admissionNo}"`,
      s.category || 'REGULAR',
      s.group1Points || 0,
      s.group2Points || 0,
      s.group3Points || 0,
      s.requiredPoints,
      s.totalPoints,
      s.deficit || 0,
      s.isDeficient ? 'DEFICIENT' : 'CLEARED'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Deficiency_Report_${meta?.className || selectedClassObj?.name || 'Class'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isStaff) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="info">Deficiency reports are only available to SFA, Faculty, HOD, or Admin users.</Alert>
      </Box>
    );
  }

  if (isLoadingClasses) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!effectiveClassId && classesList.length === 0) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">
          No class records found in the database. Please create a class in Administration &gt; Classes.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header and Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2, '@media print': { display: 'none' } }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="error.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning fontSize="large" /> Class Deficiency Report
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Class: {meta.className || selectedClassObj?.name || 'Selected Class'}{meta.departmentName ? ` (${meta.departmentName})` : selectedClassObj?.department?.code ? ` (${selectedClassObj.department.code})` : ''} • Students falling below the mandatory minimum point requirements (BR-01).
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {classesList.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Select Class</InputLabel>
              <Select
                value={effectiveClassId || ''}
                label="Select Class"
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                {classesList.map((cls) => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.name} ({cls.department?.code || cls.department?.name || ''})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            disabled={!report || report.length === 0}
          >
            Export CSV
          </Button>

          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={!data?.data}
          >
            Print Report
          </Button>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Box sx={{ p: 4 }}>
          <Alert 
            severity="error"
            action={
              <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={() => refetch()}>
                Retry
              </Button>
            }
          >
            Failed to load Deficiency Report for the selected class.
          </Alert>
        </Box>
      ) : (
        <>
          {meta.deficientStudents > 0 ? (
            <Alert severity="error" sx={{ mb: 4 }}>
              <strong>Attention required:</strong> {meta.deficientStudents} student(s) in this class have not met their target Activity Points threshold.
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mb: 4 }}>
              All students in this class have met their required target Activity Points!
            </Alert>
          )}

          {/* Printable Report Table */}
          <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflowX: 'auto', width: '100%' }}>
            <Table sx={{ minWidth: 720 }}>
              <TableHead sx={{ backgroundColor: 'error.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Student Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Admission No</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Category</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Grp I</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Grp II</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Grp III</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Target</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Earned</TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                      No students found in this class.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.map((student) => (
                    <TableRow key={student.id} hover sx={{ bgcolor: student.isDeficient ? 'error.50' : 'inherit' }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{student.name}</Typography>
                      </TableCell>
                      <TableCell>{student.admissionNo}</TableCell>
                      <TableCell>{student.category || 'REGULAR'}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={student.group1Points || 0}
                          size="small"
                          variant="outlined"
                          color={student.group1Points >= (student.requiredPerGroup || 40) ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={student.group2Points || 0}
                          size="small"
                          variant="outlined"
                          color={student.group2Points >= (student.requiredPerGroup || 40) ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={student.group3Points || 0}
                          size="small"
                          variant="outlined"
                          color={student.group3Points >= (student.requiredPerGroup || 40) ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell align="center">{student.requiredPoints}</TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="h6"
                          color={student.isDeficient ? 'error.main' : 'success.main'}
                          fontWeight="bold"
                        >
                          {student.totalPoints}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {student.isDeficient ? (
                          <Chip label={`Deficit: ${student.deficit} pts`} color="error" size="small" sx={{ fontWeight: 'bold' }} />
                        ) : (
                          <Chip label="Cleared" color="success" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* SFA Signature Footer for Printed Deficiency Reports */}
          <Box sx={{ mt: 8, pt: 4, display: 'none', '@media print': { display: 'flex' }, justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 4 }}>________________________</Typography>
              <Typography variant="body2" fontWeight="bold">SFA Signature & Date</Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 4 }}>________________________</Typography>
              <Typography variant="body2" fontWeight="bold">HOD Verification & Seal</Typography>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default DeficiencyReport;
