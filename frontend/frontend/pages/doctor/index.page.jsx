import React, { useState } from 'react';

export function Page() {
  // State variables for authentication
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // State variables for patient search
  const [patientName, setPatientName] = useState('');
  const [patientRecord, setPatientRecord] = useState(null);

  const handleLogin = async () => {
    try {
      const response = await fetch('/authorizeDoctor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();

      if (data.isAuthenticated) {
        setIsAuthenticated(true);
      } else {
        alert('Invalid credentials');
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('Login failed');
    }
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(`/patient/${patientName}`);
      const data = await response.json();

      if (data) {
        setPatientRecord(data);
      } else {
        alert('Unauthorized access or patient not found');
        setPatientRecord(null);
      }
    } catch (error) {
      console.error('Error during patient search:', error);
      alert('Patient search failed');
    }
  };

  return (
    <>
      <h1>Doctor Login</h1>

      {!isAuthenticated ? (
        <div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <button onClick={handleLogin}>Login</button>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Enter patient ID"
          />
          <button onClick={handleSearch}>Search</button>

          {patientRecord && (
            <div>
              <h2>Patient Record:</h2>
              <p>ID: {patientRecord.id}</p>
              <p>Name: {patientRecord.name}</p>
              <p>Diagnosis: {patientRecord.condition}</p>
              <p>Test Results: {patientRecord.testResults}</p>
              <p>Treatment: {patientRecord.treatment}</p>
            </div>
          )}
        </>
      )}
    </>
  );
}
