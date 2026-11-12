/**
 * Student Dashboard — S-02
 * Three Group progress bars, credits, eligibility, status counts, deadline countdown.
 */

import { Box, Card, CardContent, Typography, LinearProgress, Chip, Button, Divider, CircularProgress, Paper } from '@mui/material';
import {
  CheckCircle, Cancel, HourglassEmpty, EmojiEvents,
  Add as AddIcon, TrendingUp, AutoAwesome,
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
    <Card sx={{ height: '100%', borderRadius: 3, transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Typography variant="h6" color="primary" fontWeight={700}>{label}</Typography>
          {credit ? (
            <Chip label="Credit Earned ✓" color="success" size="small" sx={{ fontWeight: 700 }} />
          ) : (
            <Chip label={`Need ${Math.max(0, required - points)} more`} color="warning" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
          <Typography variant="h3" fontWeight={800} color={credit ? 'success.main' : 'primary.main'}>
            {points}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ ml: 1, fontWeight: 600 }}>
            / {required} pts
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={percentage}
          color={credit ? 'success' : percentage >= 75 ? 'primary' : 'warning'}
          sx={{ height: 10, borderRadius: 5, mb: 1 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {percentage.toFixed(0)}% Completed
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Target: {required} Pts
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const { data: scoreData, isLoading: isLoadingScore } = useGetMyScoreQuery();
  const { data: claimsData } = useListClaimsQuery({ per_page: 5 });

  const userCategory = user?.student?.category || user?.studentProfile?.category || user?.category;
  const studentClass = user?.student?.class;
  const studentDept = studentClass?.department;
  const studentBatch = studentClass?.batch;
  const defaultRequiredTotal = userCategory === 'LATERAL_ENTRY' ? 90 : userCategory === 'PWD' ? 60 : 120;
  const defaultRequiredPerGroup = userCategory === 'LATERAL_ENTRY' ? 30 : userCategory === 'PWD' ? 20 : 40;

  const score = scoreData?.data?.score || {
    group1Points: 0, group2Points: 0, group3Points: 0,
    totalPoints: 0, creditsEarned: 0, isEligible: false,
    requiredTotal: defaultRequiredTotal,
    requiredPerGroup: defaultRequiredPerGroup,
  };

  const requiredPerGroup = score.requiredPerGroup || defaultRequiredPerGroup;
  const requiredTotal = score.requiredTotal || defaultRequiredTotal;

  const isLateralEntry = score.category === 'LATERAL_ENTRY' || userCategory === 'LATERAL_ENTRY';
  const isPwd = score.category === 'PWD' || userCategory === 'PWD';

  if (isLoadingScore) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 } }}>
      {/* Premium Glassmorphic Hero Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5, md: 3.5 },
          mb: 3,
          borderRadius: 3,
          background: isLateralEntry
            ? 'linear-gradient(135deg, #102A43 0%, #1F3864 50%, #3B2D54 100%)'
            : 'linear-gradient(135deg, #102A43 0%, #1F3864 50%, #2E5090 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(16, 42, 67, 0.2)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, position: 'relative', zIndex: 1 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.8 }}>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                Welcome back, {user?.fullName || 'Student'} 👋
              </Typography>

              {isLateralEntry && (
                <Chip
                  icon={<AutoAwesome sx={{ color: '#102A43 !important', fontSize: 16 }} />}
                  label="LATERAL ENTRY • 90 PTS TARGET"
                  sx={{
                    bgcolor: '#FFD700',
                    color: '#102A43',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    boxShadow: '0 2px 10px rgba(255, 215, 0, 0.4)',
                    py: 0.5,
                  }}
                />
              )}

              {isPwd && (
                <Chip
                  label="♿ PwD CATEGORY • 60 PTS TARGET"
                  sx={{
                    bgcolor: '#00D2FF',
                    color: '#102A43',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                  }}
                />
              )}
            </Box>
            {(studentDept || studentClass || user?.username) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                {studentDept && (
                  <Chip
                    label={`${studentDept.code ? `${studentDept.code} — ` : ''}${studentDept.name}`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.18)',
                      color: 'white',
                      fontWeight: 700,
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                  />
                )}
                {studentClass?.name && (
                  <Chip
                    label={`Class: ${studentClass.name}${studentBatch?.name ? ` (${studentBatch.name})` : ''}`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.12)',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                )}
                {user?.username && (
                  <Chip
                    label={`Admission No: ${user.username}`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.12)',
                      color: 'white',
                      fontWeight: 600,
                      fontFamily: 'monospace',
                    }}
                  />
                )}
              </Box>
            )}
            <Typography variant="body1" sx={{ opacity: 0.85, fontWeight: 500 }}>
              KTU Activity Points System • {isLateralEntry ? 'B.Tech Lateral Entry Curriculum (90 Points Target Scheme)' : 'Regular 4-Year B.Tech Curriculum (120 Points Scheme)'}
            </Typography>
          </Box>

          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: { xs: '100%', md: 'auto' },
            gap: 2,
            bgcolor: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(12px)',
            px: { xs: 2, sm: 3 },
            py: 1.8,
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.25)',
          }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                {score.isEligible ? 'Status: Eligible' : 'Earned Credits'}
              </Typography>
              <Typography variant="h3" fontWeight={800} color={score.isEligible ? '#4CAF50' : '#FFD700'}>
                {score.creditsEarned} <Typography component="span" variant="h5" sx={{ opacity: 0.8, fontWeight: 600 }}>/ 3</Typography>
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                {score.totalPoints} / {requiredTotal} Total Pts
              </Typography>
            </Box>
            <EmojiEvents sx={{ fontSize: 44, color: score.isEligible ? '#4CAF50' : '#FFD700' }} />
          </Box>
        </Box>
      </Paper>

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

      {/* Submitted Claims Grouped by Activity Group (Group I, II, III) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        <Box>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Typography variant="h6" color="primary" fontWeight={700}>
                  Submitted Claims (Group-Wise Summary)
                </Typography>
                <Button size="small" onClick={() => navigate('/claims')}>View All Claims</Button>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {claimsData?.data?.length > 0 ? (
                // Group claims by Activity Group (Group I, Group II, Group III)
                Object.entries(
                  claimsData.data.reduce((groups, claim) => {
                    const groupName = claim.activityOption?.item?.head?.group?.name
                      ? `${claim.activityOption.item.head.group.code}: ${claim.activityOption.item.head.group.name}`
                      : 'Group I: National Initiatives & Sports';
                    if (!groups[groupName]) groups[groupName] = [];
                    groups[groupName].push(claim);
                    return groups;
                  }, {})
                ).map(([groupTitle, groupClaims]) => (
                  <Box key={groupTitle} sx={{ mb: 3 }}>
                    {/* Group Header Banner */}
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1,
                      bgcolor: '#F0F4F8',
                      py: 1.2,
                      px: { xs: 1.5, sm: 2 },
                      borderRadius: 1.5,
                      mb: 1.5,
                      borderLeft: '5px solid #1F3864'
                    }}>
                      <Typography variant="subtitle2" fontWeight={700} color="#1F3864">
                        🏷️ {groupTitle}
                      </Typography>
                      <Chip
                        label={`${groupClaims.length} Submitted`}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 'bold', height: 22, fontSize: '0.75rem' }}
                      />
                    </Box>

                    {/* Claims inside this Group */}
                    {groupClaims.map((claim) => (
                      <Box
                        key={claim._id}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          flexWrap: 'wrap',
                          gap: 1.5,
                          py: 1.2,
                          px: { xs: 1.5, sm: 2 },
                          mb: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1.5,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() => navigate(`/claims/${claim._id}`)}
                      >
                        <Box sx={{ minWidth: 0, flex: '1 1 200px', overflowWrap: 'anywhere' }}>
                          <Typography variant="body2" fontWeight={600}>
                            {claim.title || claim.activityOption?.label || 'Untitled Activity'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Ref: {claim.claimRef} • Claimed: {claim.claimedPoints} pts
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={(claim.status || '').replace(/_/g, ' ')}
                            size="small"
                            sx={{
                              bgcolor: STATUS_COLORS[claim.status] || '#9E9E9E',
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ))
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <TrendingUp sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                  <Typography color="text.secondary">No submitted claims yet.</Typography>
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

          {/* Group-Wise Summary Breakdown Card */}
          <Card sx={{ mb: 2, borderLeft: '5px solid #1F3864' }}>
            <CardContent>
              <Typography variant="h6" color="primary" sx={{ mb: 1.5 }} fontWeight={700}>
                Group-Wise Summary
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Group I (National & Sports)</Typography>
                <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ whiteSpace: 'nowrap', textAlign: 'right' }}>{score.group1Points} / {requiredPerGroup} pts</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Group II (Entrepreneurship & Innovation)</Typography>
                <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ whiteSpace: 'nowrap', textAlign: 'right' }}>{score.group2Points} / {requiredPerGroup} pts</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Group III (Leadership & Management)</Typography>
                <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ whiteSpace: 'nowrap', textAlign: 'right' }}>{score.group3Points} / {requiredPerGroup} pts</Typography>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" fontWeight={600} color="text.primary">Total Approved Score</Typography>
                <Typography variant="body2" fontWeight={800} color="success.main">{score.totalPoints} / {requiredTotal} pts</Typography>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" sx={{ mb: 2 }}>Eligibility Status</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Credits Earned</Typography>
                <Typography variant="body2" fontWeight={700}>{score.creditsEarned}/3</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">Degree Eligibility</Typography>
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
