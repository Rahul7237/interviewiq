import React from 'react';

function AnalysisResult({ result, error }) {
  if (error) {
    return (
      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#ffe3e3', color: '#c92a2a', borderRadius: '8px', border: '1px solid #ffc9c9' }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!result) return null;

  return (
    <div style={{ marginTop: '30px', padding: '24px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e9ecef', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#2b8a3e', borderBottom: '2px solid #d3f9d8', paddingBottom: '8px' }}>
        Architectural Analysis
      </h3>
      
      {/* We use pre-wrap so the formatting from Gemini's text response is preserved */}
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#343a40' }}>
        {result}
      </div>
    </div>
  );
}

export default AnalysisResult;