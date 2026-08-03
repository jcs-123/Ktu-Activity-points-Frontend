import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Chip,
  CircularProgress, Alert, Grid, Card, CardContent, TextField, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { Print, Download, ArrowBack, VerifiedUser, Error, School } from '@mui/icons-material';
import { useGetClassConsolidatedReportQuery } from '../../api/reportApi';

const ClassReport = () => {
  const { id: classId } = useParams();
  const navigate = useNavigate();
  const [filterEligibility, setFilterEligibility] = useState('ALL');

  const { data: reportData, isLoading, isError } = useGetClassConsolidatedReportQuery(classId, {
    skip: !classId,
  });

  const meta = reportData?.meta || {};
  const rows = reportData?.data || [];

  const filteredRows = rows.filter((row) => {
    if (filterEligibility === 'ELIGIBLE') return row.isEligible;
    if (filterEligibility === 'NOT_ELIGIBLE') return !row.isEligible;
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (rows.length === 0) return;

    const headers = ['Admission No', 'Name', 'Category', 'Status', 'Group I Points', 'Group II Points', 'Group III Points', 'Total Points', 'Credits Earned', 'Eligible for Degree', 'Pending Claims'];
    const csvRows = [headers.join(',')];

    rows.forEach((row) => {
      csvRows.push([
        `"${row.admissionNo}"`,
        `"${row.name}"`,
        `"${row.category}"`,
        `"${row.status}"`,
        row.group1Points,
        row.group2Points,
        row.group3Points,
        row.totalPoints,
        row.creditsEarned,
        row.isEligible ? 'YES' : 'NO',
        row.pendingCount,
      ].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Class_Report_${meta.class?.name || 'Consolidated'}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Failed to load class consolidated report.</Alert>
      </Box>
    );
  }

  const handleExportAuditPack = () => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const downloadUrl = `${API_BASE}/reports/audit-pack${classId ? `?classId=${classId}` : ''}`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, margin: '0 auto' }}>
      {/* Action Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2, '@media print': { display: 'none' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>Back</Button>
          <Typography variant="h5" fontWeight={700} color="#1F3864">
            Class Consolidated Activity Report
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<Download />} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button variant="outlined" color="secondary" startIcon={<Download />} onClick={handleExportAuditPack}>
            Audit Pack ZIP
          </Button>
          <Button variant="contained" startIcon={<Print />} onClick={handlePrint}>
            Print Report
          </Button>
        </Box>
      </Box>

      {/* Main Printable Document Card */}
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        {/* Title Block */}
        <Box sx={{ textAlign: 'center', mb: 4, pb: 2, borderBottom: '2px solid #1976d2' }}>
          <Typography variant="h5" fontWeight="bold" color="primary">
            JYOTHI ENGINEERING COLLEGE, CHERUTHURUTHY
          </Typography>
          <Typography variant="subtitle1" fontWeight="medium">
            CLASS CONSOLIDATED ACTIVITY POINTS REPORT — {meta.class?.name || 'Class Summary'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Department: {meta.class?.department?.name || 'N/A'} • Batch: {meta.class?.batch?.name || 'N/A'} • Generated: {new Date().toLocaleDateString()}
          </Typography>
        </Box>

        {/* Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4, '@media print': { display: 'none' } }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#F0F4F8' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Total Class Strength</Typography>
                <Typography variant="h4" fontWeight={700}>{meta.totalStudents || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#ECFDF5' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Eligible Students</Typography>
                <Typography variant="h4" fontWeight={700} color="success.main">{meta.eligibleStudents || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#FEF2F2' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Deficient / Ineligible</Typography>
                <Typography variant="h4" fontWeight={700} color="error.main">{(meta.totalStudents || 0) - (meta.eligibleStudents || 0)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', '@media print': { display: 'none' } }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter Eligibility</InputLabel>
            <Select
              value={filterEligibility}
              label="Filter Eligibility"
              onChange={(e) => setFilterEligibility(e.target.value)}
            >
              <MenuItem value="ALL">All Students</MenuItem>
              <MenuItem value="ELIGIBLE">Eligible Only</MenuItem>
              <MenuItem value="NOT_ELIGIBLE">Deficient / Not Eligible</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Roster Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
              <TableRow>
                <TableCell fontWeight={700}>#</TableCell>
                <TableCell fontWeight={700}>Admission No</TableCell>
                <TableCell fontWeight={700}>Student Name</TableCell>
                <TableCell fontWeight={700}>Category</TableCell>
                <TableCell align="center" fontWeight={700}>Grp I</TableCell>
                <TableCell align="center" fontWeight={700}>Grp II</TableCell>
                <TableCell align="center" fontWeight={700}>Grp III</TableCell>
                <TableCell align="center" fontWeight={700}>Total Pts</TableCell>
                <TableCell align="center" fontWeight={700}>Credits</TableCell>
                <TableCell align="center" fontWeight={700}>Eligibility</TableCell>
                <TableCell align="center" fontWeight={700} sx={{ '@media print': { display: 'none' } }}>Pending</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No student records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row, index) => (
                  <TableRow key={row.studentId} hover>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{index + 1}</TableCell>
                    <TableCell fontWeight={600}>{row.admissionNo}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{row.category}</TableCell>
                    <TableCell align="center">{row.group1Points}</TableCell>
                    <TableCell align="center">{row.group2Points}</TableCell>
                    <TableCell align="center">{row.group3Points}</TableCell>
                    <TableCell align="center" fontWeight={700}>{row.totalPoints}</TableCell>
                    <TableCell align="center">{row.creditsEarned} / 3</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={row.isEligible ? 'Eligible' : 'Not Eligible'}
                        size="small"
                        color={row.isEligible ? 'success' : 'warning'}
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ '@media print': { display: 'none' } }}>
                      {row.pendingCount > 0 ? (
                        <Chip label={row.pendingCount} size="small" color="info" />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Signature Block */}
        <Box sx={{ mt: 8, pt: 4, borderTop: '1px dashed #ccc', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
          <Box sx={{ textAlign: 'center', minWidth: 200 }}>
            <Typography variant="body2" sx={{ mb: 6 }}>___________________________________</Typography>
            <Typography variant="body2" fontWeight="bold">Senior Faculty Advisor (SFA)</Typography>
            <Typography variant="caption" color="text.secondary">Seal & Signature</Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: 200 }}>
            <Typography variant="body2" sx={{ mb: 6 }}>___________________________________</Typography>
            <Typography variant="body2" fontWeight="bold">Head of Department (HOD)</Typography>
            <Typography variant="caption" color="text.secondary">Approval & Date</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ClassReport;
