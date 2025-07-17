import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PdfPreview from '../components/PdfPreview';
import { apiRequest, API_URL } from '../utils/api';

// PDF page size constants (A4 size in points)
const PDF_PAGE_WIDTH = 595;
const PDF_PAGE_HEIGHT = 842;

export default function SignDocument() {
  const { docId } = useParams();
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState('');
  const [addingSignature, setAddingSignature] = useState(false);
  const [signatureFields, setSignatureFields] = useState([]);
  const pdfContainerRef = useRef();
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureModalValue, setSignatureModalValue] = useState('');
  const [signatureModalFont, setSignatureModalFont] = useState('times-italic');
  const [pendingSignaturePos, setPendingSignaturePos] = useState(null);
  const navigate = useNavigate();
  // Add state for dragging
  const [draggingSigId, setDraggingSigId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredSigId, setHoveredSigId] = useState(null);
  const [savedSignatures, setSavedSignatures] = useState([]);
  const [pdfWidth, setPdfWidth] = useState(595);
  const [pdfHeight, setPdfHeight] = useState(842);

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

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const token = localStorage.getItem('token');
        const d = await apiRequest(`/docs/${docId}`, 'GET', null, token);
        setDoc(d);
        if (d.pdfWidth && d.pdfHeight) {
          setPdfWidth(d.pdfWidth);
          setPdfHeight(d.pdfHeight);
        }
      } catch (err) {
        setError('Document not found or you do not have access.');
      }
    };
    fetchDoc();
  }, [docId]);

  useEffect(() => {
    if (!docId) return;
    const fetchSignatures = async () => {
      try {
        const token = localStorage.getItem('token');
        const sigs = await apiRequest(`/signatures/${docId}`, 'GET', null, token);
        setSavedSignatures(sigs);
      } catch (err) {
        setSavedSignatures([]);
      }
    };
    fetchSignatures();
  }, [docId]);

  useEffect(() => {
    const handleWindowMouseUp = () => {
      setDraggingSigId(null);
    };
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => window.removeEventListener('mouseup', handleWindowMouseUp);
  }, []);

  // Helper to get the PDF URL for preview
  const getPdfUrl = (doc) => {
    const baseUrl = API_URL ? API_URL.replace(/\/api$/, '') : '';
    const cleanPath = doc.path.replace(/^api[\\/]/, '').replace(/^\/api[\\/]/, '').replace(/\\/g, '/').replace(/^\\+|^\/+/, '');
    const url = baseUrl + '/' + cleanPath;
    console.log('PDF URL:', url, 'doc:', doc);
    return url;
  };

  // Handler for Signature button
  const handleSignatureButton = () => {
    setAddingSignature(true);
    setPendingSignaturePos(null);
    setSignatureModalOpen(false);
  };

  // Handler for PDF click to select position
  const handlePdfClick = (e) => {
    if (!addingSignature) return;
    const rect = pdfContainerRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const previewWidth = rect.width;
    const previewHeight = rect.height;
    // Scale to PDF coordinates using actual PDF size
    const pdfX = (screenX / previewWidth) * pdfWidth;
    const pdfY = (screenY / previewHeight) * pdfHeight;
    console.log('Signature Placement Debug:', {
      screenX, screenY, previewWidth, previewHeight, pdfX, pdfY, pdfWidth, pdfHeight
    });
    setPendingSignaturePos({ x: pdfX, y: pdfY });
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
        width: 100, // reduced width
        height: 36, // reduced height
        id: Date.now(),
        value: signatureModalValue,
        font: signatureModalFont,
        locked: false,
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

  // Handler for starting drag
  const handleSigMouseDown = (e, id) => {
    e.stopPropagation();
    setDraggingSigId(id);
    const sig = signatureFields.find(f => f.id === id);
    const rect = pdfContainerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - (rect.left + sig.x),
      y: e.clientY - (rect.top + sig.y),
    });
  };

  // Handler for dragging
  const handlePdfMouseMove = (e) => {
    if (draggingSigId === null) return;
    const sigIdx = signatureFields.findIndex(f => f.id === draggingSigId);
    if (sigIdx === -1) return;
    const rect = pdfContainerRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;
    setSignatureFields((fields) => fields.map((f, i) => i === sigIdx ? { ...f, x: newX, y: newY } : f));
  };

  // Handler for ending drag
  const handlePdfMouseUp = () => {
    setDraggingSigId(null);
  };

  // Sign button handler
  const handleSign = async () => {
    if (signatureFields.length === 0) {
      alert('Please add at least one signature field before signing.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      // Save each signature to backend
      for (const sig of signatureFields) {
        await apiRequest('/signatures', 'POST', {
          documentId: docId,
          x: sig.x,
          y: sig.y,
          page: 1, // or sig.page if you support multi-page
          value: sig.value,
          font: sig.font,
        }, token);
      }
      alert('Signatures saved!');
      setSignatureFields([]); // Clear local fields after saving
      // Refresh saved signatures
      const sigs = await apiRequest(`/signatures/${docId}`, 'GET', null, token);
      console.log('Fetched signatures:', sigs); // Debugging line
      setSavedSignatures(sigs);
    } catch (err) {
      alert('Failed to save signatures: ' + err.message);
    }
  };

  useEffect(() => {
    const handleWindowMouseUp = () => {
      if (draggingSigId !== null) {
        setSignatureFields(fields => fields.map(f => f.id === draggingSigId ? { ...f, locked: true } : f));
      }
      setDraggingSigId(null);
    };
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => window.removeEventListener('mouseup', handleWindowMouseUp);
  }, [draggingSigId]);

  const handleDownloadSignedPdf = async () => {
    if (!savedSignatures.length) {
      alert('No signature found to embed.');
      return;
    }
    const sig = savedSignatures[savedSignatures.length - 1]; // Use the last signature
    try {
      const token = localStorage.getItem('token');
      const requestBody = {
        documentId: docId,
        signatureText: sig.value || sig.signerName || 'Signature',
        x: sig.x,
        y: sig.y,
        page: sig.page || 1,
        font: sig.font || 'TimesRoman',
        fontSize: 16, // Match preview font size
      };
      console.log('Saved signatures:', savedSignatures);
      console.log('Requesting signed PDF with:', requestBody);
      const res = await fetch(`${API_URL}/signatures/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      console.log('Backend response:', data);
      if (!res.ok) throw new Error(data.message || 'Failed to embed signature');
      // Download the signed PDF
      const pdfUrl = `${API_URL.replace(/\/api$/, '')}/${data.signedPath}`;
      console.log('PDF download URL:', pdfUrl);
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = 'signed-document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download signed PDF: ' + err.message);
    }
  };

  if (error) return <div className="max-w-3xl mx-auto py-8 text-red-600">{error}</div>;
  if (!doc) return <div className="max-w-3xl mx-auto py-8">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="bg-white rounded-xl shadow p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <button className="text-gray-500 hover:text-purple-600 font-semibold" onClick={() => navigate('/dashboard')}>&larr; Back</button>
          <span className="text-2xl font-extrabold text-gray-900">{doc.originalname}</span>
          <button
            className="bg-gradient-to-r from-purple-500 to-purple-400 text-white font-semibold px-6 py-2 rounded-lg shadow hover:from-purple-600 hover:to-purple-500 transition"
            onClick={handleSign}
          >
            Sign
          </button>
        </div>
        <div className="flex flex-row gap-4">
          {/* Left Sidebar: Page Navigation */}
          <div className="bg-white rounded-lg shadow p-4 min-w-[140px] flex flex-col items-center">
            <h4 className="font-semibold mb-2">Pages</h4>
            <button className="w-full bg-purple-50 text-purple-700 rounded px-3 py-2 mb-2 font-semibold border border-purple-200">Page 1</button>
          </div>
          {/* Center: PDF Preview */}
          <div className="flex-1 flex flex-col items-center">
            <div
              className="relative bg-gray-100 rounded-lg shadow flex items-center justify-center"
              ref={pdfContainerRef}
              onMouseMove={handlePdfMouseMove}
              onMouseUp={handlePdfMouseUp}
              style={{ minHeight: pdfHeight, minWidth: pdfWidth, cursor: addingSignature ? 'crosshair' : 'default', width: pdfWidth, height: pdfHeight }}
            >
              {/* PDF preview */}
              <PdfPreview url={getPdfUrl(doc)} width={pdfWidth} height={pdfHeight}>
                {savedSignatures.map(sig => (
                  <div
                    key={sig._id}
                    className="absolute z-40 select-none"
                    style={{
                      left: sig.x,
                      top: sig.y,
                      minWidth: 100,
                      minHeight: 36,
                      padding: '2px 8px',
                      fontFamily: sig.font || 'Times New Roman, Times, serif',
                      fontSize: 16,
                      color: '#4b2997',
                      background: 'white',
                      border: '2px solid #a78bfa',
                      borderRadius: 8,
                      pointerEvents: 'none',
                      userSelect: 'none',
                      position: 'absolute'
                    }}
                  >
                    {sig.value || sig.signerName || 'Signature'}
                  </div>
                ))}
                {signatureFields.map((sig) => {
                  const isActive = (!sig.locked) && (draggingSigId === sig.id || hoveredSigId === sig.id);
                  return (
                    <div
                      key={sig.id}
                      className={'absolute z-30 select-none'}
                      style={{
                        left: sig.x,
                        top: sig.y,
                        minWidth: 60,
                        minHeight: 24,
                        padding: '2px 8px',
                        fontFamily: sig.font,
                        fontSize: 16,
                        color: '#4b2997',
                        userSelect: 'none',
                        background: isActive ? 'white' : 'transparent',
                        border: isActive ? '2px solid #a78bfa' : 'none',
                        boxShadow: isActive ? '0 2px 8px #a78bfa33' : 'none',
                        borderRadius: isActive ? 8 : 0,
                        cursor: sig.locked ? 'default' : (isActive ? 'move' : 'pointer'),
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                        position: 'absolute',
                        pointerEvents: sig.locked ? 'none' : 'auto',
                      }}
                      onMouseDown={sig.locked ? undefined : (e) => handleSigMouseDown(e, sig.id)}
                      onMouseEnter={sig.locked ? undefined : () => setHoveredSigId(sig.id)}
                      onMouseLeave={sig.locked ? undefined : () => setHoveredSigId(null)}
                    >
                      {sig.value}
                      {isActive && (
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            bottom: 0,
                            width: 18,
                            height: 18,
                            background: '#a78bfa',
                            borderRadius: 4,
                            cursor: 'nwse-resize',
                            zIndex: 40,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </PdfPreview>
              {/* Transparent overlay for click-to-place signature */}
              {addingSignature && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 20,
                    cursor: 'crosshair',
                    background: 'transparent',
                  }}
                  onClick={handlePdfClick}
                />
              )}
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
              <b>Step 2:</b> Click exactly where you want to place Signature on the PDF.<br />
              <b>Step 3:</b> Resize Signature to change font size automatically.
            </div>
            <div className="text-gray-700 font-semibold mb-2">Fields ({signatureFields.length + savedSignatures.length})</div>
            {signatureFields.length + savedSignatures.length === 0 ? (
              <div className="text-gray-400">No fields added yet.</div>
            ) : (
              <ul className="text-sm text-gray-700">
                {signatureFields.map((f, i) => (
                  <li key={f.id}>Signature (pending) {i + 1}: {f.value || 'Signature'}</li>
                ))}
                {savedSignatures.map((f, i) => (
                  <li key={f._id || i}>Signature (saved) {i + 1}: {f.value || f.signerName || 'Signature'}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
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
      <button
        className="bg-green-600 text-white font-semibold px-6 py-2 rounded-lg shadow ml-4"
        onClick={handleDownloadSignedPdf}
        disabled={savedSignatures.length === 0}
      >
        Download Signed PDF
      </button>
    </div>
  );
}

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