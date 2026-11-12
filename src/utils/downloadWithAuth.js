const API_BASE = import.meta.env.VITE_API_URL || 'https://ktu-activity-points-backend-2.onrender.com/api/v1';

/**
 * Download an authenticated backend endpoint as a Blob file.
 */
export async function downloadWithAuth(endpointPath, fallbackFilename) {
  const token = localStorage.getItem('accessToken');
  const url = endpointPath.startsWith('http') ? endpointPath : `${API_BASE}${endpointPath}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }

  const disposition = response.headers.get('Content-Disposition') || '';
  const filenameMatch = disposition.match(/filename="?([^";\n]+)"?/i);
  const filename = filenameMatch?.[1]?.trim() || fallbackFilename;

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    window.URL.revokeObjectURL(objectUrl);
  }
}

export default downloadWithAuth;

