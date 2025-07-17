import React, { useEffect, useState, useRef } from 'react';
import { apiRequest } from '../utils/api';
import { API_URL } from '../utils/api';
import PdfPreview from '../components/PdfPreview';
import SignatureOverlay from '../components/SignatureOverlay';
import AuditTrail from '../components/AuditTrail';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [placingSignature, setPlacingSignature] = useState(false);
  const [signatures, setSignatures] = useState([]);
  const [publicLink, setPublicLink] = useState('');
  const fileInputRef = useRef();
  const [addingSignature, setAddingSignature] = useState(false);
  const [signatureFields, setSignatureFields] = useState([]);
  const pdfContainerRef = useRef();
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureModalValue, setSignatureModalValue] = useState('');
  const [signatureModalFont, setSignatureModalFont] = useState('times-italic');
  const [pendingSignaturePos, setPendingSignaturePos] = useState(null);

  // Font options
  const signatureFonts = [
    {
      key: 'times-italic',
      label: 'Times Roman (Italic)',
      style: { fontFamily: 'Times New Roman, Times, serif', fontStyle: 'italic', fontWeight: 'normal' },
      preview: 'Classic serif italic - elegant for signatures',
    },
    {
      key: 'helvetica-bold',
      label: 'Helvetica Bold',
      style: { fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 'bold', fontStyle: 'normal' },
      preview: 'Clean bold sans-serif - strong and clear',
    },
    {
      key: 'helvetica-oblique',
      label: 'Helvetica Oblique',
      style: { fontFamily: 'Helvetica, Arial, sans-serif', fontStyle: 'oblique', fontWeight: 'normal' },
      preview: 'Slanted sans-serif - modern and stylish',
    },
  ];

  const navigate = useNavigate();

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const docs = await apiRequest('/docs/', 'GET', null, token);
      setDocuments(docs);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    const fetchSignatures = async () => {
      if (!selectedDoc) return setSignatures([]);
      try {
        const token = localStorage.getItem('token');
        const sigs = await apiRequest(`/signatures/${selectedDoc._id}`, 'GET', null, token);
        setSignatures(sigs);
      } catch {
        setSignatures([]);
      }
    };
    fetchSignatures();
  }, [selectedDoc, placingSignature]);

  const handleUpload = async (e) => {
    e.preventDefault(); // Prevent form submission
    setError('');
    setUploading(true);
    const file = e.target.files[0];
    if (!file) {
      setError('Please select a PDF file.');
      setUploading(false);
      return;
    }
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      setUploading(false);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(API_URL + '/docs/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Upload failed');
      const newDoc = await res.json();
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploading(false);
      // Redirect to signing page for the new document
      navigate(`/sign/${newDoc._id}`);
      return;
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Helper to get the PDF URL for preview
  const getPdfUrl = (doc) => {
    const baseUrl = API_URL ? API_URL.replace(/\/api$/, '') : '';
    // Remove any leading '/api', 'api/', or 'api\\' from the path
    const cleanPath = doc.path.replace(/^api[\\/]/, '').replace(/^\/api[\\/]/, '').replace(/\\/g, '/').replace(/^\\+|^\/+/, '');
    return baseUrl + '/' + cleanPath;
  };

  const handlePlaceSignature = async ({ x, y }) => {
    if (!selectedDoc) return;
    try {
      const token = localStorage.getItem('token');
      await apiRequest('/signatures', 'POST', {
        documentId: selectedDoc._id,
        x,
        y,
        page: 1, // For now, assume page 1
      }, token);
      alert('Signature position saved!');
      setPlacingSignature(false);
    } catch (err) {
      alert('Failed to save signature: ' + err.message);
    }
  };

  const handleUpdateSignatureStatus = async (sigId, status) => {
    const reason = status === 'rejected' ? prompt('Enter rejection reason:') : undefined;
    try {
      const token = localStorage.getItem('token');
      await apiRequest(`/signatures/${sigId}/status`, 'PATCH', { status, reason }, token);
      // Refresh signatures
      const sigs = await apiRequest(`/signatures/${selectedDoc._id}`, 'GET', null, token);
      setSignatures(sigs);
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleShare = async () => {
    if (!selectedDoc) return;
    try {
      const token = localStorage.getItem('token');
      const res = await apiRequest(`/docs/share/${selectedDoc._id}`, 'POST', null, token);
      setPublicLink(res.url);
    } catch (err) {
      alert('Failed to generate link: ' + err.message);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_URL + '/docs/' + docId, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Delete failed');
      await fetchDocuments();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handler for Signature button
  const handleSignatureButton = () => {
    setAddingSignature(true); // Next click on PDF will select position
    setPendingSignaturePos(null);
    setSignatureModalOpen(false);
  };

  // Handler for PDF click to select position
  const handlePdfClick = (e) => {
    if (!addingSignature) return;
    const rect = pdfContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPendingSignaturePos({ x, y });
    setAddingSignature(false);
    setSignatureModalValue('');
    setSignatureModalFont('times-italic');
    setSignatureModalOpen(true);
  };

  // Handler for confirming signature in modal
  const handleSignatureModalConfirm = () => {
    if (!pendingSignaturePos) return;
    setSignatureFields(fields => [
      ...fields,
      {
        x: pendingSignaturePos.x,
        y: pendingSignaturePos.y,
        width: 160,
        height: 48,
        id: Date.now(),
        value: signatureModalValue,
        font: signatureModalFont,
      },
    ]);
    setSignatureModalOpen(false);
    setPendingSignaturePos(null);
  };

  // Handler for dragging/resizing signature field
  const handleFieldDrag = (id, dx, dy) => {
    setSignatureFields(fields => fields.map(f => f.id === id ? { ...f, x: f.x + dx, y: f.y + dy } : f));
  };
  const handleFieldResize = (id, dw, dh) => {
    setSignatureFields(fields => fields.map(f => f.id === id ? { ...f, width: Math.max(80, f.width + dw), height: Math.max(24, f.height + dh) } : f));
  };

  // Sign button handler
  const handleSign = () => {
    if (signatureFields.length === 0) {
      alert('Please add at least one signature field before signing.');
      return;
    }
    // For demo: show fields data
    alert('Signatures saved! (Demo)\n' + JSON.stringify(signatureFields, null, 2));
    // TODO: Send signatureFields to backend for PDF update
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-white rounded-xl shadow p-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900">Welcome, <span className="text-purple-600">{localStorage.getItem('userName') || 'User'}</span></h2>
          <button onClick={() => { localStorage.removeItem('token'); window.location.reload(); }} className="flex items-center text-gray-600 hover:text-purple-600"><svg className="mr-1" width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M16 17l5-5m0 0l-5-5m5 5H9" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 12a7 7 0 11-14 0 7 7 0 0114 0z" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> Logout</button>
        </div>
        <form onSubmit={handleUpload} className="mb-8">
          <label style={{ display: 'block', width: 300, margin: '40px auto', cursor: 'pointer', background: '#a855f7', color: '#fff', padding: 20, borderRadius: 12, textAlign: 'center', fontWeight: 600 }}>
            Select PDF file
            <input
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={handleUpload}
              ref={fileInputRef}
            />
          </label>
        </form>
        <h3 className="text-xl font-bold mb-4">Your Documents</h3>
        <div className="space-y-4">
          {documents.length === 0 && <div className="text-gray-400 text-center">No documents uploaded yet.</div>}
        {documents.map(doc => (
            <div key={doc._id} className={`bg-white border border-gray-200 rounded-lg shadow flex items-center justify-between p-4 cursor-pointer ${selectedDoc && selectedDoc._id === doc._id ? 'ring-2 ring-purple-400' : ''}`} onClick={() => setSelectedDoc(doc)}>
              <div className="flex items-center space-x-4">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="#F87171" fillOpacity="0.15"/><path d="M8 7h8M8 11h8M8 15h4" stroke="#F87171" strokeWidth="2" strokeLinecap="round"/></svg>
                <div>
                  <div className="font-semibold text-gray-900">{doc.originalname}</div>
                  <div className="text-xs text-gray-500">{new Date(doc.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full flex items-center"><svg className="mr-1" width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Signed</span>
                <a href={getPdfUrl(doc)} download className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg font-semibold text-sm hover:bg-purple-200 transition">Download</a>
                <button onClick={e => { e.stopPropagation(); handleDelete(doc._id); }} className="bg-white border border-red-200 text-red-500 px-3 py-1 rounded-lg font-semibold text-sm hover:bg-red-50 transition">Delete</button>
              </div>
            </div>
          ))}
        </div>
        {/* PDF Preview and Signature Overlay */}
      {selectedDoc && (
          <div className="flex flex-row gap-4 mt-8">
            {/* Left Sidebar: Page Navigation */}
            <div className="bg-white rounded-lg shadow p-4 min-w-[140px] flex flex-col items-center">
              <h4 className="font-semibold mb-2">Pages</h4>
              <button className="w-full bg-purple-50 text-purple-700 rounded px-3 py-2 mb-2 font-semibold border border-purple-200">Page 1</button>
              {/* Multi-page support: map pages here */}
            </div>
            {/* Center: PDF Preview */}
            <div className="flex-1 flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-2">
                <button className="text-gray-500 hover:text-purple-600 font-semibold">&larr; Back</button>
                <span className="text-xl font-bold">{selectedDoc.originalname}</span>
                <button
                  className="bg-gradient-to-r from-purple-500 to-purple-400 text-white font-semibold px-6 py-2 rounded-lg shadow hover:from-purple-600 hover:to-purple-500 transition"
                  onClick={handleSign}
                >
                  Sign
                </button>
              </div>
              <div
                className="relative bg-gray-100 rounded-lg shadow flex items-center justify-center"
                style={{ minHeight: 600, minWidth: 400 }}
                ref={pdfContainerRef}
                onClick={handlePdfClick}
              >
                <PdfPreview url={getPdfUrl(selectedDoc)} />
                {/* Signature fields */}
                {signatureFields.map(field => (
                  <DraggableResizableSignatureField
                    key={field.id}
                    field={field}
                    onDrag={(dx, dy) => handleFieldDrag(field.id, dx, dy)}
                    onResize={(dw, dh) => handleFieldResize(field.id, dw, dh)}
                  />
                ))}
                {/* Add mode cursor */}
                {addingSignature && <div className="absolute inset-0 cursor-crosshair z-30" style={{ pointerEvents: 'none' }} />}
              </div>
          </div>
            {/* Right Sidebar: Signature Tools & Fields */}
            <div className="bg-white rounded-lg shadow p-4 min-w-[260px] flex flex-col">
              <h4 className="font-semibold mb-4">Add Fields</h4>
          <button
                className="bg-purple-50 text-purple-700 rounded px-4 py-3 font-semibold border border-purple-200 mb-4 flex items-center justify-center"
                onClick={handleSignatureButton}
          >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="mr-2"><rect x="3" y="3" width="18" height="18" rx="4" fill="#7C3AED" fillOpacity="0.15"/><path d="M8 7h8M8 11h8M8 15h4" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"/></svg>
                Signature
          </button>
              <div className="bg-blue-50 text-blue-800 rounded p-3 text-sm mb-4">
                <b>Step 1:</b> Click above Signature button.<br />
                <b>Step 2:</b> Click exactly where you want to place Signature & then drag your signature where you want to place it.<br />
                <b>Step 3:</b> Resize Signature to change font size automatically.
              </div>
              <div className="text-gray-700 font-semibold mb-2">Fields ({signatureFields.length})</div>
              {signatureFields.length === 0 ? (
                <div className="text-gray-400">No fields added yet.</div>
              ) : (
                <ul className="text-sm text-gray-700">
                  {signatureFields.map((f, i) => (
                    <li key={f.id}>Signature {i + 1}</li>
                  ))}
                </ul>
              )}
            </div>
            </div>
          )}
        </div>
      {signatureModalOpen && (
        <SignatureModal
          value={signatureModalValue}
          setValue={setSignatureModalValue}
          font={signatureModalFont}
          setFont={setSignatureModalFont}
          fonts={signatureFonts}
          onClose={() => setSignatureModalOpen(false)}
          onConfirm={handleSignatureModalConfirm}
        />
      )}
    </div>
  );
}

export default Dashboard; 

function DraggableResizableSignatureField({ field, onDrag, onResize }) {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });

  // Drag logic
  const handleMouseDown = (e) => {
    e.stopPropagation();
    setDragging(true);
    setStart({ x: e.clientX, y: e.clientY });
    document.body.style.userSelect = 'none';
  };
  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e) => {
      onDrag(e.movementX, e.movementY);
    };
    const handleUp = () => {
      setDragging(false);
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, onDrag]);

  // Resize logic
  const handleResizeDown = (e) => {
    e.stopPropagation();
    setResizing(true);
    setStart({ x: e.clientX, y: e.clientY });
    document.body.style.userSelect = 'none';
  };
  useEffect(() => {
    if (!resizing) return;
    const handleMove = (e) => {
      onResize(e.movementX, e.movementY);
    };
    const handleUp = () => {
      setResizing(false);
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [resizing, onResize]);

  return (
    <div
      className="absolute z-20 border-2 border-purple-500 bg-white rounded flex items-center justify-center shadow"
      style={{ left: field.x, top: field.y, width: field.width, height: field.height, cursor: dragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
    >
      <span
        className="select-none"
        style={
          field.font === 'times-italic' ? { fontFamily: 'Times New Roman, Times, serif', fontStyle: 'italic', fontWeight: 'normal', fontSize: 22, color: '#7C3AED' }
          : field.font === 'helvetica-bold' ? { fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 'bold', fontStyle: 'normal', fontSize: 22, color: '#7C3AED' }
          : field.font === 'helvetica-oblique' ? { fontFamily: 'Helvetica, Arial, sans-serif', fontStyle: 'oblique', fontWeight: 'normal', fontSize: 22, color: '#7C3AED' }
          : { fontSize: 22, color: '#7C3AED' }
        }
      >
        {field.value || 'Signature'}
      </span>
      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 bg-purple-400 rounded cursor-se-resize"
        onMouseDown={handleResizeDown}
        style={{ zIndex: 30 }}
      />
    </div>
  );
}

// SignatureModal component
function SignatureModal({ value, setValue, font, setFont, fonts, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8 relative">
        <button className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-700" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-4">Set your signature</h2>
        <label className="block mb-2 font-semibold">Full name:</label>
        <input
          className="w-full border border-gray-300 p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="Your name"
          value={value}
          onChange={e => setValue(e.target.value)}
        />
        <div className="mb-4">
          <div className="mb-1 text-gray-600">Preview (as it will appear in PDF):</div>
          <div className="border rounded p-4 text-center text-2xl" style={fonts.find(f => f.key === font)?.style}>{value || 'Your Name'}</div>
        </div>
        <div className="mb-2 font-semibold">Available PDF Fonts</div>
        <div className="space-y-3 mb-4">
          {fonts.map(f => (
            <label key={f.key} className={`block border rounded-lg p-3 cursor-pointer ${font === f.key ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}> 
              <input
                type="radio"
                className="mr-2 align-middle"
                checked={font === f.key}
                onChange={() => setFont(f.key)}
              />
              <span className="text-xl align-middle" style={f.style}>{value || 'Your Name'}</span>
              <div className="text-xs text-gray-500 mt-1">{f.label} - {f.preview}</div>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded bg-gray-100 text-gray-700 font-semibold" onClick={onClose}>Cancel</button>
          <button
            className="px-4 py-2 rounded bg-gradient-to-r from-purple-500 to-purple-400 text-white font-semibold shadow hover:from-purple-600 hover:to-purple-500 transition"
            onClick={onConfirm}
            disabled={!value.trim()}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
} 