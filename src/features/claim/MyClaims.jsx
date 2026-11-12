import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, 
  CircularProgress, Button, TablePagination
} from '@mui/material';
import { Visibility, Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useListClaimsQuery } from '../../api/claimApi';

const STATUS_COLORS = {
  DRAFT: '#9E9E9E',
  SUBMITTED: '#2196F3',
  UNDER_REVIEW: '#FF9800',
  APPROVED: '#4CAF50',
  REJECTED: '#F44336',
  REVERTED: '#FF5722',
};

const MyClaims = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const { data, isLoading, isError } = useListClaimsQuery({ 
    page: page + 1, 
    per_page: rowsPerPage 
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ mt: 4, p: { xs: 2, sm: 3 } }}>
        <Typography color="error">Failed to load claims. Please try again.</Typography>
      </Box>
    );
  }

  const claims = data?.data || [];
  const meta = data?.meta || { total: 0 };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: { xs: 2.5, md: 4 } }}>
        <Typography variant="h4" fontWeight="bold">My Claims</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/claims/new')}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          New Claim
        </Button>
      </Box>

      {/* Mobile Card List */}
      <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 1.5, mb: 2 }}>
        {claims.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body1" color="textSecondary">
              You haven't submitted any claims yet.
            </Typography>
          </Paper>
        ) : (
          claims.map((claim) => (
            <Paper
              key={claim._id}
              variant="outlined"
              sx={{ p: 2, borderRadius: 2, cursor: 'pointer' }}
              onClick={() => navigate(`/claims/${claim._id}`)}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ overflowWrap: 'anywhere' }}>
                    {claim.title || claim.activityOption?.item?.title || claim.activityOption?.label || 'Untitled'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {claim.claimRef} • {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : '—'}
                  </Typography>
                </Box>
                <Chip
                  label={(claim.status || '').replace(/_/g, ' ')}
                  size="small"
                  sx={{ bgcolor: STATUS_COLORS[claim.status] || '#9E9E9E', color: 'white', fontWeight: 'bold', fontSize: '0.72rem', flexShrink: 0 }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="body2" fontWeight="bold">{claim.claimedPoints} pts</Typography>
                  {claim.activityOption?.item?.head?.maxPoints && claim.claimedPoints >= claim.activityOption.item.head.maxPoints && (
                    <Chip
                      label={`CAPPED @ ${claim.activityOption.item.head.maxPoints}`}
                      color="warning"
                      size="small"
                      sx={{ fontWeight: 'bold', fontSize: '0.68rem', height: 20 }}
                    />
                  )}
                </Box>
                <Button size="small" variant="outlined" startIcon={<Visibility />}>
                  View
                </Button>
              </Box>
            </Paper>
          ))
        )}
      </Box>

      {/* Tablet & Desktop Table */}
      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, display: { xs: 'none', sm: 'block' } }}>
        <Table sx={{ minWidth: 620 }}>
          <TableHead sx={{ backgroundColor: 'grey.100' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Claim Ref</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Activity Title</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Points</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {claims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="textSecondary">
                    You haven't submitted any claims yet.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              claims.map((claim) => (
                <TableRow key={claim._id} hover>
                  <TableCell>{claim.claimRef}</TableCell>
                  <TableCell>
                    {claim.title || claim.activityOption?.item?.title || claim.activityOption?.label || 'Untitled'}
                  </TableCell>
                  <TableCell>
                    {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="body2" fontWeight="bold">{claim.claimedPoints} pts</Typography>
                      {claim.activityOption?.item?.head?.maxPoints && claim.claimedPoints >= claim.activityOption.item.head.maxPoints && (
                        <Chip
                          label={`CAPPED @ ${claim.activityOption.item.head.maxPoints}`}
                          color="warning"
                          size="small"
                          sx={{ fontWeight: 'bold', fontSize: '0.68rem', height: 20 }}
                          title={`Exceeds max allowable cap of ${claim.activityOption.item.head.maxPoints} pts for this category`}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={(claim.status || '').replace(/_/g, ' ')} 
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
                    <IconButton 
                      color="primary" 
                      onClick={() => navigate(`/claims/${claim._id}`)}
                      title="View Details"
                    >
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Paper sx={{ mt: { xs: 1, sm: 0 }, borderRadius: { xs: 2, sm: '0 0 8px 8px' } }}>
        <TablePagination
          component="div"
          count={meta.total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default MyClaims;
