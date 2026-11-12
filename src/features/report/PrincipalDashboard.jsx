import React from 'react';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, 
  Button, CircularProgress, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress 
} from '@mui/material';
import { 
  School, 
  EmojiEvents, 
  Warning, 
  Download as DownloadIcon,
  Assessment,
  ArrowForward,
  CheckCircle,
  AccountBalance
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetExecutiveSummaryQuery } from '../../api/reportApi';
import { downloadWithAuth } from '../../utils/downloadWithAuth';

const PrincipalDashboard = () => {
  const navigate = useNavigate();
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

  const handleExportAuditPack = async () => {
    try {
      await downloadWithAuth('/reports/audit-pack', 'Evidence_Audit_Pack.zip');
    } catch (err) {
      alert(err.message || 'Failed to download Evidence Audit Pack.');
    }
  };

  const handleExportKTUCSV = async () => {
    try {
      await downloadWithAuth('/reports/ktu-export', 'KTU_Portal_Export.csv');
    } catch (err) {
      alert(err.message || 'Failed to download KTU Portal Export.');
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 4 }, maxWidth: 1400, margin: '0 auto' }}>
      {/* Executive Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 3, md: 4 }, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, minWidth: 0 }}>
          <AccountBalance sx={{ fontSize: { xs: 36, sm: 48 }, color: '#1F3864', flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" fontWeight="bold" color="#1F3864" gutterBottom>
              Principal Executive Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Institution-wide oversight for KTU Activity Points compliance & B.Tech degree eligibility.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
          <Button 
            variant="outlined" 
            color="secondary"
            startIcon={<DownloadIcon />}
            onClick={handleExportAuditPack}
            sx={{ flex: { xs: '1 1 auto', sm: '0 0 auto' } }}
          >
            Audit Pack ZIP
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExportKTUCSV}
            sx={{ flex: { xs: '1 1 auto', sm: '0 0 auto' } }}
          >
            Export KTU File
          </Button>
        </Box>
      </Box>

      {/* College-wide KPI Cards */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#F0F9FF', borderLeft: '6px solid #0284C7', height: '100%' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL ENROLLED STUDENTS</Typography>
              <Typography variant="h3" fontWeight="bold" color="#0284C7">{summary.totalStudents}</Typography>
              <Typography variant="caption" color="text.secondary">Across all engineering departments</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#F0FDF4', borderLeft: '6px solid #10B981', height: '100%' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>DEGREE ELIGIBILITY RATE</Typography>
              <Typography variant="h3" fontWeight="bold" color="#10B981">{summary.eligibilityRate}%</Typography>
              <Typography variant="caption" color="text.secondary">{summary.eligibleCount} students cleared degree credits</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#FEF2F2', borderLeft: '6px solid #EF4444', height: '100%' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>COLLEGE DEFICIENT STUDENTS</Typography>
              <Typography variant="h3" fontWeight="bold" color="#EF4444">{summary.deficientCount}</Typography>
              <Typography variant="caption" color="text.secondary">Require additional points before graduation</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#FFF8E1', borderLeft: '6px solid #F59E0B', height: '100%' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL POINTS AWARDED</Typography>
              <Typography variant="h3" fontWeight="bold" color="#D97706">{summary.totalPointsAwarded}</Typography>
              <Typography variant="caption" color="text.secondary">Verified co-curricular activity points</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Access Navigation */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, height: '100%' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700}>College Leaderboard</Typography>
              <Typography variant="caption" color="text.secondary">Top 50 performing students</Typography>
            </Box>
            <Button variant="outlined" color="primary" sx={{ flexShrink: 0 }} onClick={() => navigate('/leaderboard')}>View Ranks</Button>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, height: '100%' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700}>Deficiency Report</Typography>
              <Typography variant="caption" color="text.secondary">Department & Class point deficits</Typography>
            </Box>
            <Button variant="outlined" color="error" sx={{ flexShrink: 0 }} onClick={() => navigate('/reports/deficiency')}>View List</Button>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, height: '100%' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700}>Audit Log Inspector</Typography>
              <Typography variant="caption" color="text.secondary">Institutional compliance history</Typography>
            </Box>
            <Button variant="outlined" color="info" sx={{ flexShrink: 0 }} onClick={() => navigate('/admin/audit')}>View Logs</Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Departmental Progress Roster Table */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Departmental Compliance & Eligibility Progress
        </Typography>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 680 }}>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Department Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Enrolled Students</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Eligible Students</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Deficient Students</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Eligibility Progress</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summary.departmentStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No department data available.
                  </TableCell>
                </TableRow>
              ) : (
                summary.departmentStats.map((dept) => (
                  <TableRow key={dept.deptId} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{dept.name}</TableCell>
                    <TableCell><Chip label={dept.code} size="small" variant="outlined" /></TableCell>
                    <TableCell align="center">{dept.totalStudents}</TableCell>
                    <TableCell align="center" sx={{ color: 'success.main', fontWeight: 'bold' }}>{dept.eligibleCount}</TableCell>
                    <TableCell align="center" sx={{ color: dept.deficientCount > 0 ? 'error.main' : 'text.secondary', fontWeight: 'bold' }}>
                      {dept.deficientCount}
                    </TableCell>
                    <TableCell align="center" sx={{ minWidth: 180 }}>
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

export default PrincipalDashboard;
