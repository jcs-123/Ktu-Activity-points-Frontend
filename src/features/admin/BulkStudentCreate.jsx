import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box, Typography, Paper, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Alert, CircularProgress, IconButton,
  Grid, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Tooltip
} from '@mui/material';
import {
  Upload, Download, Delete, Add, CheckCircle, Error as ErrorIcon,
  PersonAdd, ContentPaste, School, ClearAll, Bolt, Edit as EditIcon
} from '@mui/icons-material';
import {
  adminApi,
  useGetClassesQuery,
  useCreateClassMutation,
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useGetBatchesQuery,
  useCreateBatchMutation,
} from '../../api/adminApi';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ktu-activity-points-backend-2.onrender.com/api/v1';

const SAMPLE_CSV = `username,email,mobile,passwordHash,fullName,userType,status
JEC25EC001,abdulhaleemps.ec25@jecc.ac.in,8848245356,1234,ABDUL HALEEM P S,Student,ACTIVE`;

const normalizeUserType = (val) => {
  const v = (val || 'STUDENT').toString().trim().toUpperCase();
  if (v === 'STUDENT' || v === 'STUDENTS') return 'STUDENT';
  if (v === 'FACULTY' || v === 'STAFF' || v === 'SFA' || v === 'HOD') return 'FACULTY';
  if (v === 'ADMIN' || v === 'ADMINISTRATOR') return 'ADMIN';
  return 'STUDENT';
};

const normalizeStatus = (val) => {
  const v = (val || 'ACTIVE').toString().trim().toUpperCase();
  if (['ACTIVE', 'INACTIVE', 'LOCKED', 'GRADUATED'].includes(v)) return v;
  return 'ACTIVE';
};

/**
 * Fast CSV / TSV parser supporting:
 * username, email, mobile, passwordHash, fullName, userType, status
 */
const parseBulkText = (rawText) => {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/);
  const parsedRows = [];

  let firstLineIdx = 0;
  while (firstLineIdx < lines.length && !lines[firstLineIdx].trim()) {
    firstLineIdx++;
  }
  if (firstLineIdx >= lines.length) return [];

  const firstLine = lines[firstLineIdx].trim();
  const delimiter = firstLine.includes('\t') ? '\t' : ',';

  const splitLine = (line) =>
    line.split(delimiter).map((cell) => cell.trim().replace(/^["']|["']$/g, ''));

  const firstTokens = splitLine(firstLine).map((h) => h.toLowerCase().replace(/[\s_-]/g, ''));

  const knownHeaders = [
    'username', 'admissionno', 'email', 'mobile', 'phone',
    'passwordhash', 'password', 'fullname', 'name', 'usertype', 'role', 'status'
  ];
  const hasHeader = firstTokens.some((t) => knownHeaders.includes(t));
  const startIdx = hasHeader ? firstLineIdx + 1 : firstLineIdx;

  for (let i = startIdx; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const cols = splitLine(rawLine);
    if (cols.length === 0 || cols.every((c) => !c)) continue;

    const rowObj = {
      username: '',
      email: '',
      mobile: '',
      passwordHash: '1234',
      fullName: '',
      userType: 'STUDENT',
      status: 'ACTIVE',
      category: 'REGULAR',
      admissionDate: '2025-08-01',
      gender: 'OTHER',
    };

    if (hasHeader) {
      for (let idx = 0; idx < firstTokens.length; idx++) {
        const header = firstTokens[idx];
        const val = cols[idx] ?? '';
        if (header === 'username' || header === 'admissionno' || header === 'userid') {
          rowObj.username = val;
        } else if (header === 'email' || header === 'emailaddress') {
          rowObj.email = val;
        } else if (header === 'mobile' || header === 'phone' || header === 'mobileno') {
          rowObj.mobile = val;
        } else if (header === 'passwordhash' || header === 'password' || header === 'pass') {
          rowObj.passwordHash = val || '1234';
        } else if (header === 'fullname' || header === 'name' || header === 'studentname') {
          rowObj.fullName = val;
        } else if (header === 'usertype' || header === 'role' || header === 'type') {
          rowObj.userType = normalizeUserType(val);
        } else if (header === 'status') {
          rowObj.status = normalizeStatus(val);
        } else if (header === 'category') {
          rowObj.category = (val || 'REGULAR').toUpperCase();
        } else if (header === 'admissiondate') {
          rowObj.admissionDate = val || '2025-08-01';
        } else if (header === 'gender') {
          rowObj.gender = (val || 'OTHER').toUpperCase();
        }
      }
    } else {
      rowObj.username = cols[0] || '';
      rowObj.email = cols[1] || '';
      rowObj.mobile = cols[2] || '';
      rowObj.passwordHash = cols[3] || '1234';
      rowObj.fullName = cols[4] || '';
      rowObj.userType = normalizeUserType(cols[5] || 'Student');
      rowObj.status = normalizeStatus(cols[6] || 'ACTIVE');
    }

    parsedRows.push({
      id: `r-${i}`,
      ...rowObj,
      importStatus: 'READY', // READY | PROCESSING | CREATED | UPDATED | ERROR
      importMessage: '',
    });
  }

  return parsedRows;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Shared rate-limit pause gate across concurrent workers
let rateLimitWaitUntil = 0;

/**
 * Direct fast API helper with automatic 429 ("Too many requests") retry & rate-limit protection.
 * Never fails due to 429 rate limits — automatically waits for the window reset and continues.
 */
const apiRequest = async (path, method, body, onRateLimitWait) => {
  const maxRetries = 10;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // If another request triggered a rate-limit pause, wait until it clears
    const now = Date.now();
    if (rateLimitWaitUntil > now) {
      const waitMs = rateLimitWaitUntil - now;
      if (onRateLimitWait) onRateLimitWait(Math.ceil(waitMs / 1000));
      await sleep(waitMs);
    }

    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/admin${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });

    // Proactively check if RateLimit-Remaining is about to hit 0
    const remaining = res.headers.get('ratelimit-remaining');
    const resetSec = parseInt(res.headers.get('ratelimit-reset') || '10', 10);
    if (remaining !== null && parseInt(remaining, 10) <= 1) {
      const pauseMs = Math.min(Math.max(resetSec, 5), 60) * 1000;
      rateLimitWaitUntil = Math.max(rateLimitWaitUntil, Date.now() + pauseMs);
    }

    // If 429 Too Many Requests, pause and auto-retry instead of failing
    if (res.status === 429 && attempt < maxRetries) {
      const retryAfter = parseInt(res.headers.get('retry-after') || res.headers.get('ratelimit-reset') || '12', 10);
      const waitSec = Math.min(Math.max(retryAfter, 8), 60);
      rateLimitWaitUntil = Math.max(rateLimitWaitUntil, Date.now() + waitSec * 1000);
      if (onRateLimitWait) onRateLimitWait(waitSec);
      await sleep(waitSec * 1000);
      if (onRateLimitWait) onRateLimitWait(0);
      continue;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data?.error?.message || data?.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    if (onRateLimitWait) onRateLimitWait(0);
    return data;
  }
};

const BulkStudentCreate = ({ embedded = false }) => {
  const dispatch = useDispatch();
  const [rawCsv, setRawCsv] = useState('');
  const [rows, setRows] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [showAllRows, setShowAllRows] = useState(false);
  const [rateLimitWaitSec, setRateLimitWaitSec] = useState(0);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [defaultCategory, setDefaultCategory] = useState('REGULAR');
  const [defaultAdmissionDate, setDefaultAdmissionDate] = useState('2025-08-01');
  const [defaultGender, setDefaultGender] = useState('OTHER');
  const [fileName, setFileName] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, created: 0, updated: 0, failed: 0 });

  // Quick Create Class Dialog State
  const [openClassDialog, setOpenClassDialog] = useState(false);
  const [classFormError, setClassFormError] = useState('');
  const [newClassData, setNewClassData] = useState({
    name: 'EC 2025 A',
    departmentName: 'Electronics & Communication Engineering',
    departmentCode: 'EC',
    batchName: '2025-2029',
    startYear: 2025,
    endYear: 2029,
    section: 'A',
  });

  const { data: classesData, isLoading: isLoadingClasses, refetch: refetchClasses } = useGetClassesQuery();
  const { data: departmentsData } = useGetDepartmentsQuery(undefined, { skip: !openClassDialog });
  const { data: batchesData } = useGetBatchesQuery(undefined, { skip: !openClassDialog });

  const [createClass, { isLoading: isCreatingClass }] = useCreateClassMutation();
  const [createDepartment] = useCreateDepartmentMutation();
  const [createBatch] = useCreateBatchMutation();

  const classes = useMemo(() => classesData?.data || [], [classesData]);
  const departments = departmentsData?.data || [];
  const batches = batchesData?.data || [];

  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0]._id);
    }
  }, [classes, selectedClassId]);

  const handleLoadSample = () => {
    setRawCsv(SAMPLE_CSV);
    setFileName('sample_student_logins.csv');
    setRows(parseBulkText(SAMPLE_CSV));
    setGlobalError('');
  };

  const handleDownloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_student_login_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * 1-Request Bulk Import + Parallel Worker Fallback with Auto 429 Rate-Limit Protection
   */
  const executeFastBulkCreate = async (targetRows, useSingleRequestEndpoint = false) => {
    const list = targetRows || rowsRef.current;
    setGlobalError('');

    if (!list || list.length === 0) {
      setGlobalError('No student rows to process. Upload a CSV or paste rows first.');
      return;
    }

    const hasStudents = list.some((r) => normalizeUserType(r.userType) === 'STUDENT');
    if (hasStudents && !selectedClassId) {
      setGlobalError('Please select a Target Class first (or click "Quick Create Class").');
      return;
    }

    setIsProcessing(true);
    const total = list.length;

    const workingRows = list.map((r) => ({
      ...r,
      importStatus: 'PROCESSING',
      importMessage: 'Creating...',
    }));
    setRows([...workingRows]);
    setProgress({ current: 0, total, created: 0, updated: 0, failed: 0 });

    const selectedClassObj = classes.find((c) => c._id === selectedClassId);
    const selectedClassName = selectedClassObj?.name || '';

    // Strategy A: If 1-Request Instant Bulk Mode is used (or large batch > 30 rows),
    // send all rows in 1 SINGLE HTTP request to POST /admin/users/import first!
    // Sending 1 HTTP request for 100+ students completely avoids the 100 req/min rate limit!
    if (useSingleRequestEndpoint || total > 25) {
      try {
        const csvHeader = 'admissionno,username,fullname,email,mobile,passwordhash,usertype,status,category,admissiondate,gender,classname';
        const csvLines = list.map((r) => {
          const uname = (r.username || '').trim();
          const fname = (r.fullName || '').trim().replace(/,/g, ' ');
          const email = (r.email || '').trim().toLowerCase();
          const mobile = (r.mobile || '').toString().trim();
          const pass = (r.passwordHash || '1234').toString().trim();
          const utype = normalizeUserType(r.userType);
          const stat = normalizeStatus(r.status);
          const cat = r.category || defaultCategory;
          const adate = r.admissionDate || defaultAdmissionDate;
          const gen = r.gender || defaultGender;
          return `${uname},${uname},${fname},${email},${mobile},${pass},${utype},${stat},${cat},${adate},${gen},${selectedClassName}`;
        });

        const bulkCsvString = [csvHeader, ...csvLines].join('\n');
        const importRes = await apiRequest(
          '/users/import',
          'POST',
          { csvData: bulkCsvString, dryRun: false },
          setRateLimitWaitSec
        );

        const resultData = importRes?.data;
        if (resultData && typeof resultData.imported === 'number') {
          const failedMap = new Map();
          (resultData.failed || []).forEach((f) => {
            if (f.row) failedMap.set(f.row - 2, f.error || 'Failed');
            if (f.data?.admissionno) failedMap.set(f.data.admissionno.toLowerCase(), f.error || 'Failed');
          });

          let createdCount = 0;
          let failedCount = 0;

          const updatedRows = workingRows.map((r, idx) => {
            const errReason = failedMap.get(idx) || failedMap.get((r.username || '').trim().toLowerCase());
            if (errReason) {
              failedCount++;
              return { ...r, importStatus: 'ERROR', importMessage: errReason };
            }
            createdCount++;
            return { ...r, importStatus: 'CREATED', importMessage: 'Created in bulk' };
          });

          setRows(updatedRows);
          setProgress({
            current: total,
            total,
            created: createdCount,
            updated: 0,
            failed: failedCount,
          });
          setIsProcessing(false);
          setRateLimitWaitSec(0);
          dispatch(adminApi.util.invalidateTags(['AdminUsers']));
          return;
        }
      } catch {
        // Fall through to rate-limit-protected parallel worker pool if /users/import is unavailable
      }
    }

    // Strategy B: Rate-limit-protected parallel workers (6 concurrent workers + automatic 429 retry)
    let completed = 0;
    let createdCount = 0;
    let updatedCount = 0;
    let failedCount = 0;

    let cachedExistingUsers = null;
    let existingUsersPromise = null;
    const getExistingUserMap = async () => {
      if (cachedExistingUsers) return cachedExistingUsers;
      if (!existingUsersPromise) {
        existingUsersPromise = apiRequest('/users?limit=2000', 'GET', undefined, setRateLimitWaitSec)
          .then((res) => {
            const map = new Map();
            (res?.data || []).forEach((u) => {
              if (u.username) map.set(u.username.toLowerCase(), u);
              if (u.email) map.set(u.email.toLowerCase(), u);
            });
            cachedExistingUsers = map;
            return map;
          })
          .catch(() => new Map());
      }
      return existingUsersPromise;
    };

    let lastUiUpdate = 0;
    const flushUi = (force = false) => {
      const now = performance.now();
      if (force || now - lastUiUpdate > 120) {
        lastUiUpdate = now;
        setRows([...workingRows]);
        setProgress({
          current: completed,
          total,
          created: createdCount,
          updated: updatedCount,
          failed: failedCount,
        });
      }
    };

    const processSingleRow = async (index) => {
      const row = workingRows[index];
      const username = (row.username || '').trim();
      const email = (row.email || '').trim().toLowerCase();
      const mobile = (row.mobile || '').toString().trim();
      const password = (row.passwordHash || '1234').toString().trim();
      const fullName = (row.fullName || '').trim();
      const userType = normalizeUserType(row.userType);
      const status = normalizeStatus(row.status);

      if (!username || !email || !fullName || !password) {
        failedCount++;
        completed++;
        workingRows[index] = {
          ...row,
          importStatus: 'ERROR',
          importMessage: 'Missing username, email, fullName, or passwordHash',
        };
        flushUi();
        return;
      }

      try {
        const createRes = await apiRequest(
          '/users',
          'POST',
          {
            username,
            email,
            mobile,
            password,
            fullName,
            userType,
            status,
            classId: userType === 'STUDENT' ? selectedClassId : undefined,
            category: row.category || defaultCategory,
            admissionDate: row.admissionDate || defaultAdmissionDate,
            gender: row.gender || defaultGender,
          },
          setRateLimitWaitSec
        );

        if (status !== 'ACTIVE' && createRes?.data?._id) {
          await apiRequest(
            `/users/${createRes.data._id}`,
            'PATCH',
            {
              fullName,
              email,
              mobile,
              userType,
              status,
              classId: userType === 'STUDENT' ? selectedClassId : undefined,
              category: row.category || defaultCategory,
            },
            setRateLimitWaitSec
          );
        }

        createdCount++;
        completed++;
        workingRows[index] = {
          ...row,
          importStatus: 'CREATED',
          importMessage: 'Created',
        };
      } catch (err) {
        const errMsg = err?.message || 'Failed';
        const isConflict = err?.status === 409 || errMsg.toLowerCase().includes('already exists');

        if (isConflict) {
          try {
            const userMap = await getExistingUserMap();
            const matchUser = userMap.get(username.toLowerCase()) || userMap.get(email.toLowerCase());

            if (matchUser) {
              await apiRequest(
                `/users/${matchUser._id}`,
                'PATCH',
                {
                  fullName,
                  email,
                  mobile,
                  userType,
                  status,
                  password,
                  classId: userType === 'STUDENT' ? selectedClassId : undefined,
                  category: row.category || defaultCategory,
                },
                setRateLimitWaitSec
              );

              if (userType === 'STUDENT' && selectedClassId) {
                await apiRequest(
                  '/role-assignments',
                  'POST',
                  {
                    userId: matchUser._id,
                    role: 'STUDENT',
                    scopeType: 'CLASS',
                    scopeId: selectedClassId,
                  },
                  setRateLimitWaitSec
                ).catch(() => {});
              }

              updatedCount++;
              completed++;
              workingRows[index] = {
                ...row,
                importStatus: 'UPDATED',
                importMessage: 'Updated existing',
              };
            } else {
              failedCount++;
              completed++;
              workingRows[index] = {
                ...row,
                importStatus: 'ERROR',
                importMessage: 'Already exists',
              };
            }
          } catch (updateErr) {
            failedCount++;
            completed++;
            workingRows[index] = {
              ...row,
              importStatus: 'ERROR',
              importMessage: updateErr?.message || 'Update failed',
            };
          }
        } else {
          failedCount++;
          completed++;
          workingRows[index] = {
            ...row,
            importStatus: 'ERROR',
            importMessage: errMsg,
          };
        }
      }

      flushUi();
    };

    const CONCURRENCY = Math.min(6, total);
    let cursor = 0;
    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (cursor < total) {
        const currentIndex = cursor++;
        await processSingleRow(currentIndex);
      }
    });

    await Promise.all(workers);
    flushUi(true);
    setIsProcessing(false);
    setRateLimitWaitSec(0);
    dispatch(adminApi.util.invalidateTags(['AdminUsers']));
  };

  const handleFileUpload = (e, autoStart = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setGlobalError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result || '';
      setRawCsv(content);
      const parsed = parseBulkText(content);
      setRows(parsed);
      if (parsed.length === 0) {
        setGlobalError('Could not find any valid rows in the uploaded CSV file.');
      } else if (autoStart) {
        executeFastBulkCreate(parsed, parsed.length > 25);
      }
    };
    reader.onerror = () => {
      setGlobalError('Failed to read the CSV file.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleParseRawText = (autoStart = false) => {
    setGlobalError('');
    const parsed = parseBulkText(rawCsv);
    if (parsed.length === 0) {
      setGlobalError('Please paste valid CSV or tab-separated student rows first.');
      return;
    }
    setRows(parsed);
    if (autoStart) {
      executeFastBulkCreate(parsed, parsed.length > 25);
    }
  };

  const handleAddEmptyRow = () => {
    const newId = `r-${Date.now()}`;
    setRows((prev) => [
      {
        id: newId,
        username: '',
        email: '',
        mobile: '',
        passwordHash: '1234',
        fullName: '',
        userType: 'STUDENT',
        status: 'ACTIVE',
        category: defaultCategory,
        admissionDate: defaultAdmissionDate,
        gender: defaultGender,
        importStatus: 'READY',
        importMessage: '',
      },
      ...prev,
    ]);
    setEditingRowId(newId);
  };

  const handleRowChange = (id, field, value) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? { ...row, [field]: value, importStatus: 'READY', importMessage: '' }
          : row
      )
    );
  };

  const handleRemoveRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleQuickCreateClass = async () => {
    setClassFormError('');
    if (!newClassData.name || !newClassData.departmentCode || !newClassData.batchName) {
      setClassFormError('Class Name, Department Code, and Batch Name are required.');
      return;
    }
    try {
      let dept = departments.find(
        (d) => d.code?.toUpperCase() === newClassData.departmentCode.trim().toUpperCase()
      );
      if (!dept) {
        const deptRes = await createDepartment({
          name: newClassData.departmentName.trim(),
          code: newClassData.departmentCode.trim().toUpperCase(),
        }).unwrap();
        dept = deptRes.data;
      }

      let batch = batches.find((b) => b.name === newClassData.batchName.trim());
      if (!batch) {
        const batchRes = await createBatch({
          name: newClassData.batchName.trim(),
          startYear: Number(newClassData.startYear) || 2025,
          endYear: Number(newClassData.endYear) || 2029,
        }).unwrap();
        batch = batchRes.data;
      }

      const clsRes = await createClass({
        name: newClassData.name.trim(),
        departmentId: dept._id,
        batchId: batch._id,
        section: newClassData.section || 'A',
      }).unwrap();

      await refetchClasses();
      if (clsRes?.data?._id) {
        setSelectedClassId(clsRes.data._id);
      }
      setOpenClassDialog(false);
    } catch (err) {
      setClassFormError(
        err?.data?.error?.message || err?.data?.message || 'Failed to create class.'
      );
    }
  };

  const displayedRows = showAllRows ? rows : rows.slice(0, 100);

  return (
    <Box sx={{ p: embedded ? 0 : { xs: 2, md: 4 } }}>
      {!embedded && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonAdd sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Fast Bulk Student Login Creation
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Single-request & rate-limit-protected CSV upload (username, email, mobile, passwordHash, fullName, userType, status)
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleDownloadSampleCSV}
            >
              Download Sample CSV
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<ContentPaste />}
              onClick={handleLoadSample}
            >
              Load Sample Row (JEC25EC001)
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 1: Class & Student Role Configuration */}
      <Paper elevation={2} sx={{ p: 2.5, mb: 2.5, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <School color="primary" /> 1. Select Target Class for Students
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setOpenClassDialog(true)}
          >
            Quick Create Class (e.g. EC 2025)
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Target Class (Required for Student Login)</InputLabel>
              <Select
                value={selectedClassId}
                label="Target Class (Required for Student Login)"
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                {isLoadingClasses ? (
                  <MenuItem value="" disabled>
                    Loading classes...
                  </MenuItem>
                ) : classes.length === 0 ? (
                  <MenuItem value="" disabled>
                    No classes found — Click "Quick Create Class"
                  </MenuItem>
                ) : (
                  classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      {cls.name} {cls.department?.code ? `(${cls.department.code})` : ''}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Default Category</InputLabel>
              <Select
                value={defaultCategory}
                label="Default Category"
                onChange={(e) => setDefaultCategory(e.target.value)}
              >
                <MenuItem value="REGULAR">REGULAR (120 Pts)</MenuItem>
                <MenuItem value="LATERAL_ENTRY">LATERAL_ENTRY (90 Pts)</MenuItem>
                <MenuItem value="PWD">PWD (60 Pts)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Default Admission Date"
              InputLabelProps={{ shrink: true }}
              value={defaultAdmissionDate}
              onChange={(e) => setDefaultAdmissionDate(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Default Gender</InputLabel>
              <Select
                value={defaultGender}
                label="Default Gender"
                onChange={(e) => setDefaultGender(e.target.value)}
              >
                <MenuItem value="MALE">MALE</MenuItem>
                <MenuItem value="FEMALE">FEMALE</MenuItem>
                <MenuItem value="OTHER">OTHER</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Step 2: Fast Upload CSV or Paste Excel Data */}
      <Paper elevation={2} sx={{ p: 2.5, mb: 2.5, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Bolt color="warning" /> 2. Fast CSV Upload or Paste from Excel
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Download />}
              onClick={handleDownloadSampleCSV}
            >
              Sample CSV
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              startIcon={<ContentPaste />}
              onClick={handleLoadSample}
            >
              Load Sample (JEC25EC001)
            </Button>
          </Box>
        </Box>

        <Grid container spacing={2.5}>
          {/* CSV File Upload Box */}
          <Grid item xs={12} md={5}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: 'primary.main',
                borderRadius: 2,
                bgcolor: 'grey.50',
                gap: 1.2,
              }}
            >
              {/* Instant 1-Click Upload & Create */}
              <input
                accept=".csv,.txt,.tsv"
                style={{ display: 'none' }}
                id="fast-auto-csv-input"
                type="file"
                onChange={(e) => handleFileUpload(e, true)}
                disabled={isProcessing}
              />
              <label htmlFor="fast-auto-csv-input" style={{ width: '100%' }}>
                <Button
                  variant="contained"
                  color="success"
                  component="span"
                  fullWidth
                  disabled={isProcessing}
                  startIcon={<Bolt />}
                  sx={{ borderRadius: 2, fontWeight: 'bold', py: 1 }}
                >
                  Fast Upload CSV & Create Now
                </Button>
              </label>

              {/* Standard Upload to Preview */}
              <input
                accept=".csv,.txt,.tsv"
                style={{ display: 'none' }}
                id="bulk-student-csv-input"
                type="file"
                onChange={(e) => handleFileUpload(e, false)}
                disabled={isProcessing}
              />
              <label htmlFor="bulk-student-csv-input" style={{ width: '100%' }}>
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  disabled={isProcessing}
                  startIcon={<Upload />}
                  sx={{ borderRadius: 2 }}
                >
                  Load CSV to Preview Table
                </Button>
              </label>

              <Typography variant="caption" color="text.secondary">
                {fileName ? `Loaded: ${fileName} (${rows.length} rows)` : 'Format: username, email, mobile, passwordHash, fullName, userType, status'}
              </Typography>
            </Paper>
          </Grid>

          {/* Direct Paste Box */}
          <Grid item xs={12} md={7}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Or Paste Rows Directly from Excel / CSV"
              placeholder={`username,email,mobile,passwordHash,fullName,userType,status\nJEC25EC001,abdulhaleemps.ec25@jecc.ac.in,8848245356,1234,ABDUL HALEEM P S,Student,ACTIVE`}
              value={rawCsv}
              onChange={(e) => setRawCsv(e.target.value)}
              InputProps={{
                sx: { fontFamily: 'monospace', fontSize: '0.8rem' },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<ClearAll />}
                disabled={isProcessing}
                onClick={() => {
                  setRawCsv('');
                  setRows([]);
                  setFileName('');
                  setGlobalError('');
                }}
              >
                Clear
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                disabled={isProcessing}
                onClick={() => handleParseRawText(false)}
              >
                Preview Pasted Rows
              </Button>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<Bolt />}
                disabled={isProcessing}
                onClick={() => handleParseRawText(true)}
              >
                Paste & Create Immediately
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {globalError && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
          {globalError}
        </Alert>
      )}

      {rateLimitWaitSec > 0 && (
        <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
          Server rate limit reached — automatically cooling down for ~{rateLimitWaitSec}s and continuing automatically (no rows will be lost)...
        </Alert>
      )}

      {/* Progress Bar & Summary */}
      {(isProcessing || progress.current > 0) && (
        <Paper elevation={2} sx={{ p: 2, mb: 2.5, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isProcessing && <CircularProgress size={18} />}
              {isProcessing
                ? `Creating Student Logins (${progress.current} / ${progress.total})...`
                : `Completed (${progress.current} / ${progress.total} processed)`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip label={`Created: ${progress.created}`} color="success" size="small" />
              {progress.updated > 0 && (
                <Chip label={`Updated: ${progress.updated}`} color="info" size="small" />
              )}
              <Chip
                label={`Failed: ${progress.failed}`}
                color={progress.failed > 0 ? 'error' : 'default'}
                size="small"
              />
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Paper>
      )}

      {/* Step 3: Fast Lightweight Preview Table */}
      <Paper elevation={2} sx={{ p: 2.5, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            3. Student Login Rows ({rows.length} {rows.length === 1 ? 'row' : 'rows'})
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Add />}
              onClick={handleAddEmptyRow}
              disabled={isProcessing}
            >
              Add Row
            </Button>
            <Button
              variant="outlined"
              color="success"
              size="small"
              startIcon={<Bolt />}
              onClick={() => executeFastBulkCreate(rows, true)}
              disabled={isProcessing || rows.length === 0}
              sx={{ fontWeight: 'bold' }}
            >
              1-Request Instant Bulk Import ({rows.length})
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={isProcessing ? <CircularProgress size={18} color="inherit" /> : <Bolt />}
              onClick={() => executeFastBulkCreate(rows, false)}
              disabled={isProcessing || rows.length === 0}
              sx={{ fontWeight: 'bold', px: 3 }}
            >
              {isProcessing ? 'Creating Logins...' : `Fast Create ${rows.length} Login(s)`}
            </Button>
          </Box>
        </Box>

        <TableContainer sx={{ maxHeight: 460, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold', width: 45 }}>#</TableCell>
                <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>username</TableCell>
                <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>email</TableCell>
                <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>mobile</TableCell>
                <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>passwordHash</TableCell>
                <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>fullName</TableCell>
                <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>userType</TableCell>
                <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>status</TableCell>
                <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>Result</TableCell>
                <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold', width: 80 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No rows loaded yet. Click <strong>Fast Upload CSV & Create Now</strong> or{' '}
                    <Button size="small" onClick={handleLoadSample}>
                      Load Sample (JEC25EC001)
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                displayedRows.map((row, index) => {
                  const isEditing = editingRowId === row.id;
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {isEditing ? (
                          <input
                            value={row.username}
                            onChange={(e) => handleRowChange(row.id, 'username', e.target.value)}
                            style={{ width: '100%', padding: '4px' }}
                          />
                        ) : (
                          row.username
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <input
                            value={row.email}
                            onChange={(e) => handleRowChange(row.id, 'email', e.target.value)}
                            style={{ width: '100%', padding: '4px' }}
                          />
                        ) : (
                          row.email
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <input
                            value={row.mobile}
                            onChange={(e) => handleRowChange(row.id, 'mobile', e.target.value)}
                            style={{ width: '100%', padding: '4px' }}
                          />
                        ) : (
                          row.mobile
                        )}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>
                        {isEditing ? (
                          <input
                            value={row.passwordHash}
                            onChange={(e) => handleRowChange(row.id, 'passwordHash', e.target.value)}
                            style={{ width: '80px', padding: '4px' }}
                          />
                        ) : (
                          row.passwordHash
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {isEditing ? (
                          <input
                            value={row.fullName}
                            onChange={(e) => handleRowChange(row.id, 'fullName', e.target.value)}
                            style={{ width: '100%', padding: '4px' }}
                          />
                        ) : (
                          row.fullName
                        )}
                      </TableCell>
                      <TableCell>{normalizeUserType(row.userType)}</TableCell>
                      <TableCell>{normalizeStatus(row.status)}</TableCell>
                      <TableCell>
                        {row.importStatus === 'READY' && (
                          <Chip label="Ready" size="small" variant="outlined" />
                        )}
                        {row.importStatus === 'PROCESSING' && (
                          <Chip label="Creating..." size="small" color="warning" />
                        )}
                        {row.importStatus === 'CREATED' && (
                          <Chip icon={<CheckCircle fontSize="small" />} label="Created" size="small" color="success" />
                        )}
                        {row.importStatus === 'UPDATED' && (
                          <Chip icon={<CheckCircle fontSize="small" />} label="Updated" size="small" color="info" />
                        )}
                        {row.importStatus === 'ERROR' && (
                          <Tooltip title={row.importMessage}>
                            <Chip
                              icon={<ErrorIcon fontSize="small" />}
                              label={row.importMessage || 'Error'}
                              size="small"
                              color="error"
                              sx={{ maxWidth: 170 }}
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            color={isEditing ? 'success' : 'primary'}
                            onClick={() => setEditingRowId(isEditing ? null : row.id)}
                            disabled={isProcessing}
                            title={isEditing ? 'Done editing' : 'Edit row'}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveRow(row.id)}
                            disabled={isProcessing}
                            title="Remove row"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {rows.length > 100 && !showAllRows && (
          <Box sx={{ textAlign: 'center', mt: 1.5 }}>
            <Button size="small" onClick={() => setShowAllRows(true)}>
              Showing first 100 of {rows.length} rows — Click to show all
            </Button>
          </Box>
        )}
      </Paper>

      {/* Quick Create Class Dialog */}
      <Dialog open={openClassDialog} onClose={() => setOpenClassDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Quick Create Class (Department & Batch)</DialogTitle>
        <DialogContent dividers>
          {classFormError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {classFormError}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Class Name"
                placeholder="e.g. EC 2025 A"
                value={newClassData.name}
                onChange={(e) => setNewClassData({ ...newClassData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Section"
                placeholder="A"
                value={newClassData.section}
                onChange={(e) => setNewClassData({ ...newClassData, section: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Department Code"
                placeholder="EC"
                value={newClassData.departmentCode}
                onChange={(e) => setNewClassData({ ...newClassData, departmentCode: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Department Name"
                placeholder="Electronics & Communication Engineering"
                value={newClassData.departmentName}
                onChange={(e) => setNewClassData({ ...newClassData, departmentName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Batch Label"
                placeholder="2025-2029"
                value={newClassData.batchName}
                onChange={(e) => setNewClassData({ ...newClassData, batchName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Start Year"
                value={newClassData.startYear}
                onChange={(e) => setNewClassData({ ...newClassData, startYear: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="End Year"
                value={newClassData.endYear}
                onChange={(e) => setNewClassData({ ...newClassData, endYear: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenClassDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleQuickCreateClass} disabled={isCreatingClass}>
            {isCreatingClass ? <CircularProgress size={20} /> : 'Create & Select Class'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BulkStudentCreate;
