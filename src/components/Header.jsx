import React from 'react';

function Header() {
  return (
    <header style={{ textAlign: 'center', marginBottom: '30px' }}>
      <h1 style={{ color: '#2c3e50', margin: '0 0 10px 0' }}>Monument & Heritage Scanner</h1>
      <p style={{ color: '#7f8c8d', fontSize: '1.1rem', margin: 0 }}>
        Point your camera at a historical structure to instantly analyze its architecture, era, and history.
      </p>
    </header>
  );
}

export default Header;