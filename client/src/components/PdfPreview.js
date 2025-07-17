import React from 'react';

function PdfPreview({ url, children, width = 595, height = 842 }) {
  return (
    <div style={{ position: 'relative', width, height }}>
      <iframe
        src={url}
        title="PDF Preview"
        width={width}
        height={height}
        style={{ border: 'none', width, height }}
        allowFullScreen
      />
      {children && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {children}
        </div>
      )}
      <div style={{ marginTop: 8, color: '#a855f7', fontSize: 14, textAlign: 'center' }}>
        Signature is a visual overlay and will not be embedded in the PDF file.
      </div>
    </div>
  );
}

export default PdfPreview; 