import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Paper, CircularProgress, Chip, 
  Divider, Button, Grid, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  Check as ApproveIcon,
  Close as RejectIcon,
  Replay as RevertIcon,
  OpenInNew as ViewIcon
} from '@mui/icons-material';
import { 
  useGetClaimForReviewQuery, 
  useApproveClaimMutation,
  useRejectClaimMutation,
  useRevertClaimMutation,
  useOpenClaimMutation
} from '../../api/reviewApi';
import { useLazyGetAttachmentUrlQuery } from '../../api/claimApi';

const STATUS_COLORS = {
  SUBMITTED: '#2196F3',
  UNDER_REVIEW: '#FF9800',
  APPROVED: '#4CAF50',
  REJECTED: '#F44336',
  REVERTED: '#FF5722',
};

const ClaimReviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: claimResponse, isLoading, isError, refetch } = useGetClaimForReviewQuery(id);
  
  const [openClaim] = useOpenClaimMutation();
  const [approveClaim, { isLoading: isApproving }] = useApproveClaimMutation();
  const [rejectClaim, { isLoading: isRejecting }] = useRejectClaimMutation();
  const [revertClaim, { isLoading: isReverting }] = useRevertClaimMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // APPROVE, REJECT, REVERT
  const [remarks, setRemarks] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Attachment Viewer State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerType, setViewerType] = useState('');

  const [triggerGetAttachmentUrl, { isLoading: isFetchingUrl }] = useLazyGetAttachmentUrlQuery();

  const handleViewAttachment = async (attId, mimeType) => {
    try {
      const res = await triggerGetAttachmentUrl(attId).unwrap();
      setViewerUrl(res.data.url);
      setViewerType(mimeType);
      setViewerOpen(true);
    } catch (err) {
      console.error(err);
      alert('Failed to retrieve proof file URL.');
    }
  };

  const claim = claimResponse?.data?.claim;
  const attachments = claimResponse?.data?.attachments || [];
  const timeline = claimResponse?.data?.timeline || [];

  // Auto-open claim if it's SUBMITTED and we are viewing it
  useEffect(() => {
    if (claim?.status === 'SUBMITTED') {
      openClaim(claim._id).catch(console.error);
    }
  }, [claim?.status, claim?._id, openClaim]);

  const handleActionClick = (type) => {
    setActionType(type);
    setRemarks('');
    setErrorMsg('');
    setDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if ((actionType === 'REJECT' || actionType === 'REVERT') && !remarks.trim()) {
      setErrorMsg('Remarks are mandatory for this action.');
      return;
    }

    try {
      if (actionType === 'APPROVE') {
        await approveClaim({ id: claim._id, remarks }).unwrap();
      } else if (actionType === 'REJECT') {
        await rejectClaim({ id: claim._id, remarks }).unwrap();
      } else if (actionType === 'REVERT') {
        await revertClaim({ id: claim._id, remarks }).unwrap();
      }
      setDialogOpen(false);
      navigate('/review'); // Go back to queue after processing
    } catch (err) {
      setErrorMsg(err?.data?.error?.message || 'Action failed.');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !claim) {
    return (
      <Box sx={{ p: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/review')} sx={{ mb: 3 }}>
          Back to Queue
        </Button>
        <Typography color="error" variant="h6">Failed to load claim for review.</Typography>
      </Box>
    );
  }

  const isActionable = ['SUBMITTED', 'UNDER_REVIEW'].includes(claim.status);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/review')} sx={{ mb: 3 }}>
        Back to Queue
      </Button>

      <Grid container spacing={4}>
        {/* Left Col - Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, mb: 4 }} elevation={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {claim.title || claim.activityOption?.label || 'Untitled Claim'}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Ref: {claim.claimRef} • Submitted: {new Date(claim.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              <Chip 
                label={claim.status.replace('_', ' ')} 
                sx={{ bgcolor: STATUS_COLORS[claim.status] || '#9E9E9E', color: 'white', fontWeight: 'bold' }} 
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Student Name</Typography>
                <Typography variant="body1" fontWeight="bold">{claim.student?.user?.fullName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Admission No.</Typography>
                <Typography variant="body1" fontWeight="bold">{claim.student?.admissionNo}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Activity Category</Typography>
                <Typography variant="body1">
                  {claim.activityOption?.item?.head?.group?.code} - {claim.activityOption?.item?.head?.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Specific Activity</Typography>
                <Typography variant="body1">{claim.activityOption?.label}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Claimed Points</Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">{claim.claimedPoints} pts</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Date</Typography>
                <Typography variant="body1">
                  {claim.activityDateFrom ? new Date(claim.activityDateFrom).toLocaleDateString() : 'N/A'}
                </Typography>
              </Grid>
            </Grid>

            {claim.description && (
              <Box sx={{ mb: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Description provided by student</Typography>
                <Typography variant="body1">{claim.description}</Typography>
              </Box>
            )}

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Evidence Attachments</Typography>
            {attachments.length > 0 ? (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {attachments.map(att => (
                  <Paper key={att._id} variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight="medium">{att.originalFilename}</Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      endIcon={isFetchingUrl ? <CircularProgress size={16} /> : <ViewIcon />}
                      onClick={() => handleViewAttachment(att._id, att.mimeType)}
                    >
                      View Evidence
                    </Button>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary">No proof files attached to this claim.</Typography>
            )}
          </Paper>
        </Grid>

        {/* Right Col - Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, position: 'sticky', top: 24 }} elevation={2}>
            <Typography variant="h6" gutterBottom>Review Actions</Typography>
            <Divider sx={{ mb: 3 }} />
            
            {isActionable ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button 
                  variant="contained" 
                  color="success" 
                  size="large"
                  startIcon={<ApproveIcon />}
                  onClick={() => handleActionClick('APPROVE')}
                >
                  Approve Claim
                </Button>
                <Button 
                  variant="outlined" 
                  color="warning" 
                  size="large"
                  startIcon={<RevertIcon />}
                  onClick={() => handleActionClick('REVERT')}
                >
                  Revert for Details
                </Button>
                <Button 
                  variant="outlined" 
                  color="error" 
                  size="large"
                  startIcon={<RejectIcon />}
                  onClick={() => handleActionClick('REJECT')}
                >
                  Reject Claim
                </Button>
              </Box>
            ) : (
              <Alert severity={claim.status === 'APPROVED' ? 'success' : claim.status === 'REJECTED' ? 'error' : 'info'}>
                This claim is currently <strong>{claim.status}</strong> and requires no further action from you.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'APPROVE' && 'Approve Claim'}
          {actionType === 'REJECT' && 'Reject Claim'}
          {actionType === 'REVERT' && 'Revert Claim'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            {actionType === 'APPROVE' && 'Are you sure you want to approve this claim?'}
            {actionType === 'REJECT' && 'Are you sure you want to permanently reject this claim?'}
            {actionType === 'REVERT' && 'Send this claim back to the student as a DRAFT so they can make corrections.'}
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label={actionType === 'APPROVE' ? "Remarks (Optional)" : "Remarks (Mandatory)"}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            error={!!errorMsg}
            helperText={errorMsg}
            required={actionType !== 'APPROVE'}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color={actionType === 'APPROVE' ? 'success' : actionType === 'REJECT' ? 'error' : 'warning'}
            onClick={handleConfirmAction}
            disabled={isApproving || isRejecting || isReverting}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Attachment Inline Viewer Dialog */}
      <Dialog open={viewerOpen} onClose={() => setViewerOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Proof Certificate Preview</DialogTitle>
        <DialogContent dividers sx={{ p: 0, height: '600px', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: 'grey.900' }}>
          {viewerType === 'application/pdf' ? (
            <iframe
              src={viewerUrl}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              title="Proof Preview"
            />
          ) : (
            <img
              src={viewerUrl}
              alt="Evidence Certificate"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewerOpen(false)}>Close Preview</Button>
          <Button variant="contained" href={viewerUrl} target="_blank" endIcon={<ViewIcon />}>
            Open In New Tab
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClaimReviewDetail;
