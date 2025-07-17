import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PdfPreview from '../components/PdfPreview';
import SignatureOverlay from '../components/SignatureOverlay';

function PublicSign() {
  const { token } = useParams();
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await fetch(`/api/public/sign/${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setDoc(data.document);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchDoc();
  }, [token]);

  const handlePlaceSignature = async ({ x, y }) => {
    const signerName = prompt('Enter your name for the signature:');
    if (!signerName) return;
    try {
      const res = await fetch(`/api/public/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y, page: 1, signerName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSigned(true);
      setPlacing(false);
      alert('Signature placed!');
    } catch (err) {
      alert('Failed to sign: ' + err.message);
    }
  };

  if (error) return <div className="max-w-lg mx-auto mt-8 text-red-600">{error}</div>;
  if (!doc) return <div className="max-w-lg mx-auto mt-8">Loading...</div>;

  const baseUrl = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/$/, '') : '';
  const cleanPath = doc.path.replace(/^api[\\/]/, '').replace(/^\/api[\\/]/, '').replace(/\\/g, '/').replace(/^\\+|^\/+/, '');
  const pdfUrl = baseUrl + '/' + cleanPath;

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Sign Document: {doc.originalname}</h2>
      <div className="relative" style={{ height: '500px' }}>
        <PdfPreview url={pdfUrl} />
        {placing && <SignatureOverlay onPlaceSignature={handlePlaceSignature} />}
      </div>
      <button
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => setPlacing(!placing)}
        disabled={signed}
      >
        {signed ? 'Signed' : placing ? 'Cancel' : 'Place Signature'}
      </button>
      {signed && <div className="mt-2 text-green-600 font-semibold">Thank you for signing!</div>}
    </div>
  );
}

export default PublicSign; 