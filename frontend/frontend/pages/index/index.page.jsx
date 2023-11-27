import React, { useState } from 'react';

export function Page() {
  // State variables for authentication and patient data
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [patientRecord, setPatientRecord] = useState(null);

  const handleLogin = async () => {
    try {
      // Sending a POST request to the server for authentication
      const response = await fetch('/api/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      if (data.isAuthenticated) {
        setIsAuthenticated(true);
        // Fetch the patient record using the authenticated username
        fetchPatientRecord(username);
      } else {
        alert('Unauthorized access: Invalid username or password');
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login error');
    }
  };

  const fetchPatientRecord = async (patientName) => {
    try {
      // Fetching patient record from the server using the patient name
      const response = await fetch(`/patient/${patientName}`);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const record = await response.json();
      setPatientRecord(record);
    } catch (error) {
      console.error('Error fetching patient record:', error);
      alert('Error fetching patient data');
    }
  };

  return (
    <>
      <h1>Patient Login</h1>

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
        patientRecord && (
          <div>
            <h2>Patient Record:</h2>
            <p>ID: {patientRecord.id}</p>
            <p>Name: {patientRecord.name}</p>
            <p>Diagnosis: {patientRecord.condition}</p>
            <p>Test Results: {patientRecord.testResults}</p>
            <p>Treatment: {patientRecord.treatment}</p>
          </div>
        )
      )}
    </>
  );
}
