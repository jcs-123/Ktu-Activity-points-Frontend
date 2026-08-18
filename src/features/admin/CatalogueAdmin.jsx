import React, { useState } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button,
  Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Accordion, AccordionSummary, AccordionDetails, Divider
} from '@mui/material';
import {
  Folder, Category, Extension, Edit, Add, ExpandMore, Check, Settings
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import {
  useGetGroupsQuery,
  useGetHeadsByGroupQuery,
  useGetItemsByHeadQuery,
  useGetOptionsByItemQuery,
  catalogueApi
} from '../../api/catalogueApi';
import {
  useUpdateHeadMutation,
  useUpdateItemMutation,
  useUpdateOptionMutation
} from '../../api/adminApi';

const CatalogueAdmin = () => {
  const dispatch = useDispatch();
  const { data: groupsData, isLoading: isLoadingGroups } = useGetGroupsQuery();
  const groups = Array.isArray(groupsData) ? groupsData : (groupsData?.data || []);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedHead, setSelectedHead] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Edit dialog state
  const [editHeadModal, setEditHeadModal] = useState(null); // head obj
  const [editItemModal, setEditItemModal] = useState(null); // item obj
  const [editOptionModal, setEditOptionModal] = useState(null); // option obj

  const [updateHead, { isLoading: isUpdatingHead }] = useUpdateHeadMutation();
  const [updateItem, { isLoading: isUpdatingItem }] = useUpdateItemMutation();
  const [updateOption, { isLoading: isUpdatingOption }] = useUpdateOptionMutation();

  const handleSaveHead = async () => {
    try {
      await updateHead({
        id: editHeadModal._id,
        name: editHeadModal.name,
        maxPoints: Number(editHeadModal.maxPoints),
        itemRangeLabel: editHeadModal.itemRangeLabel,
      }).unwrap();
      dispatch(catalogueApi.util.invalidateTags(['Catalogue']));
      setEditHeadModal(null);
    } catch (err) {
      console.error('Update head failed:', err);
    }
  };

  const handleSaveItem = async () => {
    try {
      await updateItem({
        id: editItemModal._id,
        title: editItemModal.title,
        evidenceText: editItemModal.evidenceText,
        remarks: editItemModal.remarks,
      }).unwrap();
      dispatch(catalogueApi.util.invalidateTags(['Catalogue']));
      setEditItemModal(null);
    } catch (err) {
      console.error('Update item failed:', err);
    }
  };

  const handleSaveOption = async () => {
    try {
      await updateOption({
        id: editOptionModal._id,
        label: editOptionModal.label,
        points: Number(editOptionModal.points),
      }).unwrap();
      dispatch(catalogueApi.util.invalidateTags(['Catalogue']));
      setEditOptionModal(null);
    } catch (err) {
      console.error('Update option failed:', err);
    }
  };

  if (isLoadingGroups) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      {/* Page Title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#1F3864">
          Activity Catalogue Administration
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View and configure KTU 2024 Scheme activity groups, category caps, evidence guidelines, and claimable option point values.
        </Typography>
      </Box>

      {/* Main Grid — Groups & Heads */}
      <Grid container spacing={3}>
        {groups.map((group) => (
          <Grid item xs={12} key={group._id}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Folder color="primary" sx={{ fontSize: 28 }} />
                <Typography variant="h6" fontWeight={700}>
                  Group {group.code} — {group.name}
                </Typography>
              </Box>

              {/* Heads list component */}
              <HeadsAccordionGroup
                groupId={group._id}
                onEditHead={(head) => setEditHeadModal(head)}
                onEditItem={(item) => setEditItemModal(item)}
                onEditOption={(option) => setEditOptionModal(option)}
              />
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Edit Head Modal */}
      <Dialog open={Boolean(editHeadModal)} onClose={() => setEditHeadModal(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Category Cap (Activity Head)</DialogTitle>
        <DialogContent dividers>
          {editHeadModal && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Category Code"
                value={editHeadModal.code}
                disabled
                fullWidth
              />
              <TextField
                label="Category Name"
                value={editHeadModal.name}
                onChange={(e) => setEditHeadModal({ ...editHeadModal, name: e.target.value })}
                fullWidth
              />
              <TextField
                label="Maximum Point Cap (max_points)"
                type="number"
                value={editHeadModal.maxPoints}
                onChange={(e) => setEditHeadModal({ ...editHeadModal, maxPoints: e.target.value })}
                fullWidth
                helperText="Maximum points a student can count under this category (BR-06)"
              />
              <TextField
                label="Item Range Label"
                value={editHeadModal.itemRangeLabel || ''}
                onChange={(e) => setEditHeadModal({ ...editHeadModal, itemRangeLabel: e.target.value })}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditHeadModal(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveHead} disabled={isUpdatingHead}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Item Modal */}
      <Dialog open={Boolean(editItemModal)} onClose={() => setEditItemModal(null)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Activity Handbook Item</DialogTitle>
        <DialogContent dividers>
          {editItemModal && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Item Code"
                value={editItemModal.code}
                disabled
                fullWidth
              />
              <TextField
                label="Item Title"
                value={editItemModal.title}
                onChange={(e) => setEditItemModal({ ...editItemModal, title: e.target.value })}
                fullWidth
              />
              <TextField
                label="Handbook Evidence Requirement Text"
                value={editItemModal.evidenceText || ''}
                onChange={(e) => setEditItemModal({ ...editItemModal, evidenceText: e.target.value })}
                multiline
                rows={3}
                fullWidth
                helperText="Displayed to students on upload step so they know which proof to attach (FR-B-04)"
              />
              <TextField
                label="Handbook Remarks"
                value={editItemModal.remarks || ''}
                onChange={(e) => setEditItemModal({ ...editItemModal, remarks: e.target.value })}
                multiline
                rows={2}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditItemModal(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveItem} disabled={isUpdatingItem}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Option Modal */}
      <Dialog open={Boolean(editOptionModal)} onClose={() => setEditOptionModal(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Claimable Activity Option</DialogTitle>
        <DialogContent dividers>
          {editOptionModal && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Option Label"
                value={editOptionModal.label}
                onChange={(e) => setEditOptionModal({ ...editOptionModal, label: e.target.value })}
                fullWidth
              />
              <TextField
                label="Points Awarded"
                type="number"
                value={editOptionModal.points}
                onChange={(e) => setEditOptionModal({ ...editOptionModal, points: e.target.value })}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOptionModal(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveOption} disabled={isUpdatingOption}>
            Save Option
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Component to render heads for a group
const HeadsAccordionGroup = ({ groupId, onEditHead, onEditItem, onEditOption }) => {
  const { data: headsData, isLoading } = useGetHeadsByGroupQuery(groupId);
  const heads = Array.isArray(headsData) ? headsData : (headsData?.data || []);

  if (isLoading) return <CircularProgress size={24} sx={{ my: 1 }} />;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {heads.map((head) => (
        <Accordion key={head._id} variant="outlined">
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Category color="action" fontSize="small" />
                <Typography fontWeight={600}>{head.code} — {head.name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={`Max Cap: ${head.maxPoints} pts`} size="small" color="primary" variant="outlined" />
                <IconButton component="span" size="small" onClick={(e) => { e.stopPropagation(); onEditHead(head); }}>
                  <Edit fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <ItemsGroup headId={head._id} onEditItem={onEditItem} onEditOption={onEditOption} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

// Component to render items for a head
const ItemsGroup = ({ headId, onEditItem, onEditOption }) => {
  const { data: itemsData, isLoading } = useGetItemsByHeadQuery(headId);
  const items = Array.isArray(itemsData) ? itemsData : (itemsData?.data || []);

  if (isLoading) return <CircularProgress size={20} sx={{ my: 1 }} />;

  return (
    <Box sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      {items.map((item) => (
        <Paper key={item._id} variant="outlined" sx={{ p: 2, bgcolor: '#F8FAFC' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Extension fontSize="small" color="secondary" />
              <Typography variant="subtitle2" fontWeight={700}>{item.code} — {item.title}</Typography>
            </Box>
            <IconButton size="small" onClick={() => onEditItem(item)}>
              <Edit fontSize="small" />
            </IconButton>
          </Box>

          {item.evidenceText && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              <strong>Evidence Requirement:</strong> {item.evidenceText}
            </Typography>
          )}

          <OptionsList itemId={item._id} onEditOption={onEditOption} />
        </Paper>
      ))}
    </Box>
  );
};

// Component to render options for an item
const OptionsList = ({ itemId, onEditOption }) => {
  const { data: optionsData, isLoading } = useGetOptionsByItemQuery(itemId);
  const options = Array.isArray(optionsData) ? optionsData : (optionsData?.data || []);

  if (isLoading) return <CircularProgress size={16} sx={{ my: 0.5 }} />;

  return (
    <List dense sx={{ bgcolor: '#fff', borderRadius: 1, border: '1px solid #E2E8F0', p: 0 }}>
      {options.map((option) => (
        <ListItem key={option._id} divider sx={{ py: 0.5 }}>
          <ListItemText
            primary={<Typography sx={{ fontSize: '0.82rem', fontWeight: 500 }}>{option.label}</Typography>}
            secondary={option.level ? `Level: ${option.level}` : null}
          />
          <Chip label={`${option.points} pts`} size="small" color="secondary" sx={{ mr: 1, fontWeight: 700 }} />
          <IconButton size="small" onClick={() => onEditOption(option)}>
            <Edit fontSize="small" />
          </IconButton>
        </ListItem>
      ))}
    </List>
  );
};

export default CatalogueAdmin;
