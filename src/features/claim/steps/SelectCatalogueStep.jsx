import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
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
      // Assuming selectedItem contains nested IDs for restoration
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
    // If the item has no options (or we don't know yet), we update state when options load
    dispatch(setCatalogueItem(null));
  };

  const handleOptionChange = (e) => {
    const val = e.target.value;
    setOptionId(val);
    const selectedOpt = options?.find(o => o._id === val);
    if (selectedOpt) {
      dispatch(setCatalogueItem({
        groupId,
        headId,
        itemId,
        optionId: val,
        title: selectedOpt.label || selectedOpt.name,
        maxPoints: selectedOpt.points ?? selectedOpt.maxPoints,
        pointsPerUnit: selectedOpt.pointsPerUnit,
        unitLabel: selectedOpt.unit || selectedOpt.unitLabel,
      }));
    }
  };

  // If item has options but they are empty, the item itself is the target
  useEffect(() => {
    if (itemId && options && options.length === 0) {
      const selectedItm = items?.find(i => i._id === itemId);
      if (selectedItm) {
        dispatch(setCatalogueItem({
          groupId,
          headId,
          itemId,
          optionId: null,
          title: selectedItm.title || selectedItm.name,
          maxPoints: selectedItm.maxPoints,
        }));
      }
    }
  }, [options, itemId, items, groupId, headId, dispatch]);

  if (isLoadingGroups) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 500, mx: 'auto', mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Select Activity Category
      </Typography>

      <FormControl fullWidth>
        <InputLabel>Activity Group</InputLabel>
        <Select value={groupId} label="Activity Group" onChange={handleGroupChange}>
          {groups?.map((group) => (
            <MenuItem key={group._id} value={group._id}>
              {group.code}: {group.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {groupId && (
        <FormControl fullWidth disabled={isFetchingHeads}>
          <InputLabel>Activity Head</InputLabel>
          <Select value={headId} label="Activity Head" onChange={handleHeadChange}>
            {heads?.map((head) => (
              <MenuItem key={head._id} value={head._id}>
                {head.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {headId && (
        <FormControl fullWidth disabled={isFetchingItems}>
          <InputLabel>Activity Item</InputLabel>
          <Select value={itemId} label="Activity Item" onChange={handleItemChange}>
            {items?.map((item) => (
              <MenuItem key={item._id} value={item._id}>
                {item.title || item.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {itemId && options && options.length > 0 && (
        <FormControl fullWidth disabled={isFetchingOptions}>
          <InputLabel>Specific Option / Level</InputLabel>
          <Select value={optionId} label="Specific Option / Level" onChange={handleOptionChange}>
            {options.map((opt) => (
              <MenuItem key={opt._id} value={opt._id}>
                {opt.label || opt.name} (Max: {opt.points ?? opt.maxPoints})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {selectedItem && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2 }}>
          <Typography variant="subtitle2" color="success.main">
            Selected: {selectedItem.title}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SelectCatalogueStep;
