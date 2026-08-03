import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Paper, CircularProgress, Chip, 
  Divider, Button, Grid, Dialog, DialogTitle, DialogContent, IconButton
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { useGetClaimQuery, useSubmitClaimMutation, useLazyGetAttachmentUrlQuery, useUploadAttachmentMutation } from '../../api/claimApi';

const STATUS_COLORS = {
  DRAFT: '#9E9E9E',
  SUBMITTED: '#2196F3',
  UNDER_REVIEW: '#FF9800',
  APPROVED: '#4CAF50',
  REJECTED: '#F44336',
  REVERTED: '#FF5722',
};

const ClaimDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: claimResponse, isLoading, isError, refetch } = useGetClaimQuery(id);
  const [submitClaim, { isLoading: isSubmitting }] = useSubmitClaimMutation();

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

  const [uploadAttachment, { isLoading: isUploading }] = useUploadAttachmentMutation();

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      await uploadAttachment({ id, formData }).unwrap();
      refetch();
    } catch (err) {
      console.error('Upload failed:', err);
      alert(err?.data?.error?.message || 'Failed to upload proof file.');
    }
  };

  const handleSubmit = async () => {
    try {
      await submitClaim(id).unwrap();
      refetch();
    } catch (err) {
      console.error('Failed to submit claim:', err);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !claimResponse?.data) {
    return (
      <Box sx={{ p: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/claims')} sx={{ mb: 3 }}>
          Back to My Claims
        </Button>
        <Typography color="error" variant="h6">Failed to load claim details.</Typography>
      </Box>
    );
  }

  const claim = claimResponse.data;
  const attachments = claim.attachments || [];
  const timeline = claim.timeline || [];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/claims')} sx={{ mb: 3 }}>
        Back to My Claims
      </Button>

      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, mb: 4 }} elevation={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {claim.title || claim.activityOption?.label || 'Untitled Claim'}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Ref: {claim.claimRef} • Version: v{claim.version || 1}
            </Typography>
          </Box>
          <Chip 
            label={claim.status.replace('_', ' ')} 
            sx={{ 
              bgcolor: STATUS_COLORS[claim.status] || '#9E9E9E',
              color: 'white',
              fontWeight: 'bold',
              px: 1
            }} 
          />
        </Box>

        {claim.status === 'REVERTED' && (
          <Box sx={{ mb: 3, p: 3, bgcolor: '#FFF3E0', border: '2px solid #FF9800', borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" color="warning.dark" gutterBottom>
              ⚠️ Claim Reverted for Clarification
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>SFA Remarks:</strong> {claim.reviewRemarks || 'Please upload updated proof or clarify event details.'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button
                variant="outlined"
                component="label"
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Additional Proof'}
                <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.heic" onChange={handleFileUpload} />
              </Button>

              <Button 
                variant="contained" 
                color="warning" 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                sx={{ fontWeight: 'bold' }}
              >
                {isSubmitting ? <CircularProgress size={24} /> : `Resubmit Claim (v${(claim.version || 1) + 1})`}
              </Button>
            </Box>
          </Box>
        )}

        {claim.status === 'DRAFT' && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'warning.light', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
            <Typography variant="body1">
              This claim is currently a DRAFT. It will not be reviewed until you submit it.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Confirm & Submit Claim'}
            </Button>
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">Activity Category</Typography>
            <Typography variant="body1" fontWeight="medium">
              {claim.activityOption?.item?.head?.group?.code || ''} - {claim.activityOption?.item?.head?.name || 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Specific Activity</Typography>
            <Typography variant="body1" fontWeight="medium">
              {claim.activityOption?.label || 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Date</Typography>
            <Typography variant="body1" fontWeight="medium">
              {claim.activityDateFrom ? new Date(claim.activityDateFrom).toLocaleDateString() : 'N/A'} 
              {claim.activityDateTo ? ` - ${new Date(claim.activityDateTo).toLocaleDateString()}` : ''}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Points</Typography>
            <Typography variant="h6" color="primary" fontWeight="bold">
              {claim.claimedPoints} pts
            </Typography>
          </Box>
        </Box>

        {claim.description && (
          <Box sx={{ mb: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>Description</Typography>
            <Typography variant="body1">{claim.description}</Typography>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Evidence Attachments</Typography>
        {attachments.length > 0 ? (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {attachments.map(att => (
              <Paper key={att._id} variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 2 }}>
                <FileIcon color="action" />
                <Box>
                  <Typography variant="body2" fontWeight="medium">{att.originalFilename}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(att.sizeBytes / 1024).toFixed(1)} KB
                  </Typography>
                </Box>
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

      {/* Timeline Section */}
      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 2 }} elevation={2}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Status History</Typography>
        <Box sx={{ pl: 1 }}>
          {timeline.length > 0 ? timeline.map((event, index) => (
            <Box key={event._id || index} sx={{ display: 'flex', mb: 3, position: 'relative' }}>
              {index !== timeline.length - 1 && (
                <Box sx={{ position: 'absolute', left: '11px', top: '24px', bottom: '-24px', width: '2px', bgcolor: 'grey.300' }} />
              )}
              <Box sx={{ 
                width: 24, height: 24, borderRadius: '50%', 
                bgcolor: STATUS_COLORS[event.toStatus] || 'primary.main', 
                mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', zIndex: 1
              }}>
                <CheckCircleIcon sx={{ fontSize: 16 }} />
              </Box>
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  {event.toStatus.replace('_', ' ')}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {new Date(event.createdAt).toLocaleString()} 
                  {event.actor?.fullName && ` • by ${event.actor.fullName}`}
                </Typography>
                {event.remarks && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {event.remarks}
                  </Typography>
                )}
              </Box>
            </Box>
          )) : (
            <Typography variant="body2" color="text.secondary">No history available.</Typography>
          )}
        </Box>
      </Paper>

      {/* Attachment Viewer Dialog */}
      <Dialog 
        open={viewerOpen} 
        onClose={() => setViewerOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Document Preview
          <IconButton onClick={() => setViewerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ minHeight: 400, p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: 'grey.100' }}>
          {viewerType.startsWith('image/') ? (
            <img src={viewerUrl} alt="Evidence" style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }} />
          ) : viewerType === 'application/pdf' ? (
            <iframe src={viewerUrl} title="PDF Viewer" width="100%" height="600px" style={{ border: 'none' }} />
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography gutterBottom>Cannot preview this file type directly ({viewerType}).</Typography>
              <Button variant="contained" href={viewerUrl} target="_blank" download>
                Download File
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ClaimDetail;
