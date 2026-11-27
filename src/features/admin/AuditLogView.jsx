import React, { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination,
  TextField, MenuItem, Select, FormControl, InputLabel,
  Chip, CircularProgress, Alert, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Divider, IconButton,
  RadioGroup, FormControlLabel, Radio, Snackbar
} from '@mui/material';
import {
  History, FilterList, Refresh, Visibility, Delete, DeleteSweep, WarningAmber
} from '@mui/icons-material';
import {
  useGetAuditLogsQuery,
  useRecomputeScoresMutation,
  useDeleteAuditLogMutation,
  useClearAuditLogsMutation
} from '../../api/adminApi';

const ACTION_COLORS = {
  CLAIM_APPROVED: 'success',
  CLAIM_REJECTED: 'error',
  CLAIM_REVOKED: 'warning',
  USER_CREATE: 'info',
  LOGIN_FAILED: 'error',
  LOGIN_SUCCESS: 'default',
  SEMESTER_LOCK: 'secondary',
  RECOMPUTE_SCORES: 'primary',
};

const AuditLogView = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  // Delete state
  const [logToDelete, setLogToDelete] = useState(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearScope, setClearScope] = useState('ALL'); // 'ALL' | 'FILTERED' | '30DAYS'
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Mutations
  const [deleteAuditLog, { isLoading: isDeleting }] = useDeleteAuditLogMutation();
  const [clearAuditLogs, { isLoading: isClearing }] = useClearAuditLogsMutation();
  const [recomputeScores, { isLoading: isRecomputing, isSuccess: recomputeSuccess }] = useRecomputeScoresMutation();

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(entityTypeFilter && { entityType: entityTypeFilter }),
    ...(actionFilter && { action: actionFilter }),
  };

  const { data: logData, isLoading, isError, refetch } = useGetAuditLogsQuery(queryParams);

  const logs = logData?.data || [];
  const meta = logData?.meta || { total: 0 };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRecomputeAll = async () => {
    if (window.confirm('Are you sure you want to trigger institution-wide score recomputation?')) {
      try {
        await recomputeScores({ scope: 'institution' }).unwrap();
        refetch();
      } catch (err) {
        console.error('Recompute failed:', err);
      }
    }
  };

  const handleDeleteSingle = async () => {
    if (!logToDelete) return;
    try {
      await deleteAuditLog(logToDelete._id).unwrap();
      setSnackbar({ open: true, message: 'Audit log entry deleted successfully.', severity: 'success' });
      setLogToDelete(null);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: err?.data?.error?.message || 'Failed to delete audit log entry.', severity: 'error' });
    }
  };

  const handleClearLogs = async () => {
    try {
      const payload = {};
      if (clearScope === 'FILTERED') {
        if (entityTypeFilter) payload.entityType = entityTypeFilter;
        if (actionFilter) payload.action = actionFilter;
      } else if (clearScope === '30DAYS') {
        payload.olderThanDays = 30;
      }
      const res = await clearAuditLogs(payload).unwrap();
      setSnackbar({ open: true, message: res.message || 'Audit logs cleared successfully.', severity: 'success' });
      setClearDialogOpen(false);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: err?.data?.error?.message || 'Failed to clear audit logs.', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 }, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <History color="primary" sx={{ fontSize: 32, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={700} color="#1F3864">
              System Audit Logs
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Forensic trail of all state transitions, approvals, logins, and configurations.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweep />}
            onClick={() => setClearDialogOpen(true)}
            disabled={logs.length === 0}
          >
            Clear Logs
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Refresh />}
            onClick={handleRecomputeAll}
            disabled={isRecomputing}
          >
            {isRecomputing ? 'Recomputing...' : 'Recompute All Scores'}
          </Button>
        </Box>
      </Box>

      {recomputeSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => {}}>
          Institution-wide score recomputation triggered successfully!
        </Alert>
      )}

      {/* Filter Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Entity Type</InputLabel>
              <Select
                value={entityTypeFilter}
                label="Entity Type"
                onChange={(e) => {
                  setEntityTypeFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Entities</MenuItem>
                <MenuItem value="Claim">Claim</MenuItem>
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="SemesterLock">SemesterLock</MenuItem>
                <MenuItem value="StudentScore">StudentScore</MenuItem>
                <MenuItem value="RoleAssignment">RoleAssignment</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Action</InputLabel>
              <Select
                value={actionFilter}
                label="Action"
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Actions</MenuItem>
                <MenuItem value="CLAIM_APPROVED">CLAIM_APPROVED</MenuItem>
                <MenuItem value="CLAIM_REJECTED">CLAIM_REJECTED</MenuItem>
                <MenuItem value="CLAIM_REVOKED">CLAIM_REVOKED</MenuItem>
                <MenuItem value="USER_CREATE">USER_CREATE</MenuItem>
                <MenuItem value="USER_UPDATE">USER_UPDATE</MenuItem>
                <MenuItem value="LOGIN_SUCCESS">LOGIN_SUCCESS</MenuItem>
                <MenuItem value="LOGIN_FAILED">LOGIN_FAILED</MenuItem>
                <MenuItem value="SEMESTER_LOCK">SEMESTER_LOCK</MenuItem>
                <MenuItem value="RECOMPUTE_SCORES">RECOMPUTE_SCORES</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <Button
              variant="text"
              onClick={() => {
                setEntityTypeFilter('');
                setActionFilter('');
                setPage(0);
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <Paper sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Alert severity="error" sx={{ m: 2 }}>Failed to load audit logs.</Alert>
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 720 }}>
                <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Timestamp</TableCell>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Actor</TableCell>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Action</TableCell>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Entity Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>IP Address</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No audit events found matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log._id} hover>
                        <TableCell sx={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {log.actor?.fullName || 'System'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.actor?.username || ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.action}
                            size="small"
                            color={ACTION_COLORS[log.action] || 'default'}
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{log.entityType}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {log.ipAddress || '—'}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              color="primary"
                              title="View Details"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              title="Delete Entry"
                              onClick={() => setLogToDelete(log)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={meta.total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Detail Modal */}
      <Dialog
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <History color="primary" /> Audit Event Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Action</Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>{selectedLog.action}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Timestamp</Typography>
                  <Typography variant="body1">{new Date(selectedLog.createdAt).toLocaleString()}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Actor</Typography>
                  <Typography variant="body1" sx={{ overflowWrap: 'anywhere' }}>{selectedLog.actor?.fullName || 'System'} ({selectedLog.actor?.username || 'N/A'})</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Entity Type / ID</Typography>
                  <Typography variant="body1" sx={{ overflowWrap: 'anywhere' }}>{selectedLog.entityType} ({selectedLog.entityId || 'N/A'})</Typography>
                </Grid>
              </Grid>

              <Divider />

              {selectedLog.beforeValue && (
                <Box>
                  <Typography variant="subtitle2" color="error" gutterBottom>
                    Before Value
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: '#FFF5F5', fontFamily: 'monospace', fontSize: '0.8rem', overflowX: 'auto' }}>
                    <pre>{JSON.stringify(selectedLog.beforeValue, null, 2)}</pre>
                  </Paper>
                </Box>
              )}

              {selectedLog.afterValue && (
                <Box>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    After Value
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: '#F0FDF4', fontFamily: 'monospace', fontSize: '0.8rem', overflowX: 'auto' }}>
                    <pre>{JSON.stringify(selectedLog.afterValue, null, 2)}</pre>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedLog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Single Entry Confirmation Dialog */}
      <Dialog
        open={Boolean(logToDelete)}
        onClose={() => setLogToDelete(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <WarningAmber color="error" /> Delete Audit Log Entry
        </DialogTitle>
        <DialogContent dividers>
          {logToDelete && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="body2">
                Are you sure you want to delete this audit log entry? This action cannot be undone.
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#FFF9F9', borderRadius: 1.5 }}>
                <Typography variant="caption" color="text.secondary">Action:</Typography>
                <Typography variant="body2" fontWeight="bold">{logToDelete.action}</Typography>
                <Typography variant="caption" color="text.secondary">Timestamp:</Typography>
                <Typography variant="body2">{new Date(logToDelete.createdAt).toLocaleString()}</Typography>
                <Typography variant="caption" color="text.secondary">Actor:</Typography>
                <Typography variant="body2">{logToDelete.actor?.fullName || 'System'} ({logToDelete.actor?.username || ''})</Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogToDelete(null)} disabled={isDeleting}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteSingle}
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} /> : <Delete />}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Logs Dialog */}
      <Dialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <DeleteSweep color="error" /> Clear System Audit Logs
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Choose which audit log records you want to delete:
          </Typography>
          <RadioGroup value={clearScope} onChange={(e) => setClearScope(e.target.value)}>
            <FormControlLabel
              value="ALL"
              control={<Radio color="error" />}
              label={
                <Box>
                  <Typography variant="body2" fontWeight="bold">Delete All Audit Logs</Typography>
                  <Typography variant="caption" color="text.secondary">Permanently remove all audit history.</Typography>
                </Box>
              }
              sx={{ mb: 1.5 }}
            />
            {(entityTypeFilter || actionFilter) && (
              <FormControlLabel
                value="FILTERED"
                control={<Radio color="error" />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="bold">Delete Filtered Logs Only</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Delete logs matching: {entityTypeFilter ? `Entity: ${entityTypeFilter} ` : ''}{actionFilter ? `Action: ${actionFilter}` : ''}
                    </Typography>
                  </Box>
                }
                sx={{ mb: 1.5 }}
              />
            )}
            <FormControlLabel
              value="30DAYS"
              control={<Radio color="error" />}
              label={
                <Box>
                  <Typography variant="body2" fontWeight="bold">Delete Logs Older Than 30 Days</Typography>
                  <Typography variant="caption" color="text.secondary">Retain recent logs and clear old history.</Typography>
                </Box>
              }
            />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)} disabled={isClearing}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleClearLogs}
            disabled={isClearing}
            startIcon={isClearing ? <CircularProgress size={16} /> : <DeleteSweep />}
          >
            {isClearing ? 'Clearing...' : 'Confirm Clear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AuditLogView;
