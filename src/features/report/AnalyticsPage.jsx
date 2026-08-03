import React from 'react';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, 
  CircularProgress, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress 
} from '@mui/material';
import { 
  Assessment, 
  CheckCircle, 
  HourglassEmpty, 
  TrendingUp, 
  School,
  Equalizer,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import { useGetExecutiveSummaryQuery } from '../../api/reportApi';

const AnalyticsPage = () => {
  const { data: summaryResponse, isLoading } = useGetExecutiveSummaryQuery();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const summary = summaryResponse?.data || {
    totalStudents: 0,
    eligibleCount: 0,
    deficientCount: 0,
    eligibilityRate: 0,
    totalPointsAwarded: 0,
    departmentStats: [],
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, margin: '0 auto' }}>
      {/* Page Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Assessment sx={{ fontSize: 48, color: '#1F3864' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold" color="#1F3864" gutterBottom>
            Institutional Activity Points Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            In-depth analytics on student engagement, activity distributions, and degree credit progress across departments.
          </Typography>
        </Box>
      </Box>

      {/* Top Metric Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#F0F9FF', borderLeft: '6px solid #0284C7' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL ENROLLED STUDENTS</Typography>
              <Typography variant="h3" fontWeight="bold" color="#0284C7">{summary.totalStudents}</Typography>
              <Typography variant="caption" color="text.secondary">Active B.Tech Candidates</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#F0FDF4', borderLeft: '6px solid #10B981' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>CREDIT ELIGIBILITY RATE</Typography>
              <Typography variant="h3" fontWeight="bold" color="#10B981">{summary.eligibilityRate}%</Typography>
              <Typography variant="caption" color="text.secondary">{summary.eligibleCount} students degree-eligible</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#FEF2F2', borderLeft: '6px solid #EF4444' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>DEFICIENT STUDENTS</Typography>
              <Typography variant="h3" fontWeight="bold" color="#EF4444">{summary.deficientCount}</Typography>
              <Typography variant="caption" color="text.secondary">Pending point completion</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#FFF8E1', borderLeft: '6px solid #F59E0B' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL POINTS VERIFIED</Typography>
              <Typography variant="h3" fontWeight="bold" color="#D97706">{summary.totalPointsAwarded}</Typography>
              <Typography variant="caption" color="text.secondary">Co-curricular points awarded</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Activity Group Distribution Breakdown */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%', borderTop: '4px solid #2563EB' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Equalizer color="primary" />
              <Typography variant="h6" fontWeight={700}>Group I — National Initiatives</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              NSS, NCC, Sports, Games, Yoga, Cultural & Environmental Protection.
            </Typography>
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Target: 40 Points / Student</Typography>
              <Typography variant="h5" fontWeight={700} color="primary" sx={{ mt: 0.5 }}>Active Participation</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%', borderTop: '4px solid #10B981' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Equalizer color="success" />
              <Typography variant="h6" fontWeight={700}>Group II — Technical & Innovation</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Tech Fests, Paper Presentations, Hackathons, Patents, IEDC & Startups.
            </Typography>
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Target: 40 Points / Student</Typography>
              <Typography variant="h5" fontWeight={700} color="success.main" sx={{ mt: 0.5 }}>High Innovation Growth</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%', borderTop: '4px solid #F59E0B' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Equalizer color="warning" />
              <Typography variant="h6" fontWeight={700}>Group III — Leadership & Skilling</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Professional Body Membership, Student Office Bearers, Skilling Courses & MOOCs.
            </Typography>
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Target: 40 Points / Student</Typography>
              <Typography variant="h5" fontWeight={700} color="warning.main" sx={{ mt: 0.5 }}>Professional Skilling</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Departmental Progress Comparison Table */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Departmental Credit Compliance & Performance Roster
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell fontWeight={700}>Department Name</TableCell>
                <TableCell fontWeight={700}>Code</TableCell>
                <TableCell align="center" fontWeight={700}>Enrolled Students</TableCell>
                <TableCell align="center" fontWeight={700}>Eligible Students</TableCell>
                <TableCell align="center" fontWeight={700}>Deficient Students</TableCell>
                <TableCell align="center" fontWeight={700}>Eligibility Rate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summary.departmentStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No departmental data available yet.
                  </TableCell>
                </TableRow>
              ) : (
                summary.departmentStats.map((dept) => (
                  <TableRow key={dept.deptId} hover>
                    <TableCell fontWeight={600}>{dept.name}</TableCell>
                    <TableCell><Chip label={dept.code} size="small" variant="outlined" /></TableCell>
                    <TableCell align="center">{dept.totalStudents}</TableCell>
                    <TableCell align="center" sx={{ color: 'success.main', fontWeight: 'bold' }}>{dept.eligibleCount}</TableCell>
                    <TableCell align="center" sx={{ color: dept.deficientCount > 0 ? 'error.main' : 'text.secondary', fontWeight: 'bold' }}>
                      {dept.deficientCount}
                    </TableCell>
                    <TableCell align="center" sx={{ width: 220 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={Number(dept.eligibilityRate)} 
                          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                          color={Number(dept.eligibilityRate) >= 75 ? 'success' : 'warning'}
                        />
                        <Typography variant="caption" fontWeight={700}>{dept.eligibilityRate}%</Typography>
                      </Box>
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

export default AnalyticsPage;
