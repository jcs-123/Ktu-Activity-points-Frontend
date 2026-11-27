import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  InputAdornment,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Assignment,
  Search,
  Download,
  Refresh,
  CalendarToday,
  Visibility,
  Close,
  CheckCircle,
  WarningAmber,
  Cancel,
  History,
  PictureAsPdf,
  Image as ImageIcon,
  InsertDriveFile,
  FilterAltOff,
  School,
  Apartment,
  Stars,
  OpenInNew,
} from '@mui/icons-material';
import { useGetAllClaimsQuery } from '../../api/adminApi';
import { useLazyGetAttachmentUrlQuery } from '../../api/claimApi';

// Clean, human-readable status configuration
const STATUS_CONFIG = {
  SUBMITTED: { label: 'Submitted', color: 'info', bgcolor: '#E0F2FE', text: '#0369A1' },
  UNDER_REVIEW: { label: 'Under Review', color: 'warning', bgcolor: '#FEF3C7', text: '#B45309' },
  APPROVED: { label: 'Approved', color: 'success', bgcolor: '#DCFCE7', text: '#15803D' },
  REJECTED: { label: 'Rejected', color: 'error', bgcolor: '#FEE2E2', text: '#B91C1C' },
  REVERTED: { label: 'Returned', color: 'secondary', bgcolor: '#F3E8FF', text: '#7E22CE' },
  DRAFT: { label: 'Draft', color: 'default', bgcolor: '#F1F5F9', text: '#475569' },
  WITHDRAWN: { label: 'Withdrawn', color: 'default', bgcolor: '#F1F5F9', text: '#475569' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const AllClaimsAdmin = () => {
  // Simple filter states
  const [department, setDepartment] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Modals
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerType, setViewerType] = useState('');
  const [viewerTitle, setViewerTitle] = useState('');

  const [triggerGetAttachmentUrl, { isLoading: isFetchingUrl }] = useLazyGetAttachmentUrlQuery();

  // Query API
  const queryParams = useMemo(() => {
    const params = {
      page: page + 1,
      limit: rowsPerPage,
      sortOrder: 'desc',
      dateField: 'submittedAt',
    };
    if (department && department !== 'ALL') params.department = department;
    if (status && status !== 'ALL') params.status = status;
    if (search.trim()) params.search = search.trim();
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return params;
  }, [page, rowsPerPage, department, status, search, startDate, endDate]);

  const { data: claimsResponse, isLoading, isFetching, refetch } = useGetAllClaimsQuery(queryParams);

  const claims = claimsResponse?.data || [];
  const pagination = claimsResponse?.pagination || { total: 0, totalPages: 1 };
  const stats = claimsResponse?.stats || {};
  const departments = claimsResponse?.departments || [];

  const pendingCount = (stats.submittedCount || 0) + (stats.underReviewCount || 0);

  // Quick preset helper
  const setQuickRange = (rangeType) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (rangeType === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (rangeType === 'TODAY') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (rangeType === '30DAYS') {
      const past = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (rangeType === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
    setPage(0);
  };

  const handleClearFilters = () => {
    setDepartment('ALL');
    setStatus('ALL');
    setSearch('');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const hasActiveFilters = department !== 'ALL' || status !== 'ALL' || search || startDate || endDate;

  // View attachment helper
  const handleViewAttachment = async (att) => {
    try {
      const res = await triggerGetAttachmentUrl(att._id).unwrap();
      const signedUrl = res?.data?.url || res?.url;
      if (!signedUrl) throw new Error('Attachment URL not found');
      setViewerUrl(signedUrl);
      setViewerType(att.mimeType || 'application/pdf');
      setViewerTitle(att.originalFilename || 'Document Preview');
      setViewerOpen(true);
    } catch (err) {
      console.error(err);
      alert('Unable to load document preview. Please try again.');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!claims || claims.length === 0) {
      alert('No claim records to export.');
      return;
    }

    const headers = [
      'Claim Ref',
      'Student Name',
      'Admission No',
      'Department',
      'Class',
      'Activity Code',
      'Activity Title',
      'Option Level',
      'Event Title',
      'Claimed Points',
      'Awarded Points',
      'Status',
      'Submitted Date',
    ];

    const rows = claims.map((c) => [
      c.claimRef || '',
      `"${(c.studentName || '').replace(/"/g, '""')}"`,
      c.admissionNo || '',
      c.departmentCode || '',
      `"${(c.className || '').replace(/"/g, '""')}"`,
      c.activityItemCode || '',
      `"${(c.activityItemTitle || '').replace(/"/g, '""')}"`,
      `"${(c.activityOptionLabel || '').replace(/"/g, '""')}"`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      c.claimedPoints || 0,
      c.awardedPoints || 0,
      c.status || '',
      c.submittedAt ? formatDate(c.submittedAt) : 'Draft',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `claims_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1500, mx: 'auto' }}>
      {/* 1. Header with Title & Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#1E293B">
            Student Claims List
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and audit all student activity point submissions across all departments.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={() => refetch()}
            disabled={isFetching}
            sx={{ textTransform: 'none', borderRadius: 1.5 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<Download />}
            onClick={handleExportCSV}
            sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 600 }}
          >
            Export to Excel / CSV
          </Button>
        </Stack>
      </Box>

      {/* 2. Clickable Status Cards (Instant 1-Click Filtering) */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* All Claims */}
        <Grid item xs={6} sm={3}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              cursor: 'pointer',
              borderWidth: status === 'ALL' ? 2 : 1,
              borderColor: status === 'ALL' ? '#1976D2' : '#E2E8F0',
              bgcolor: status === 'ALL' ? '#EFF6FF' : '#FFFFFF',
              transition: '0.2s',
              '&:hover': { borderColor: '#1976D2' },
            }}
            onClick={() => {
              setStatus('ALL');
              setPage(0);
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                ALL CLAIMS
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#1E293B">
                {stats.totalClaims || pagination.total || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Click to view all
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Review */}
        <Grid item xs={6} sm={3}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              cursor: 'pointer',
              borderWidth: status === 'SUBMITTED' ? 2 : 1,
              borderColor: status === 'SUBMITTED' ? '#D97706' : '#E2E8F0',
              bgcolor: status === 'SUBMITTED' ? '#FFFBEB' : '#FFFFFF',
              transition: '0.2s',
              '&:hover': { borderColor: '#D97706' },
            }}
            onClick={() => {
              setStatus('SUBMITTED');
              setPage(0);
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="#B45309" fontWeight={700}>
                PENDING REVIEW
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#D97706">
                {pendingCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Submitted / Under Review
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Approved */}
        <Grid item xs={6} sm={3}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              cursor: 'pointer',
              borderWidth: status === 'APPROVED' ? 2 : 1,
              borderColor: status === 'APPROVED' ? '#16A34A' : '#E2E8F0',
              bgcolor: status === 'APPROVED' ? '#F0FDF4' : '#FFFFFF',
              transition: '0.2s',
              '&:hover': { borderColor: '#16A34A' },
            }}
            onClick={() => {
              setStatus('APPROVED');
              setPage(0);
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="#15803D" fontWeight={700}>
                APPROVED
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#16A34A">
                {stats.approvedCount || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Points awarded
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Returned / Rejected */}
        <Grid item xs={6} sm={3}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              cursor: 'pointer',
              borderWidth: status === 'REVERTED' || status === 'REJECTED' ? 2 : 1,
              borderColor: status === 'REVERTED' ? '#9333EA' : '#E2E8F0',
              bgcolor: status === 'REVERTED' ? '#FAF5FF' : '#FFFFFF',
              transition: '0.2s',
              '&:hover': { borderColor: '#9333EA' },
            }}
            onClick={() => {
              setStatus(status === 'REVERTED' ? 'ALL' : 'REVERTED');
              setPage(0);
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="#7E22CE" fontWeight={700}>
                RETURNED / REJECTED
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#7E22CE">
                {(stats.revertedCount || 0) + (stats.rejectedCount || 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Needs correction or rejected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 3. Simple Search & Filter Bar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#FFFFFF' }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search by Student / Claim */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by student name, admission no, or activity..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}>
                      <Close fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Grid>

          {/* Department Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="dept-label">Department</InputLabel>
              <Select
                labelId="dept-label"
                value={department}
                label="Department"
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="ALL">All Departments</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d._id || d.code} value={d.code || d._id}>
                    {d.code} — {d.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* From Date */}
          <Grid item xs={6} sm={3} md={2}>
            <TextField
              label="From Date"
              type="date"
              size="small"
              fullWidth
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(0);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* To Date */}
          <Grid item xs={6} sm={3} md={2}>
            <TextField
              label="To Date"
              type="date"
              size="small"
              fullWidth
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(0);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Clear Filters */}
          <Grid item xs={12} md={1} sx={{ textAlign: { xs: 'left', md: 'center' } }}>
            {hasActiveFilters && (
              <Button
                color="secondary"
                size="small"
                onClick={handleClearFilters}
                startIcon={<FilterAltOff />}
                sx={{ textTransform: 'none', fontSize: '0.8rem' }}
              >
                Reset
              </Button>
            )}
          </Grid>
        </Grid>

        {/* Quick Date Shortcuts */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Date Quick Filters:
          </Typography>
          <Chip
            label="All Time"
            size="small"
            clickable
            variant={!startDate && !endDate ? 'filled' : 'outlined'}
            color={!startDate && !endDate ? 'primary' : 'default'}
            onClick={() => setQuickRange('ALL')}
            sx={{ height: 24, fontSize: '0.72rem' }}
          />
          <Chip
            label="Today"
            size="small"
            clickable
            variant={startDate === new Date().toISOString().split('T')[0] ? 'filled' : 'outlined'}
            color={startDate === new Date().toISOString().split('T')[0] ? 'primary' : 'default'}
            onClick={() => setQuickRange('TODAY')}
            sx={{ height: 24, fontSize: '0.72rem' }}
          />
          <Chip
            label="This Month"
            size="small"
            clickable
            onClick={() => setQuickRange('THIS_MONTH')}
            sx={{ height: 24, fontSize: '0.72rem' }}
          />
          <Chip
            label="Last 30 Days"
            size="small"
            clickable
            onClick={() => setQuickRange('30DAYS')}
            sx={{ height: 24, fontSize: '0.72rem' }}
          />
        </Box>
      </Paper>

      {/* 4. Claims Table (Clean, Easy to Read) */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 360px)', minHeight: 320 }}>
          <Table stickyHeader size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#F8FAFC', color: '#475569' }}>Student & Class</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#F8FAFC', color: '#475569' }}>Activity Details</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#F8FAFC', color: '#475569' }}>Submitted Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#F8FAFC', color: '#475569' }}>Points</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#F8FAFC', color: '#475569' }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#F8FAFC', color: '#475569' }}>Proof & Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={30} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Loading claims...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : claims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Assignment sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
                      No matching claims found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try clearing or changing your filters above.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                claims.map((claim) => {
                  const statusInfo = STATUS_CONFIG[claim.status] || {
                    label: claim.status,
                    bgcolor: '#F1F5F9',
                    text: '#475569',
                  };
                  const hasProof = claim.attachments && claim.attachments.length > 0;
                  const displayDate = claim.submittedAt || claim.createdAt;

                  return (
                    <TableRow key={claim._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      {/* Student & Class */}
                      <TableCell sx={{ verticalAlign: 'middle', py: 1.5 }}>
                        <Typography variant="body2" fontWeight={700} color="#0F172A">
                          {claim.studentName || 'Student'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          <strong>{claim.admissionNo || '—'}</strong> • {claim.departmentCode || 'DEPT'} • {claim.className || '—'}
                        </Typography>
                      </TableCell>

                      {/* Activity Details */}
                      <TableCell sx={{ verticalAlign: 'middle', py: 1.5, maxWidth: 350 }}>
                        <Typography variant="body2" fontWeight={600} color="#1E293B">
                          {claim.activityItemCode ? `${claim.activityItemCode} — ` : ''}{claim.activityItemTitle || claim.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                          Option: {claim.activityOptionLabel || claim.title || 'Standard'}
                        </Typography>
                      </TableCell>

                      {/* Submitted Date */}
                      <TableCell sx={{ verticalAlign: 'middle', py: 1.5 }}>
                        <Typography variant="body2" color="#334155">
                          {formatDate(displayDate)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Ref: {claim.claimRef}
                        </Typography>
                      </TableCell>

                      {/* Points */}
                      <TableCell align="center" sx={{ verticalAlign: 'middle', py: 1.5 }}>
                        <Typography variant="body2" fontWeight={800} color="#0369A1">
                          {claim.claimedPoints} pts
                        </Typography>
                        {claim.status === 'APPROVED' && (
                          <Typography variant="caption" fontWeight={700} color="#16A34A" sx={{ display: 'block' }}>
                            Awarded: {claim.awardedPoints} pts
                          </Typography>
                        )}
                      </TableCell>

                      {/* Status Chip */}
                      <TableCell align="center" sx={{ verticalAlign: 'middle', py: 1.5 }}>
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 4,
                            bgcolor: statusInfo.bgcolor,
                            color: statusInfo.text,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        >
                          {statusInfo.label}
                        </Box>
                      </TableCell>

                      {/* Proof Document & Full View */}
                      <TableCell align="center" sx={{ verticalAlign: 'middle', py: 1.5 }}>
                        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                          {hasProof ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={claim.attachments[0].mimeType?.includes('pdf') ? <PictureAsPdf /> : <ImageIcon />}
                              onClick={() => handleViewAttachment(claim.attachments[0])}
                              sx={{ textTransform: 'none', py: 0.25, px: 1, fontSize: '0.75rem', borderRadius: 1.5 }}
                            >
                              Proof
                            </Button>
                          ) : (
                            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                              No proof
                            </Typography>
                          )}

                          <IconButton
                            size="small"
                            color="info"
                            title="View Full Claim Info"
                            onClick={() => setSelectedClaim(claim)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={pagination.total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* 5. Claim Details Modal (Clean & Easy to Understand) */}
      <Dialog
        open={Boolean(selectedClaim)}
        onClose={() => setSelectedClaim(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Claim Details: {selectedClaim?.claimRef}
          </Typography>
          <IconButton onClick={() => setSelectedClaim(null)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {selectedClaim && (
            <Stack spacing={2.5}>
              {/* Student Summary */}
              <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  STUDENT
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} color="#0F172A">
                  {selectedClaim.studentName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Admission No: <strong>{selectedClaim.admissionNo}</strong>
                  {selectedClaim.ktuRegisterNo && ` • KTU Reg: ${selectedClaim.ktuRegisterNo}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Department: <strong>{selectedClaim.departmentCode}</strong> • Class: <strong>{selectedClaim.className}</strong>
                </Typography>
              </Box>

              {/* Activity Info */}
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  ACTIVITY
                </Typography>
                <Typography variant="body1" fontWeight={700} color="#1E293B">
                  {selectedClaim.activityItemCode} — {selectedClaim.activityItemTitle || selectedClaim.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Option: {selectedClaim.activityOptionLabel || '—'}
                </Typography>
                {selectedClaim.title && selectedClaim.title !== selectedClaim.activityItemTitle && (
                  <Typography variant="body2" color="primary.main" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                    "{selectedClaim.title}"
                  </Typography>
                )}
              </Box>

              <Divider />

              {/* Points & Status */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Claimed Points:</Typography>
                  <Typography variant="h6" fontWeight={800} color="#0284C7">
                    {selectedClaim.claimedPoints} Points
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Status:</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={selectedClaim.status}
                      size="small"
                      color={STATUS_CONFIG[selectedClaim.status]?.color || 'default'}
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>
                </Grid>
              </Grid>

              {/* Review Remarks if any */}
              {selectedClaim.reviewRemarks && (
                <Box sx={{ p: 1.5, bgcolor: '#FEF9C3', borderRadius: 1.5, border: '1px solid #FEF08A' }}>
                  <Typography variant="caption" fontWeight={700} color="#854D0E">
                    Staff Review Remarks:
                  </Typography>
                  <Typography variant="body2" color="#713F12">
                    {selectedClaim.reviewRemarks}
                  </Typography>
                </Box>
              )}

              {/* Proof Attachment */}
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  ATTACHED PROOF CERTIFICATES
                </Typography>
                {selectedClaim.attachments && selectedClaim.attachments.length > 0 ? (
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {selectedClaim.attachments.map((att) => (
                      <Paper
                        key={att._id}
                        variant="outlined"
                        sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 1.5 }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {att.mimeType?.includes('pdf') ? (
                            <PictureAsPdf color="error" fontSize="small" />
                          ) : (
                            <ImageIcon color="primary" fontSize="small" />
                          )}
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 260 }}>
                            {att.originalFilename}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleViewAttachment(att)}
                        >
                          View
                        </Button>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    No proof certificate attached to this claim.
                  </Typography>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 1.5 }}>
          <Button onClick={() => setSelectedClaim(null)} variant="contained" fullWidth size="small">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* 6. Proof Preview Dialog */}
      <Dialog
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ maxWidth: '80%' }}>
            {viewerTitle}
          </Typography>
          <IconButton onClick={() => setViewerOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, height: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#0F172A' }}>
          {viewerUrl && viewerType.includes('pdf') ? (
            <iframe
              src={viewerUrl}
              title={viewerTitle}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          ) : viewerUrl ? (
            <img
              src={viewerUrl}
              alt={viewerTitle}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          ) : (
            <CircularProgress />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 1 }}>
          {viewerUrl && (
            <Button
              size="small"
              component="a"
              href={viewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<OpenInNew />}
            >
              Open in New Window
            </Button>
          )}
          <Button onClick={() => setViewerOpen(false)} size="small" variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AllClaimsAdmin;
