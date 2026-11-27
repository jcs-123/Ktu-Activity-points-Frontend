import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
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
  Alert,
  Stack,
} from '@mui/material';
import {
  Assignment,
  Search,
  FilterList,
  Download,
  Refresh,
  CalendarToday,
  School,
  Visibility,
  Close,
  CheckCircle,
  WarningAmber,
  Cancel,
  History,
  InsertDriveFile,
  PictureAsPdf,
  Image as ImageIcon,
  ArrowDownward,
  ArrowUpward,
  Category,
  Stars,
  Person,
} from '@mui/icons-material';
import { useGetAllClaimsQuery } from '../../api/adminApi';
import { useLazyGetAttachmentUrlQuery } from '../../api/claimApi';

const STATUS_CONFIG = {
  SUBMITTED: { label: 'Submitted', color: 'info', icon: <WarningAmber fontSize="inherit" /> },
  UNDER_REVIEW: { label: 'Under Review', color: 'warning', icon: <History fontSize="inherit" /> },
  APPROVED: { label: 'Approved', color: 'success', icon: <CheckCircle fontSize="inherit" /> },
  REJECTED: { label: 'Rejected', color: 'error', icon: <Cancel fontSize="inherit" /> },
  REVERTED: { label: 'Returned', color: 'secondary', icon: <History fontSize="inherit" /> },
  DRAFT: { label: 'Draft', color: 'default', icon: null },
  WITHDRAWN: { label: 'Withdrawn', color: 'default', icon: null },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const AllClaimsAdmin = () => {
  // Filter states
  const [department, setDepartment] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateField, setDateField] = useState('submittedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Modal states
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
      sortOrder,
      dateField,
    };
    if (department && department !== 'ALL') params.department = department;
    if (status && status !== 'ALL') params.status = status;
    if (search.trim()) params.search = search.trim();
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return params;
  }, [page, rowsPerPage, sortOrder, dateField, department, status, search, startDate, endDate]);

  const { data: claimsResponse, isLoading, isFetching, refetch } = useGetAllClaimsQuery(queryParams);

  const claims = claimsResponse?.data || [];
  const pagination = claimsResponse?.pagination || { total: 0, totalPages: 1 };
  const stats = claimsResponse?.stats || {};
  const departments = claimsResponse?.departments || [];

  // Quick Date Range Presets
  const applyDatePreset = (preset) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'TODAY') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7DAYS') {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === '30DAYS') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'ACADEMIC_YEAR') {
      const currentYear = now.getFullYear();
      const isPastJuly = now.getMonth() >= 6;
      const startYear = isPastJuly ? currentYear : currentYear - 1;
      setStartDate(`${startYear}-07-01`);
      setEndDate(todayStr);
    }
    setPage(0);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setDepartment('ALL');
    setStatus('ALL');
    setSearch('');
    setStartDate('');
    setEndDate('');
    setDateField('submittedAt');
    setSortOrder('desc');
    setPage(0);
  };

  // Open Proof Attachment Preview
  const handleViewAttachment = async (att) => {
    try {
      const res = await triggerGetAttachmentUrl(att._id).unwrap();
      const signedUrl = res?.data?.url || res?.url;
      if (!signedUrl) throw new Error('Attachment URL not returned.');
      setViewerUrl(signedUrl);
      setViewerType(att.mimeType || 'application/pdf');
      setViewerTitle(att.originalFilename || 'Document Preview');
      setViewerOpen(true);
    } catch (err) {
      console.error('Error fetching attachment URL:', err);
      alert('Failed to load attachment. Please try again.');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!claims || claims.length === 0) {
      alert('No claim records to export with current filters.');
      return;
    }

    const headers = [
      'Claim Ref',
      'Student Name',
      'Admission No',
      'KTU Reg No',
      'Department',
      'Class',
      'Group',
      'Item Code',
      'Item Title',
      'Option Label',
      'Event / Activity Title',
      'Claimed Points',
      'Awarded Points',
      'Status',
      'Submitted At',
      'Reviewed At',
    ];

    const rows = claims.map((c) => [
      c.claimRef || '',
      `"${(c.studentName || '').replace(/"/g, '""')}"`,
      c.admissionNo || '',
      c.ktuRegisterNo || '',
      c.departmentCode || '',
      `"${(c.className || '').replace(/"/g, '""')}"`,
      c.activityGroupCode || '',
      c.activityItemCode || '',
      `"${(c.activityItemTitle || '').replace(/"/g, '""')}"`,
      `"${(c.activityOptionLabel || '').replace(/"/g, '""')}"`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      c.claimedPoints || 0,
      c.awardedPoints || 0,
      c.status || '',
      c.submittedAt ? formatDateTime(c.submittedAt) : '',
      c.reviewedAt ? formatDateTime(c.reviewedAt) : '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `all_submitted_claims_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 }, maxWidth: 1600, mx: 'auto' }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Assignment color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" fontWeight={700} color="#1F3864">
              All Submitted Claims
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Master audit list of student activity point claims sorted across date ranges and departments.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refetch()}
            disabled={isFetching}
            size="small"
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Download />}
            onClick={handleExportCSV}
            size="small"
            sx={{ fontWeight: 600 }}
          >
            Export to CSV
          </Button>
        </Stack>
      </Box>

      {/* Metric Cards Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#F8FAFC', borderLeft: '4px solid #1976D2' }}>
            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                TOTAL CLAIMS
              </Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                {stats.totalClaims || pagination.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2.4}>
          <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#F8FAFC', borderLeft: '4px solid #0288D1' }}>
            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                SUBMITTED / PENDING
              </Typography>
              <Typography variant="h5" fontWeight={700} color="#0288D1">
                {stats.submittedCount || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2.4}>
          <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#F8FAFC', borderLeft: '4px solid #ED6C02' }}>
            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                UNDER REVIEW
              </Typography>
              <Typography variant="h5" fontWeight={700} color="warning.main">
                {stats.underReviewCount || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2.4}>
          <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#F8FAFC', borderLeft: '4px solid #2E7D32' }}>
            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                APPROVED
              </Typography>
              <Typography variant="h5" fontWeight={700} color="success.main">
                {stats.approvedCount || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4} md={2.4}>
          <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#F8FAFC', borderLeft: '4px solid #9C27B0' }}>
            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                CLAIMED / AWARDED PTS
              </Typography>
              <Typography variant="h6" fontWeight={700} color="#7B1FA2">
                {stats.totalClaimedPoints || 0} / {stats.totalAwardedPoints || 0} pts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Comprehensive Filter Controls */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2, bgcolor: '#FFFFFF' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterList fontSize="small" color="primary" />
          <Typography variant="subtitle2" fontWeight={700}>
            Filter & Search Claims
          </Typography>
        </Box>

        {/* Date Preset Quick Pills */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mr: 0.5 }}>
            Date Presets:
          </Typography>
          {[
            { label: 'All Time', key: 'ALL' },
            { label: 'Today', key: 'TODAY' },
            { label: 'Last 7 Days', key: '7DAYS' },
            { label: 'Last 30 Days', key: '30DAYS' },
            { label: 'This Month', key: 'THIS_MONTH' },
            { label: 'Current Academic Year', key: 'ACADEMIC_YEAR' },
          ].map((preset) => {
            const isActive =
              (preset.key === 'ALL' && !startDate && !endDate) ||
              (preset.key === 'TODAY' && startDate === new Date().toISOString().split('T')[0] && endDate === startDate);
            return (
              <Chip
                key={preset.key}
                label={preset.label}
                size="small"
                variant={isActive ? 'filled' : 'outlined'}
                color={isActive ? 'primary' : 'default'}
                onClick={() => applyDatePreset(preset.key)}
                sx={{ cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
              />
            );
          })}
        </Box>

        {/* Filter Inputs Grid */}
        <Grid container spacing={2} alignItems="center">
          {/* Department Filter */}
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel id="dept-filter-label">Department</InputLabel>
              <Select
                labelId="dept-filter-label"
                value={department}
                label="Department"
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="ALL">
                  <em>All Departments</em>
                </MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept._id || dept.code} value={dept.code || dept._id}>
                    {dept.code} — {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status Filter */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={status}
                label="Status"
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="SUBMITTED">Submitted</MenuItem>
                <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
                <MenuItem value="REVERTED">Returned</MenuItem>
                <MenuItem value="DRAFT">Draft</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Date From */}
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

          {/* Date To */}
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

          {/* Date Field Target */}
          <Grid item xs={6} sm={3} md={1.5}>
            <FormControl fullWidth size="small">
              <InputLabel id="date-field-label">Date Basis</InputLabel>
              <Select
                labelId="date-field-label"
                value={dateField}
                label="Date Basis"
                onChange={(e) => setDateField(e.target.value)}
              >
                <MenuItem value="submittedAt">Submitted Date</MenuItem>
                <MenuItem value="createdAt">Created Date</MenuItem>
                <MenuItem value="activityDateFrom">Activity Date</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Sort Order Toggle */}
          <Grid item xs={6} sm={3} md={2}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={sortOrder === 'desc' ? <ArrowDownward /> : <ArrowUpward />}
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              sx={{ height: 40 }}
            >
              {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            </Button>
          </Grid>

          {/* Search Query */}
          <Grid item xs={12} md={10}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by student name, admission no, KTU reg no, claim ref (AP-...), or activity title..."
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

          {/* Reset Filters */}
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="text"
              color="inherit"
              size="small"
              onClick={handleClearFilters}
              sx={{ height: 40 }}
            >
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Claims Data Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 380px)', minHeight: 350 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#F1F5F9' }}>Claim Ref & Date</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#F1F5F9' }}>Student Information</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#F1F5F9' }}>Dept & Class</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#F1F5F9' }}>Activity & Details</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#F1F5F9' }}>Points</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#F1F5F9' }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#F1F5F9' }}>Proof / View</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Loading submitted claims...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : claims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Assignment sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                      No claims found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting the date range, department, or search keywords.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                claims.map((claim) => {
                  const statusMeta = STATUS_CONFIG[claim.status] || {
                    label: claim.status,
                    color: 'default',
                    icon: null,
                  };
                  const dateToDisplay = claim.submittedAt || claim.createdAt;
                  const hasProof = claim.attachments && claim.attachments.length > 0;

                  return (
                    <TableRow key={claim._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      {/* Claim Ref & Date */}
                      <TableCell sx={{ verticalAlign: 'top', py: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                          {claim.claimRef || '—'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <CalendarToday sx={{ fontSize: 13, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(dateToDisplay)}
                          </Typography>
                        </Box>
                        {!claim.submittedAt && (
                          <Chip label="Draft Date" size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem', mt: 0.5 }} />
                        )}
                      </TableCell>

                      {/* Student Info */}
                      <TableCell sx={{ verticalAlign: 'top', py: 1.5 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {claim.studentName || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Adm: <strong>{claim.admissionNo || '—'}</strong>
                          {claim.ktuRegisterNo && claim.ktuRegisterNo !== '—' && (
                            <span> | Reg: {claim.ktuRegisterNo}</span>
                          )}
                        </Typography>
                      </TableCell>

                      {/* Department & Class */}
                      <TableCell sx={{ verticalAlign: 'top', py: 1.5 }}>
                        <Chip
                          label={claim.departmentCode || 'DEPT'}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem' }}
                        />
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          {claim.className || '—'}
                        </Typography>
                      </TableCell>

                      {/* Activity & Option */}
                      <TableCell sx={{ verticalAlign: 'top', py: 1.5, maxWidth: 300 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Chip
                            label={claim.activityItemCode || 'Act'}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#EEF2F6' }}
                          />
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 220 }}>
                            {claim.activityItemTitle || claim.title}
                          </Typography>
                        </Box>

                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          Option: {claim.activityOptionLabel || '—'}
                        </Typography>

                        {claim.title && claim.title !== claim.activityItemTitle && (
                          <Typography variant="caption" color="primary.dark" display="block" sx={{ fontStyle: 'italic', mt: 0.2 }}>
                            "{claim.title}"
                          </Typography>
                        )}
                      </TableCell>

                      {/* Points */}
                      <TableCell align="center" sx={{ verticalAlign: 'top', py: 1.5 }}>
                        <Typography variant="body2" fontWeight={700} color="primary.main">
                          {claim.claimedPoints} pts
                        </Typography>
                        {claim.status === 'APPROVED' && (
                          <Chip
                            label={`Awarded: ${claim.awardedPoints} pts`}
                            size="small"
                            color="success"
                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, mt: 0.5 }}
                          />
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell align="center" sx={{ verticalAlign: 'top', py: 1.5 }}>
                        <Chip
                          label={statusMeta.label}
                          size="small"
                          color={statusMeta.color}
                          icon={statusMeta.icon}
                          sx={{ fontWeight: 700, fontSize: '0.75rem', height: 24 }}
                        />
                      </TableCell>

                      {/* Actions & Proof */}
                      <TableCell align="center" sx={{ verticalAlign: 'top', py: 1.5 }}>
                        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                          <Tooltip title="View Full Claim Details">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setSelectedClaim(claim)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {hasProof ? (
                            <Tooltip title={`${claim.attachments.length} Proof File(s)`}>
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => handleViewAttachment(claim.attachments[0])}
                              >
                                {claim.attachments[0].mimeType?.includes('pdf') ? (
                                  <PictureAsPdf fontSize="small" />
                                ) : (
                                  <ImageIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="No Proof Attached">
                              <span>
                                <IconButton size="small" disabled>
                                  <InsertDriveFile fontSize="small" sx={{ opacity: 0.3 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination Bar */}
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

      {/* Claim Full Detail Dialog */}
      <Dialog
        open={Boolean(selectedClaim)}
        onClose={() => setSelectedClaim(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment color="primary" />
            <Typography variant="h6" fontWeight={700}>
              Claim Details — {selectedClaim?.claimRef}
            </Typography>
          </Box>
          <IconButton onClick={() => setSelectedClaim(null)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {selectedClaim && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Student Header Summary */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Student Name:
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {selectedClaim.studentName}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Admission No:
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedClaim.admissionNo}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      KTU Reg No:
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedClaim.ktuRegisterNo || '—'}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Department:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedClaim.departmentCode} — {selectedClaim.departmentName}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Class / Batch:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedClaim.className} ({selectedClaim.batchName || '—'})
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Semester:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedClaim.semester || '—'}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Current Status:
                    </Typography>
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
              </Paper>

              {/* Activity Classification */}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>
                  Activity Catalogue Classification
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Activity Group:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedClaim.activityGroupCode} — {selectedClaim.activityGroupName}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Major Category (Head):</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedClaim.activityHeadCode} — {selectedClaim.activityHeadName}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Sub-Activity Item:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedClaim.activityItemCode} — {selectedClaim.activityItemTitle}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Claimable Option / Tier:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedClaim.activityOptionLabel}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Event / Achievement Details */}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>
                  Event / Achievement Specifics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Event Title / Description:</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedClaim.title || '—'}
                    </Typography>
                  </Grid>

                  {selectedClaim.organisation && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Host Organisation:</Typography>
                      <Typography variant="body2">{selectedClaim.organisation}</Typography>
                    </Grid>
                  )}

                  {selectedClaim.venue && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Venue:</Typography>
                      <Typography variant="body2">{selectedClaim.venue}</Typography>
                    </Grid>
                  )}

                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Activity Date From:</Typography>
                    <Typography variant="body2">{formatDate(selectedClaim.activityDateFrom)}</Typography>
                  </Grid>

                  {selectedClaim.activityDateTo && (
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">Activity Date To:</Typography>
                      <Typography variant="body2">{formatDate(selectedClaim.activityDateTo)}</Typography>
                    </Grid>
                  )}

                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Quantity / Hours / Count:</Typography>
                    <Typography variant="body2" fontWeight={600}>{selectedClaim.quantity || 1}</Typography>
                  </Grid>

                  {selectedClaim.description && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Student Remarks:</Typography>
                      <Typography variant="body2" sx={{ bgcolor: '#FFFDE7', p: 1.5, borderRadius: 1 }}>
                        {selectedClaim.description}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              <Divider />

              {/* Points & Review Details */}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>
                  Scoring & Review Outcome
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Claimed Points:</Typography>
                    <Typography variant="h6" fontWeight={700} color="primary.main">
                      {selectedClaim.claimedPoints} pts
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Awarded Points:</Typography>
                    <Typography variant="h6" fontWeight={700} color="success.main">
                      {selectedClaim.awardedPoints} pts
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Review Remarks:</Typography>
                    <Typography variant="body2" sx={{ fontStyle: selectedClaim.reviewRemarks ? 'normal' : 'italic', color: 'text.secondary' }}>
                      {selectedClaim.reviewRemarks || 'No review remarks recorded yet.'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Attachments Section */}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>
                  Evidence Documents ({selectedClaim.attachments?.length || 0})
                </Typography>
                {selectedClaim.attachments && selectedClaim.attachments.length > 0 ? (
                  <Stack spacing={1}>
                    {selectedClaim.attachments.map((att) => (
                      <Paper
                        key={att._id}
                        variant="outlined"
                        sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 1.5 }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {att.mimeType?.includes('pdf') ? (
                            <PictureAsPdf color="error" />
                          ) : (
                            <ImageIcon color="primary" />
                          )}
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {att.originalFilename}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(att.sizeBytes / 1024).toFixed(1)} KB
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => handleViewAttachment(att)}
                          disabled={isFetchingUrl}
                        >
                          View Document
                        </Button>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No evidence proof documents attached to this claim.
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedClaim(null)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Proof Document Viewer Dialog */}
      <Dialog
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {viewerTitle}
          </Typography>
          <IconButton onClick={() => setViewerOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, height: '75vh', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#0F172A' }}>
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
        <DialogActions sx={{ p: 1.5 }}>
          {viewerUrl && (
            <Button
              variant="outlined"
              size="small"
              component="a"
              href={viewerUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in New Tab
            </Button>
          )}
          <Button onClick={() => setViewerOpen(false)} variant="contained" size="small">
            Close Preview
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AllClaimsAdmin;
