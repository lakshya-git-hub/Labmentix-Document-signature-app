import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';

function AuditTrail({ documentId }) {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      if (!documentId) return;
      try {
        const token = localStorage.getItem('token');
        const data = await apiRequest(`/audit/${documentId}`, 'GET', null, token);
        setLogs(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchLogs();
  }, [documentId]);

  if (!documentId) return null;

  return (
    <div className="mt-8">
      <h4 className="font-semibold mb-2">Audit Trail</h4>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <ul className="text-sm space-y-1">
        {logs.map(log => (
          <li key={log._id} className="bg-gray-100 p-2 rounded">
            <span className="font-bold">{log.action}</span> by user {log.userId} at {new Date(log.timestamp).toLocaleString()} {log.ip && <span>(IP: {log.ip})</span>}
          </li>
        ))}
        {logs.length === 0 && <li>No audit logs yet.</li>}
      </ul>
    </div>
  );
}

export default AuditTrail; 