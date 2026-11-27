import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Paper,
  Chip,
  Alert,
  Divider,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import DescriptionIcon from '@mui/icons-material/Description';
import { setCatalogueItem } from '../claimWizardSlice';
import {
  useGetGroupsQuery,
  useGetHeadsByGroupQuery,
  useGetItemsByHeadQuery,
  useGetOptionsByItemQuery,
} from '../../../api/catalogueApi';

const SelectCatalogueStep = () => {
  const dispatch = useDispatch();
  const selectedItem = useSelector((state) => state.claimWizard.catalogueItem);

  const [groupId, setGroupId] = useState('');
  const [headId, setHeadId] = useState('');
  const [itemId, setItemId] = useState('');
  const [optionId, setOptionId] = useState('');

  const { data: groups, isLoading: isLoadingGroups } = useGetGroupsQuery();
  const { data: heads, isLoading: isLoadingHeads, isFetching: isFetchingHeads } = useGetHeadsByGroupQuery(groupId, { skip: !groupId });
  const { data: items, isLoading: isLoadingItems, isFetching: isFetchingItems } = useGetItemsByHeadQuery(headId, { skip: !headId });
  const { data: options, isLoading: isLoadingOptions, isFetching: isFetchingOptions } = useGetOptionsByItemQuery(itemId, { skip: !itemId });

  // Initialize from Redux state if editing previous step
  useEffect(() => {
    if (selectedItem) {
      if (selectedItem.groupId) setGroupId(selectedItem.groupId);
      if (selectedItem.headId) setHeadId(selectedItem.headId);
      if (selectedItem.itemId) setItemId(selectedItem.itemId);
      if (selectedItem.optionId) setOptionId(selectedItem.optionId);
    }
  }, [selectedItem]);

  const handleGroupChange = (e) => {
    setGroupId(e.target.value);
    setHeadId('');
    setItemId('');
    setOptionId('');
    dispatch(setCatalogueItem(null));
  };

  const handleHeadChange = (e) => {
    setHeadId(e.target.value);
    setItemId('');
    setOptionId('');
    dispatch(setCatalogueItem(null));
  };

  const handleItemChange = (e) => {
    setItemId(e.target.value);
    setOptionId('');
    dispatch(setCatalogueItem(null));
  };

  const handleOptionChange = (e) => {
    const val = e.target.value;
    setOptionId(val);
    const selectedOpt = options?.find((o) => o._id === val);
    const selectedItm = items?.find((i) => i._id === itemId);
    const selectedHead = heads?.find((h) => h._id === headId);
    const selectedGroup = groups?.find((g) => g._id === groupId);

    if (selectedOpt && selectedItm) {
      const isPerUnit = selectedOpt.unit === 'per hour' || selectedItm.requiresQuantity;
      dispatch(
        setCatalogueItem({
          groupId,
          groupCode: selectedGroup?.code,
          groupName: selectedGroup?.name,
          headId,
          headCode: selectedHead?.code,
          headName: selectedHead?.name,
          headMaxPoints: selectedHead?.maxPoints,
          itemId,
          itemCode: selectedItm.code,
          itemTitle: selectedItm.title,
          evidenceText: selectedItm.evidenceText,
          remarks: selectedItm.remarks,
          isLevelScaled: selectedItm.isLevelScaled,
          requiresQuantity: selectedItm.requiresQuantity,
          quantityLabel: selectedItm.quantityLabel,
          optionId: val,
          title: selectedOpt.label || selectedOpt.name,
          level: selectedOpt.level,
          points: selectedOpt.points,
          maxPoints: selectedOpt.points ?? selectedOpt.maxPoints,
          pointsPerUnit: isPerUnit ? selectedOpt.points : null,
          unitLabel: selectedOpt.unit || selectedOpt.unitLabel,
        })
      );
    }
  };

  // If item has options but they are empty, the item itself is the target
  useEffect(() => {
    if (itemId && options && options.length === 0) {
      const selectedItm = items?.find((i) => i._id === itemId);
      const selectedHead = heads?.find((h) => h._id === headId);
      const selectedGroup = groups?.find((g) => g._id === groupId);

      if (selectedItm) {
        dispatch(
          setCatalogueItem({
            groupId,
            groupCode: selectedGroup?.code,
            groupName: selectedGroup?.name,
            headId,
            headCode: selectedHead?.code,
            headName: selectedHead?.name,
            headMaxPoints: selectedHead?.maxPoints,
            itemId,
            itemCode: selectedItm.code,
            itemTitle: selectedItm.title,
            evidenceText: selectedItm.evidenceText,
            remarks: selectedItm.remarks,
            isLevelScaled: selectedItm.isLevelScaled,
            requiresQuantity: selectedItm.requiresQuantity,
            quantityLabel: selectedItm.quantityLabel,
            optionId: null,
            title: selectedItm.title || selectedItm.name,
            maxPoints: selectedItm.maxPoints || 5,
            pointsPerUnit: null,
          })
        );
      }
    }
  }, [options, itemId, items, groupId, headId, heads, groups, dispatch]);

  if (isLoadingGroups) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const menuProps = {
    slotProps: {
      paper: {
        sx: { maxWidth: 'calc(100vw - 32px)' },
      },
    },
  };
  const selectSx = {
    '& .MuiSelect-select': { whiteSpace: 'normal' },
  };

  const currentSelectedItem = items?.find((i) => i._id === itemId);
  const currentSelectedHead = heads?.find((h) => h._id === headId);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5 }, width: '100%', maxWidth: 650, mx: 'auto', mt: { xs: 1, sm: 2 } }}>
      <Box>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Select Activity Category
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Browse and select activities according to the official KTU 2024 Scheme.
        </Typography>
      </Box>

      {/* 1. Activity Group */}
      <FormControl fullWidth size="medium">
        <InputLabel id="activity-group-label">1. Activity Group</InputLabel>
        <Select
          labelId="activity-group-label"
          value={groupId}
          label="1. Activity Group"
          onChange={handleGroupChange}
          MenuProps={menuProps}
          sx={selectSx}
        >
          {groups?.map((group) => (
            <MenuItem key={group._id} value={group._id} sx={{ whiteSpace: 'normal', py: 1.5 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  {group.name}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* 2. Major Head */}
      {groupId && (
        <FormControl fullWidth disabled={isFetchingHeads} size="medium">
          <InputLabel id="activity-head-label">2. Major Head of Activity</InputLabel>
          <Select
            labelId="activity-head-label"
            value={headId}
            label="2. Major Head of Activity"
            onChange={handleHeadChange}
            MenuProps={menuProps}
            sx={selectSx}
          >
            {heads?.map((head) => (
              <MenuItem key={head._id} value={head._id} sx={{ whiteSpace: 'normal', py: 1.2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight="600">
                    {head.name}
                  </Typography>
                  <Chip
                    size="small"
                    variant="outlined"
                    color="primary"
                    label={`Cap: ${head.maxPoints} pts (${head.itemRangeLabel || ''})`}
                    sx={{ ml: 1, height: 22, fontSize: '0.75rem' }}
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* 3. Sub-Activity Item */}
      {headId && (
        <FormControl fullWidth disabled={isFetchingItems} size="medium">
          <InputLabel id="activity-item-label">3. Sub-Activity Category</InputLabel>
          <Select
            labelId="activity-item-label"
            value={itemId}
            label="3. Sub-Activity Category"
            onChange={handleItemChange}
            MenuProps={menuProps}
            sx={selectSx}
          >
            {items?.map((item) => (
              <MenuItem key={item._id} value={item._id} sx={{ whiteSpace: 'normal', py: 1.2 }}>
                <Typography variant="body2">
                  <strong>{item.code}</strong> — {item.title || item.name}
                </Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* 4. Specific Option / Level */}
      {itemId && options && options.length > 0 && (
        <FormControl fullWidth disabled={isFetchingOptions} size="medium">
          <InputLabel id="activity-option-label">4. Specific Level / Tier Option</InputLabel>
          <Select
            labelId="activity-option-label"
            value={optionId}
            label="4. Specific Level / Tier Option"
            onChange={handleOptionChange}
            MenuProps={menuProps}
            sx={selectSx}
          >
            {options.map((opt) => (
              <MenuItem key={opt._id} value={opt._id} sx={{ whiteSpace: 'normal', py: 1.2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <Typography variant="body2">{opt.label || opt.name}</Typography>
                  <Chip
                    size="small"
                    color="success"
                    label={`${opt.points} ${opt.unit === 'per hour' ? 'pt/hr' : opt.unit === 'per donation' ? 'pt/donation' : 'pts'}`}
                    sx={{ ml: 1, height: 22, fontWeight: 'bold' }}
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Detailed Activity & Proof Summary Card */}
      {selectedItem && (
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            mt: 1,
            p: 2.5,
            bgcolor: 'rgba(33, 150, 243, 0.04)',
            borderColor: 'primary.light',
            borderRadius: 2.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <VerifiedIcon color="primary" />
            <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
              {selectedItem.itemCode ? `${selectedItem.itemCode} — ` : ''}{selectedItem.title}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip
              size="small"
              color="primary"
              label={`Points: ${selectedItem.points ?? selectedItem.maxPoints} ${selectedItem.unitLabel || 'points'}`}
            />
            {currentSelectedHead && (
              <Chip
                size="small"
                variant="outlined"
                label={`Category Cap: ${currentSelectedHead.maxPoints} Points`}
              />
            )}
            {selectedItem.level && (
              <Chip size="small" color="secondary" label={`Level: ${selectedItem.level}`} />
            )}
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {currentSelectedItem?.evidenceText && (
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <DescriptionIcon sx={{ fontSize: 16 }} /> Required Documentary Proof:
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.primary', pl: 0.5 }}>
                {currentSelectedItem.evidenceText}
              </Typography>
            </Box>
          )}

          {currentSelectedItem?.remarks && (
            <Alert severity="info" sx={{ py: 0.5, px: 1.5, fontSize: '0.85rem', borderRadius: 2 }}>
              <strong>KTU Guidelines:</strong> {currentSelectedItem.remarks}
            </Alert>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default SelectCatalogueStep;
