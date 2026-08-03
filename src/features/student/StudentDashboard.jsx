/**
 * Student Dashboard — S-02
 * Three Group progress bars, credits, eligibility, status counts, deadline countdown.
 */

import { Box, Card, CardContent, Typography, LinearProgress, Chip, Button, Divider } from '@mui/material';
import {
  CheckCircle, Cancel, HourglassEmpty, EmojiEvents,
  Add as AddIcon, TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetMyScoreQuery, useListClaimsQuery } from '../../api/claimApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../auth/authSlice';

const STATUS_COLORS = {
  DRAFT: '#9E9E9E',
  SUBMITTED: '#2196F3',
  UNDER_REVIEW: '#FF9800',
  APPROVED: '#4CAF50',
  REJECTED: '#F44336',
  REVERTED: '#FF5722',
};

const GroupProgressCard = ({ label, groupCode, points, required, credit }) => {
  const percentage = Math.min(100, (points / required) * 100);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" color="primary">{label}</Typography>
          {credit ? (
            <Chip label="Credit Earned ✓" color="success" size="small" />
          ) : (
            <Chip label={`Need ${required - points} more`} color="warning" size="small" variant="outlined" />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
          <Typography variant="h3" fontWeight={700} color={credit ? 'success.main' : 'primary'}>
            {points}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ ml: 1 }}>
            / {required} points
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={percentage}
          color={credit ? 'success' : percentage >= 75 ? 'primary' : 'warning'}
          sx={{ height: 10, borderRadius: 5 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {percentage.toFixed(0)}% complete
        </Typography>
      </CardContent>
    </Card>
  );
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const { data: scoreData } = useGetMyScoreQuery();
  const { data: claimsData } = useListClaimsQuery({ per_page: 5 });

  const score = scoreData?.data?.score || {
    group1Points: 0, group2Points: 0, group3Points: 0,
    totalPoints: 0, creditsEarned: 0, isEligible: false,
    requiredTotal: 120, requiredPerGroup: 40,
  };

  const requiredPerGroup = score.requiredPerGroup || 40;
  const requiredTotal = score.requiredTotal || 120;

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} color="primary">
          Welcome back, {user?.fullName || 'Student'}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          KTU Activity Points Dashboard • 2024 Scheme
        </Typography>
      </Box>

      {/* Eligibility Banner */}
      <Card sx={{
        mb: 3,
        background: score.isEligible
          ? 'linear-gradient(135deg, #2E7D32, #388E3C)'
          : 'linear-gradient(135deg, #1F3864, #2E5090)',
        color: 'white',
      }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {score.isEligible ? '🎉 Eligible for Degree Award' : 'Activity Points Progress'}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {score.creditsEarned}/3 Activity Credits • {score.totalPoints}/{requiredTotal} Total Points
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', ml: { xs: 0, sm: 'auto' } }}>
            <Typography variant="h2" fontWeight={800}>
              {score.creditsEarned}/3
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Credits</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Group Progress Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 3 }}>
        <Box>
          <GroupProgressCard
            label="Group I"
            groupCode="I"
            points={score.group1Points}
            required={requiredPerGroup}
            credit={score.group1Credit}
          />
        </Box>
        <Box>
          <GroupProgressCard
            label="Group II"
            groupCode="II"
            points={score.group2Points}
            required={requiredPerGroup}
            credit={score.group2Credit}
          />
        </Box>
        <Box>
          <GroupProgressCard
            label="Group III"
            groupCode="III"
            points={score.group3Points}
            required={requiredPerGroup}
            credit={score.group3Credit}
          />
        </Box>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" color="primary">Recent Claims</Typography>
                <Button size="small" onClick={() => navigate('/claims')}>View All</Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {claimsData?.data?.length > 0 ? (
                claimsData.data.map((claim) => (
                  <Box
                    key={claim._id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1.5,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'grey.50' },
                      px: 1,
                      borderRadius: 1,
                    }}
                    onClick={() => navigate(`/claims/${claim._id}`)}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {claim.title || claim.activityOption?.label || 'Untitled'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {claim.claimRef} • {claim.claimedPoints} pts
                      </Typography>
                    </Box>
                    <Chip
                      label={claim.status.replace('_', ' ')}
                      size="small"
                      sx={{
                        bgcolor: STATUS_COLORS[claim.status] || '#9E9E9E',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                ))
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <TrendingUp sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                  <Typography color="text.secondary">No claims yet. Start by submitting your first activity!</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<AddIcon />}
                onClick={() => navigate('/claims/new')}
                sx={{
                  py: 2,
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #BF9000, #D4A833)',
                  '&:hover': { background: 'linear-gradient(135deg, #8F6C00, #BF9000)' },
                }}
              >
                New Claim
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" sx={{ mb: 2 }}>Quick Stats</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Total Points</Typography>
                <Typography variant="body2" fontWeight={700}>{score.totalPoints}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Credits Earned</Typography>
                <Typography variant="body2" fontWeight={700}>{score.creditsEarned}/3</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip
                  label={score.isEligible ? 'Eligible' : 'In Progress'}
                  color={score.isEligible ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default StudentDashboard;
