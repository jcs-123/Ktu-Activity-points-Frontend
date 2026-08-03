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
      <Box sx={{ mt: 4 }}>
        <Typography color="error">Failed to load claims. Please try again.</Typography>
      </Box>
    );
  }

  const claims = data?.data || [];
  const meta = data?.meta || { total: 0 };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">My Claims</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/claims/new')}
        >
          New Claim
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table>
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

export default MyClaims;
