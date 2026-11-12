import React from 'react';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, 
  Button, CircularProgress, Divider, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow 
} from '@mui/material';
import { 
  PendingActions, 
  CheckCircle, 
  Warning, 
  ArrowForward,
  Assessment,
  History,
  RateReview,
  School
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetSFADashboardMetricsQuery } from '../../api/reviewApi';

const SFADashboard = () => {
  const navigate = useNavigate();
  const { data: metricsResponse, isLoading, isError } = useGetSFADashboardMetricsQuery();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const metrics = metricsResponse?.data || {
    pendingCount: 0,
    slaBreachesCount: 0,
    totalReviewed: 0,
    deficientCount: 0,
    totalStudents: 0,
    totalClasses: 0,
    recentPending: [],
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 4 }, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 3, md: 4 }, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" fontWeight="bold" color="#1F3864" gutterBottom>
            Senior Faculty Advisor Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Live overview of pending claim reviews, SLA status, and student progress across assigned classes.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          startIcon={<RateReview />}
          endIcon={<ArrowForward />}
          onClick={() => navigate('/review')}
          sx={{ fontWeight: 'bold', px: { xs: 2, sm: 3 }, width: { xs: '100%', sm: 'auto' } }}
        >
          Open Review Queue ({metrics.pendingCount})
        </Button>
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#FFF8E1', borderLeft: '6px solid #FFA000', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>PENDING REVIEWS</Typography>
                  <Typography variant="h3" fontWeight="bold" color="#D97706">{metrics.pendingCount}</Typography>
                </Box>
                <PendingActions sx={{ fontSize: 44, color: '#D97706', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: metrics.slaBreachesCount > 0 ? '#FEF2F2' : '#F0FDF4', borderLeft: `6px solid ${metrics.slaBreachesCount > 0 ? '#EF4444' : '#10B981'}`, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>SLA BREACHES (&gt;7 DAYS)</Typography>
                  <Typography variant="h3" fontWeight="bold" color={metrics.slaBreachesCount > 0 ? 'error.main' : 'success.main'}>
                    {metrics.slaBreachesCount}
                  </Typography>
                </Box>
                <Warning sx={{ fontSize: 44, color: metrics.slaBreachesCount > 0 ? '#EF4444' : '#10B981', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#F0F9FF', borderLeft: '6px solid #0284C7', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>CLAIMS PROCESSED</Typography>
                  <Typography variant="h3" fontWeight="bold" color="#0284C7">{metrics.totalReviewed}</Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 44, color: '#0284C7', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: metrics.deficientCount > 0 ? '#FFF5F5' : '#F8FAFC', borderLeft: '6px solid #64748B', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>DEFICIENT STUDENTS</Typography>
                  <Typography variant="h3" fontWeight="bold" color="#475569">{metrics.deficientCount}</Typography>
                </Box>
                <School sx={{ fontSize: 44, color: '#475569', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Navigation Cards */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, height: '100%' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700}>Review Queue</Typography>
              <Typography variant="caption" color="text.secondary">Process incoming student claims</Typography>
            </Box>
            <Button variant="outlined" sx={{ flexShrink: 0 }} onClick={() => navigate('/review')}>Open Queue</Button>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, height: '100%' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700}>Deficiency Report</Typography>
              <Typography variant="caption" color="text.secondary">Track student point deficits</Typography>
            </Box>
            <Button variant="outlined" color="error" sx={{ flexShrink: 0 }} onClick={() => navigate('/reports/deficiency')}>View Report</Button>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, height: '100%' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700}>College Leaderboard</Typography>
              <Typography variant="caption" color="text.secondary">Top performing student scores</Typography>
            </Box>
            <Button variant="outlined" color="info" sx={{ flexShrink: 0 }} onClick={() => navigate('/leaderboard')}>View Ranks</Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Submissions Table */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Recent Pending Claims
        </Typography>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 640 }}>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Admission No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Activity</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Points</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Submitted Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {metrics.recentPending.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No pending claims awaiting review 🎉
                  </TableCell>
                </TableRow>
              ) : (
                metrics.recentPending.map((claim) => (
                  <TableRow key={claim._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{claim.student?.user?.fullName || 'N/A'}</TableCell>
                    <TableCell>{claim.student?.admissionNo || 'N/A'}</TableCell>
                    <TableCell>{claim.title || claim.activityOption?.label}</TableCell>
                    <TableCell align="center">
                      <Chip label={`${claim.claimedPoints} pts`} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.85rem' }}>
                      {new Date(claim.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <Button size="small" variant="contained" onClick={() => navigate(`/review/${claim._id}`)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default SFADashboard;
