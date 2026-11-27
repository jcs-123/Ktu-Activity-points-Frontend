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
import StarsIcon from '@mui/icons-material/Stars';
import { setCatalogueItem } from '../claimWizardSlice';
import {
  useGetGroupsQuery,
  useGetHeadsByGroupQuery,
  useGetItemsByHeadQuery,
  useGetOptionsByItemQuery,
} from '../../../api/catalogueApi';

// Official KTU 2024 Maximum Points Cap by Item Code (Table 2 Regulations)
const ITEM_MAX_POINTS = {
  // Group I (1.1 - 1.24)
  '1.1': 40,  // Sports/Games/Arts (Participation) - Max 40
  '1.2': 40,  // Sports/Games/Arts Winners Single - Max 40
  '1.3': 40,  // Sports/Games/Arts Winners Group - Max 40
  '1.4': 20,  // Publication in College Magazine - Max 20 (5 pts/yr)
  '1.5': 5,   // Four-Wheeler Driving License - Max 5
  '1.6': 10,  // Community Service 2 Days - Max 10
  '1.7': 10,  // Community Service 1 Week - Max 10
  '1.8': 10,  // Blood Donation - Max 10 (5 pts/donation)
  '1.9': 20,  // THRIVE Project - Max 20 (10 pts/sem)
  '1.10': 5,  // Tree Planting - Max 5
  '1.11': 30, // NSS Volunteer 2 years - Max 30
  '1.12': 20, // Leadership Camp 100 hrs - Max 20
  '1.13': 15, // State Level NSS Festival - Max 15
  '1.14': 15, // Special Service NSS/NCC - Max 15
  '1.15': 25, // State/National Awards - Max 25
  '1.16': 15, // National Camps - Max 15
  '1.17': 15, // 10 Days Volunteer 50 hrs - Max 15
  '1.18': 25, // RDC / IDC / International - Max 25
  '1.19': 40, // NCC Certificates - Max 40 (across NSS/NCC)
  '1.20': 10, // First Aid / Fire Safety - Max 10 (5 pts/training)
  '1.21': 10, // Swimming Certification - Max 10
  '1.22': 30, // College / University Union - Max 30
  '1.23': 10, // Magazine Editorial Board - Max 10 (5 pts/yr)
  '1.24': 10, // Hobby Clubs - Max 10 (5 pts/yr)

  // Group II (2.1 - 2.22)
  '2.1': 40,  // Tech-Fest Participation - Max 40
  '2.2': 40,  // Tech-Fest Winners - Max 40
  '2.3': 40,  // Professional Society Participation - Max 40
  '2.4': 40,  // Professional Society Winners - Max 40
  '2.5': 15,  // Conferences/Workshops IIT/NIT - Max 15
  '2.6': 15,  // Poster Presentation - Max 15
  '2.7': 40,  // Paper Presentation IIT/NIT - Max 40
  '2.8': 40,  // Paper Presentation Winners - Max 40
  '2.9': 20,  // Paper Presentation Affiliated - Max 20
  '2.10': 20, // Paper Presentation Affiliated Winners - Max 20
  '2.11': 15, // Professional Society Membership - Max 15
  '2.12': 10, // Dept Student Association - Max 10
  '2.13': 10, // Class Representative - Max 10 (5 pts/yr)
  '2.14': 5,  // IV Coordinator - Max 5
  '2.15': 10, // Placement Cell - Max 10
  '2.16': 10, // IEDC Cell - Max 10
  '2.17': 10, // YIP Coordinator - Max 10
  '2.18': 20, // STRIDE - Max 20 (40 for project)
  '2.19': 20, // ICFOSS / FOSS Club - Max 20
  '2.20': 10, // Short-Term Internship - Max 10
  '2.21': 30, // English Proficiency (TOEFL/IELTS/PTE/BEC) - Max 30
  '2.22': 30, // Aptitude Proficiency (GRE/GATE/CAT/GMAT) - Max 30

  // Group III (3.1 - 3.17)
  '3.1': 20,  // IV Report - Max 20
  '3.2': 10,  // Best Project/Seminar - Max 10
  '3.3': 15,  // Long-Term Internship - Max 15
  '3.4': 30,  // LEAP IIT Madras - Max 30
  '3.5': 35,  // YIP (K-DISC) - Max 35
  '3.6': 35,  // STRIDE - Max 35
  '3.7': 35,  // GDC AI Workforce - Max 35
  '3.8': 25,  // ICFOSS Solution - Max 25
  '3.9': 40,  // Startup Registered - Max 40
  '3.10': 40, // Patents - Max 40
  '3.11': 40, // Prototype / Tech Adopted - Max 40
  '3.12': 40, // Venture Capital - Max 40
  '3.13': 40, // Societal Innovations - Max 40
  '3.14': 40, // Research Publications - Max 40
  '3.15': 40, // National Hackathons - Max 40
  '3.16': 40, // International Hackathons - Max 40
  '3.17': 40, // Skilling Courses - Max 40 (1 pt/hr)
};

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
    const chosenItemId = e.target.value;
    setItemId(chosenItemId);
    setOptionId('');

    // Pre-populate preliminary info from the selected item
    const selectedItm = items?.find((i) => i._id === chosenItemId);
    const selectedHead = heads?.find((h) => h._id === headId);
    const selectedGroup = groups?.find((g) => g._id === groupId);

    if (selectedItm) {
      const itemMax = selectedItm.maxPoints || ITEM_MAX_POINTS[selectedItm.code] || selectedHead?.maxPoints || 40;
      dispatch(
        setCatalogueItem({
          groupId,
          groupCode: selectedGroup?.code,
          groupName: selectedGroup?.name,
          headId,
          headCode: selectedHead?.code,
          headName: selectedHead?.name,
          headMaxPoints: selectedHead?.maxPoints,
          itemId: chosenItemId,
          itemCode: selectedItm.code,
          itemTitle: selectedItm.title,
          itemMaxPoints: itemMax,
          evidenceText: selectedItm.evidenceText,
          remarks: selectedItm.remarks,
          isLevelScaled: selectedItm.isLevelScaled,
          requiresQuantity: selectedItm.requiresQuantity,
          quantityLabel: selectedItm.quantityLabel,
          optionId: null,
          title: selectedItm.title || selectedItm.name,
          maxPoints: itemMax,
          points: null,
          pointsPerUnit: null,
        })
      );
    }
  };

  const handleOptionChange = (e) => {
    const val = e.target.value;
    setOptionId(val);
    const selectedOpt = options?.find((o) => o._id === val);
    const selectedItm = items?.find((i) => i._id === itemId);
    const selectedHead = heads?.find((h) => h._id === headId);
    const selectedGroup = groups?.find((g) => g._id === groupId);

    if (selectedOpt && selectedItm) {
      const itemMax = selectedItm.maxPoints || ITEM_MAX_POINTS[selectedItm.code] || selectedHead?.maxPoints || 40;
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
          itemMaxPoints: itemMax,
          evidenceText: selectedItm.evidenceText,
          remarks: selectedItm.remarks,
          isLevelScaled: selectedItm.isLevelScaled,
          requiresQuantity: selectedItm.requiresQuantity,
          quantityLabel: selectedItm.quantityLabel,
          optionId: val,
          title: selectedOpt.label || selectedOpt.name,
          level: selectedOpt.level,
          points: selectedOpt.points,
          maxPoints: itemMax,
          pointsPerUnit: isPerUnit ? selectedOpt.points : null,
          unitLabel: selectedOpt.unit || selectedOpt.unitLabel,
        })
      );
    }
  };

  // Auto-select single option if the sub-activity category has only 1 option (e.g. 1.4 Magazine, 1.5 DL, 1.8 Blood, 1.11 NSS)
  useEffect(() => {
    if (itemId && options && options.length === 1 && !optionId) {
      const singleOpt = options[0];
      setOptionId(singleOpt._id);
      const selectedItm = items?.find((i) => i._id === itemId);
      const selectedHead = heads?.find((h) => h._id === headId);
      const selectedGroup = groups?.find((g) => g._id === groupId);

      if (singleOpt && selectedItm) {
        const itemMax = selectedItm.maxPoints || ITEM_MAX_POINTS[selectedItm.code] || selectedHead?.maxPoints || 40;
        const isPerUnit = singleOpt.unit === 'per hour' || selectedItm.requiresQuantity;
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
            itemMaxPoints: itemMax,
            evidenceText: selectedItm.evidenceText,
            remarks: selectedItm.remarks,
            isLevelScaled: selectedItm.isLevelScaled,
            requiresQuantity: selectedItm.requiresQuantity,
            quantityLabel: selectedItm.quantityLabel,
            optionId: singleOpt._id,
            title: singleOpt.label || singleOpt.name,
            level: singleOpt.level,
            points: singleOpt.points,
            maxPoints: itemMax,
            pointsPerUnit: isPerUnit ? singleOpt.points : null,
            unitLabel: singleOpt.unit || singleOpt.unitLabel,
          })
        );
      }
    }
  }, [options, itemId, optionId, items, heads, groups, groupId, headId, dispatch]);

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
  const itemCap = currentSelectedItem ? (currentSelectedItem.maxPoints || ITEM_MAX_POINTS[currentSelectedItem.code] || 40) : null;

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
                    sx={{ ml: 1, height: 22, fontSize: '0.75rem', flexShrink: 0 }}
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* 3. Sub-Activity Item with Maximum Points Displayed */}
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
            {items?.map((item) => {
              const maxPts = item.maxPoints || ITEM_MAX_POINTS[item.code] || 40;
              return (
                <MenuItem key={item._id} value={item._id} sx={{ whiteSpace: 'normal', py: 1.2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ pr: 1.5 }}>
                      <strong>{item.code}</strong> — {item.title || item.name}
                    </Typography>
                    <Chip
                      size="small"
                      color="primary"
                      variant="outlined"
                      label={`Max: ${maxPts} pts`}
                      sx={{
                        ml: 'auto',
                        height: 22,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        borderColor: '#1976d2',
                        color: '#1565c0',
                        bgcolor: 'rgba(25, 118, 210, 0.05)',
                      }}
                    />
                  </Box>
                </MenuItem>
              );
            })}
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
                    sx={{ ml: 1, height: 22, fontWeight: 'bold', flexShrink: 0 }}
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Detailed Activity & Proof Summary Card (Shows immediately when Sub-Activity Category is chosen) */}
      {currentSelectedItem && (
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
              {currentSelectedItem.code} — {selectedItem?.title || currentSelectedItem.title}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {/* Prominent Maximum Points Cap for this Sub-Activity */}
            <Chip
              icon={<StarsIcon sx={{ fontSize: '16px !important' }} />}
              size="small"
              color="primary"
              label={`Maximum Points: ${itemCap} Points`}
              sx={{ fontWeight: 'bold' }}
            />

            {/* If a specific level/option points value is selected */}
            {selectedItem?.points !== null && selectedItem?.points !== undefined && (
              <Chip
                size="small"
                color="success"
                label={`Assigned: ${selectedItem.points} ${selectedItem.unitLabel || 'points'}`}
                sx={{ fontWeight: 'bold' }}
              />
            )}

            {currentSelectedHead && (
              <Chip
                size="small"
                variant="outlined"
                label={`Head Cap: ${currentSelectedHead.maxPoints} Pts (${currentSelectedHead.name})`}
              />
            )}

            {selectedItem?.level && (
              <Chip size="small" color="secondary" label={`Level: ${selectedItem.level}`} />
            )}
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {currentSelectedItem.evidenceText && (
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <DescriptionIcon sx={{ fontSize: 16 }} /> Required Documentary Proof:
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.primary', pl: 0.5 }}>
                {currentSelectedItem.evidenceText}
              </Typography>
            </Box>
          )}

          {currentSelectedItem.remarks && (
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
