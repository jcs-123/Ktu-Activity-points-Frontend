import React from 'react';
import { 
  Box, Typography, Paper, CircularProgress, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Card, CardContent, Button
} from '@mui/material';
import { EmojiEvents, Assignment, VerifiedUser, Print as PrintIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useGetMyScoreQuery } from '../../api/claimApi';
import { selectCurrentUser } from '../auth/authSlice';

const MyReport = () => {
  const user = useSelector(selectCurrentUser);
  const { data: scoreData, isLoading, isError } = useGetMyScoreQuery();

  const handlePrint = () => {
    window.print();
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
      <Box sx={{ p: 4 }}>
        <Typography color="error" variant="h6">Failed to load personal report.</Typography>
      </Box>
    );
  }

  const score = scoreData?.data?.score || {
    group1Points: 0, group2Points: 0, group3Points: 0,
    totalPoints: 0, creditsEarned: 0, isEligible: false,
    requiredTotal: 100, requiredPerGroup: 30,
  };
  
  const headBreakdown = scoreData?.data?.headBreakdown || [];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Action Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2, '@media print': { display: 'none' } }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Personal Activity Points Report
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Official breakdown of your earned KTU activity points for your physical Activity Points File.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<PrintIcon />} 
          onClick={handlePrint}
          sx={{ px: 3, py: 1, fontWeight: 'bold' }}
        >
          Print / Save PDF
        </Button>
      </Box>

      {/* Printable Paper Document Container */}
      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 2 }} elevation={2}>
        
        {/* Printable Official Header */}
        <Box sx={{ textAlign: 'center', mb: 4, pb: 2, borderBottom: '2px solid #1976d2' }}>
          <Typography variant="h5" fontWeight="bold" color="primary">
            JYOTHI ENGINEERING COLLEGE, CHERUTHURUTHY
          </Typography>
          <Typography variant="subtitle1" fontWeight="medium">
            APJ ABDUL KALAM TECHNOLOGICAL UNIVERSITY — ACTIVITY POINTS SCORE SHEET
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Generated on: {new Date().toLocaleDateString()} • Scheme: 2024 Scheme
          </Typography>
        </Box>

        {/* Student Profile Meta Block */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Student Name</Typography>
            <Typography variant="body1" fontWeight="bold">{user?.fullName || 'N/A'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Admission / Register No.</Typography>
            <Typography variant="body1" fontWeight="bold">{user?.username || 'N/A'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Category</Typography>
            <Typography variant="body1" fontWeight="bold">{user?.student?.category || 'REGULAR'}</Typography>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
          <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <EmojiEvents sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">{score.totalPoints}</Typography>
                <Typography variant="body2">Total Points Earned</Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Assignment sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">{score.creditsEarned} / 3</Typography>
                <Typography variant="body2">Credits Awarded</Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: score.isEligible ? 'success.light' : 'warning.light', color: 'white' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <VerifiedUser sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {score.isEligible ? 'Eligible' : 'Not Yet Eligible'}
                </Typography>
                <Typography variant="body2">For Degree Award</Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Category Breakdown Table */}
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Activity Category Breakdown
        </Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Group</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Activity Head</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Raw Points</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Counted Points</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Max Allowed Cap</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                const activeBreakdown = headBreakdown.filter(row => (row.rawPoints > 0 || row.countedPoints > 0));
                if (activeBreakdown.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No approved activity claims recorded yet.</Typography>
                      </TableCell>
                    </TableRow>
                  );
                }
                return activeBreakdown.map((row) => (
                  <TableRow key={row._id || row.activityHead?._id} hover>
                    <TableCell>
                      Group {row.activityHead?.group?.code || 'I'} — {row.activityHead?.group?.name || ''}
                    </TableCell>
                    <TableCell>
                      {row.activityHead?.code} - {row.activityHead?.name}
                    </TableCell>
                    <TableCell align="center">{row.rawPoints}</TableCell>
                    <TableCell align="center">
                      <Typography fontWeight="bold" color="primary">{row.countedPoints}</Typography>
                    </TableCell>
                    <TableCell align="center" color="text.secondary">
                      {row.activityHead?.maxPoints}
                    </TableCell>
                  </TableRow>
                ));
              })()}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Official Signature Block (SRS FR-F-01 requirement) */}
        <Box sx={{ mt: 8, pt: 4, borderTop: '1px dashed #ccc', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
          <Box sx={{ textAlign: 'center', minWidth: 200 }}>
            <Typography variant="body2" sx={{ mb: 6 }}>___________________________________</Typography>
            <Typography variant="body2" fontWeight="bold">Signature of Student</Typography>
            <Typography variant="caption" color="text.secondary">Date: ______________</Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center', minWidth: 200 }}>
            <Typography variant="body2" sx={{ mb: 6 }}>___________________________________</Typography>
            <Typography variant="body2" fontWeight="bold">Senior Faculty Advisor (SFA)</Typography>
            <Typography variant="caption" color="text.secondary">Verification Seal & Signature</Typography>
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

export default MyReport;
