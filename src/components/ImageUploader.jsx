import React from 'react';

function ImageUploader({ selectedImage, previewUrl, onImageSelect, onAnalyze, isLoading }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImageSelect(file);
    }
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', padding: '24px', borderRadius: '12px', border: '1px solid #dee2e6' }}>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#495057' }}>
          Select Image
        </label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          style={{ width: '100%', padding: '10px', backgroundColor: '#fff', border: '1px solid #ced4da', borderRadius: '6px' }}
        />
        <small style={{ display: 'block', marginTop: '8px', color: '#6c757d' }}>
          Upload a clear photo of a historical site (e.g., the sandstone arches of India Gate, the intricate carvings of Bhangarh Fort, or local monuments) for the best structural analysis.
        </small>
      </div>

      {previewUrl && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img 
            src={previewUrl} 
            alt="Upload preview" 
            style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', objectFit: 'cover' }} 
          />
        </div>
      )}

      <button 
        onClick={onAnalyze}
        disabled={!selectedImage || isLoading}
        style={{ 
          width: '100%', 
          padding: '14px', 
          backgroundColor: (!selectedImage || isLoading) ? '#a5d8ff' : '#228be6', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px', 
          fontSize: '1.1rem', 
          fontWeight: 'bold',
          cursor: (!selectedImage || isLoading) ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s'
        }}
      >
        {isLoading ? 'Analyzing Architecture...' : 'Scan Structure'}
      </button>
    </div>
  );
}

export default ImageUploader;