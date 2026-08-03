import React, { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination,
  TextField, MenuItem, Select, FormControl, InputLabel,
  Chip, CircularProgress, Alert, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Card, CardContent, Divider
} from '@mui/material';
import { History, FilterList, Refresh, Visibility, Security } from '@mui/icons-material';
import { useGetAuditLogsQuery, useRecomputeScoresMutation } from '../../api/adminApi';

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

  // Recompute scores trigger
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

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <History color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700} color="#1F3864">
              System Audit Logs
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Immutable forensic trail of all state transitions, approvals, logins, and configurations (FR-I-01 to FR-I-05).
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refetch()}
          >
            Refresh
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
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
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

          <Grid item xs={12} sm={4} md={3}>
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

          <Grid item xs={12} sm={4} md={2}>
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
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Alert severity="error" sx={{ m: 2 }}>Failed to load audit logs.</Alert>
        ) : (
          <>
            <Table>
              <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell fontWeight={700}>Timestamp</TableCell>
                  <TableCell fontWeight={700}>Actor</TableCell>
                  <TableCell fontWeight={700}>Action</TableCell>
                  <TableCell fontWeight={700}>Entity Type</TableCell>
                  <TableCell fontWeight={700}>IP Address</TableCell>
                  <TableCell align="center" fontWeight={700}>Details</TableCell>
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
                      <TableCell sx={{ fontSize: '0.85rem' }}>
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
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {log.ipAddress || '—'}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => setSelectedLog(log)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
      </TableContainer>

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
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Action</Typography>
                  <Typography variant="body1" fontWeight={600}>{selectedLog.action}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Timestamp</Typography>
                  <Typography variant="body1">{new Date(selectedLog.createdAt).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Actor</Typography>
                  <Typography variant="body1">{selectedLog.actor?.fullName || 'System'} ({selectedLog.actor?.username || 'N/A'})</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Entity Type / ID</Typography>
                  <Typography variant="body1">{selectedLog.entityType} ({selectedLog.entityId || 'N/A'})</Typography>
                </Grid>
              </Grid>

              <Divider />

              {selectedLog.beforeValue && (
                <Box>
                  <Typography variant="subtitle2" color="error" gutterBottom>
                    Before Value
                  </Typography>
                  <Paper sx={{ p: 2, bg: '#FFF5F5', fontFamily: 'monospace', fontSize: '0.8rem', overflowX: 'auto' }}>
                    <pre>{JSON.stringify(selectedLog.beforeValue, null, 2)}</pre>
                  </Paper>
                </Box>
              )}

              {selectedLog.afterValue && (
                <Box>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    After Value
                  </Typography>
                  <Paper sx={{ p: 2, bg: '#F0FDF4', fontFamily: 'monospace', fontSize: '0.8rem', overflowX: 'auto' }}>
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
    </Box>
  );
};

export default AuditLogView;
