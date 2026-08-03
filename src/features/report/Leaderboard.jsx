import React from 'react';
import { 
  Box, Typography, Paper, CircularProgress, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Avatar, Chip
} from '@mui/material';
import { EmojiEvents } from '@mui/icons-material';
import { useGetLeaderboardQuery } from '../../api/reportApi';

const Leaderboard = () => {
  const { data, isLoading, isError } = useGetLeaderboardQuery();

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
        <Typography color="error" variant="h6">Failed to load Leaderboard.</Typography>
      </Box>
    );
  }

  const leaderboard = data?.data || [];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <EmojiEvents sx={{ fontSize: 40, color: 'warning.main' }} />
        <Typography variant="h4" fontWeight="bold">
          College Leaderboard
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Top 50 students across the college ranked by total activity points.
      </Typography>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Rank</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Student</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Batch</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Total Points</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaderboard.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  No data available yet.
                </TableCell>
              </TableRow>
            ) : (
              leaderboard.map((student, idx) => (
                <TableRow key={student.admissionNo} hover>
                  <TableCell>
                    {idx === 0 ? <Chip label="1st" color="warning" size="small" sx={{ fontWeight: 'bold' }} /> :
                     idx === 1 ? <Chip label="2nd" sx={{ bgcolor: '#E0E0E0', fontWeight: 'bold' }} size="small" /> :
                     idx === 2 ? <Chip label="3rd" sx={{ bgcolor: '#D7CCC8', fontWeight: 'bold' }} size="small" /> :
                     <Typography variant="body2" fontWeight="bold" sx={{ ml: 1 }}>{student.rank}</Typography>}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                        {student.studentName?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">{student.studentName}</Typography>
                        <Typography variant="caption" color="text.secondary">{student.admissionNo}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{student.batch}</TableCell>
                  <TableCell align="right">
                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                      {student.totalPoints}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Leaderboard;
