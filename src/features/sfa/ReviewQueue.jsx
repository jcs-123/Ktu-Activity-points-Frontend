import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, 
  CircularProgress, Button, TablePagination, Tabs, Tab,
  Checkbox
} from '@mui/material';
import { Visibility, DoneAll } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetReviewQueueQuery, useBulkApproveMutation } from '../../api/reviewApi';

const STATUS_COLORS = {
  SUBMITTED: '#2196F3',
  UNDER_REVIEW: '#FF9800',
  REVERTED: '#FF5722',
};

const ReviewQueue = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('ACTIONABLE'); // ACTIONABLE or ALL
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  
  const queryParams = {
    page: page + 1,
    per_page: rowsPerPage,
    ...(tab === 'ACTIONABLE' ? { status: 'SUBMITTED,UNDER_REVIEW' } : {})
  };

  const { data, isLoading, isError, refetch } = useGetReviewQueueQuery(queryParams);
  const [bulkApprove, { isLoading: isBulking }] = useBulkApproveMutation();

  const handleChangePage = (event, newPage) => setPage(newPage);
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(claims.map(c => c._id));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = async () => {
    if (selected.length === 0) return;
    try {
      await bulkApprove(selected).unwrap();
      setSelected([]);
      refetch();
    } catch (err) {
      console.error('Bulk approve failed', err);
    }
  };

  if (isLoading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ mt: 4, p: 3 }}>
        <Typography color="error">Failed to load review queue. Please ensure you have SFA access.</Typography>
      </Box>
    );
  }

  const claims = data?.data || [];
  const meta = data?.meta || { total: 0 };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Review Queue
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => { setTab(v); setPage(0); setSelected([]); }}>
          <Tab label="Actionable" value="ACTIONABLE" />
          <Tab label="All Claims" value="ALL" />
        </Tabs>
      </Box>

      {selected.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography>{selected.length} claim(s) selected</Typography>
          <Button 
            variant="contained" 
            color="success" 
            startIcon={isBulking ? <CircularProgress size={20} color="inherit" /> : <DoneAll />}
            onClick={handleBulkApprove}
            disabled={isBulking}
          >
            Bulk Approve
          </Button>
        </Paper>
      )}

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: 'grey.100' }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox 
                  indeterminate={selected.length > 0 && selected.length < claims.length}
                  checked={claims.length > 0 && selected.length === claims.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Student</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Claim Ref</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Activity Title</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Points</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {claims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="textSecondary">
                    Queue is empty.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              claims.map((claim) => (
                <TableRow key={claim._id} hover selected={selected.includes(claim._id)}>
                  <TableCell padding="checkbox">
                    <Checkbox 
                      checked={selected.includes(claim._id)}
                      onChange={() => handleSelect(claim._id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{claim.student?.user?.fullName}</Typography>
                    <Typography variant="caption" color="text.secondary">{claim.student?.admissionNo}</Typography>
                  </TableCell>
                  <TableCell>{claim.claimRef}</TableCell>
                  <TableCell>
                    {claim.title || claim.activityOption?.label || 'Untitled'}
                  </TableCell>
                  <TableCell>{claim.claimedPoints}</TableCell>
                  <TableCell>
                    <Chip 
                      label={claim.status.replace('_', ' ')} 
                      size="small"
                      sx={{ 
                        bgcolor: STATUS_COLORS[claim.status] || '#9E9E9E',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.75rem'
                      }} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button 
                      variant="outlined"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => navigate(`/review/${claim._id}`)}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={meta.total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default ReviewQueue;
