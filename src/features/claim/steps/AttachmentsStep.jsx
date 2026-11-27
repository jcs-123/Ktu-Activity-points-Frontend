import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, List, ListItem, ListItemText, IconButton, Paper,
  CircularProgress, Alert, LinearProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useDropzone } from 'react-dropzone';
import { addAttachment, removeAttachment as removeAttachmentAction } from '../claimWizardSlice';
import { useUploadAttachmentMutation, useRemoveAttachmentMutation } from '../../../api/claimApi';

const AttachmentsStep = () => {
  const dispatch = useDispatch();
  const { attachments, claimId, catalogueItem } = useSelector((state) => state.claimWizard);
  const [errorMsg, setErrorMsg] = useState('');
  const [duplicateAlert, setDuplicateAlert] = useState(false);

  const [uploadAttachment, { isLoading: isUploading }] = useUploadAttachmentMutation();
  const [removeAttachment, { isLoading: isDeleting }] = useRemoveAttachmentMutation();

  const onDrop = useCallback(async (acceptedFiles) => {
    setErrorMsg('');
    setDuplicateAlert(false);

    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const result = await uploadAttachment({ id: claimId, formData }).unwrap();
        // The return object is { message, data: { _id, originalFilename, sizeBytes, mimeType, sha256 }, duplicateWarning }
        const attachmentData = {
          _id: result.data._id,
          name: result.data.originalFilename,
          size: result.data.sizeBytes,
          type: result.data.mimeType,
          sha256: result.data.sha256,
        };
        dispatch(addAttachment(attachmentData));
        if (result.duplicateWarning) {
          setDuplicateAlert(true);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg(err.data?.error?.message || `Failed to upload file ${file.name}.`);
      }
    }
  }, [claimId, uploadAttachment, dispatch]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 5,
    disabled: isUploading,
  });

  const handleRemove = async (index, attachmentId) => {
    setErrorMsg('');
    try {
      await removeAttachment({ id: claimId, attachmentId }).unwrap();
      dispatch(removeAttachmentAction(index));
    } catch (err) {
      console.error(err);
      setErrorMsg(err.data?.error?.message || 'Failed to delete attachment.');
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', mt: { xs: 1, sm: 2 } }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Upload Certificates / Proofs
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Please upload clear copies of your certificates or proof of participation.
        Allowed formats: PDF, JPG, PNG, HEIC (Max 5MB each, up to 5 files).
      </Typography>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      )}

      {duplicateAlert && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2, borderRadius: 2 }}>
          <strong>Duplicate Warning:</strong> One of your files matches an already uploaded certificate. A warning flag has been raised for the review staff.
        </Alert>
      )}

      {catalogueItem?.evidenceText && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            Required Documentary Proof (KTU 2024 Scheme):
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {catalogueItem.evidenceText}
          </Typography>
          {catalogueItem.remarks && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Note: {catalogueItem.remarks}
            </Typography>
          )}
        </Alert>
      )}

      <Paper
        {...getRootProps()}
        sx={{
          p: { xs: 2.5, sm: 4 },
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.400',
          bgcolor: isDragActive ? 'rgba(33, 150, 243, 0.05)' : 'background.paper',
          textAlign: 'center',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          mb: 3,
          transition: 'all 0.2s ease',
          opacity: isUploading ? 0.7 : 1,
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: { xs: 40, sm: 48 }, color: 'primary.main', mb: 1 }} />
        <Typography variant="body1" fontWeight="bold">
          {isDragActive
            ? "Drop the files here..."
            : "Drag 'n' drop files here, or click to select files"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          PDF, PNG, JPEG up to 5MB
        </Typography>
      </Paper>

      {isUploading && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 1 }}>
            Uploading file buffer securely to MinIO...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {attachments.length > 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Attached Evidence Files:
          </Typography>
          <List>
            {attachments.map((file, index) => (
              <ListItem
                key={file._id || index}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    disabled={isDeleting}
                    onClick={() => handleRemove(index, file._id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                }
                sx={{ bgcolor: 'action.hover', mb: 1, borderRadius: 2, pr: 6 }}
              >
                <ListItemText
                  sx={{ minWidth: 0 }}
                  primary={<Typography fontWeight="bold" sx={{ overflowWrap: 'anywhere' }}>{file.name}</Typography>}
                  secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default AttachmentsStep;
