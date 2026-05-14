import React, { useState, useEffect } from 'react';
import api from '../api';
import { Activity, Plus } from 'lucide-react';

export default function Meters() {
  const [meters, setMeters] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [custId, setCustId] = useState('');
  const [reading, setReading] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMeters();
    fetchCustomers();
  }, []);

  const fetchMeters = async () => {
    try {
      const res = await api.get('/meters');
      setMeters(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addReading = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/meters', { cust_id: custId, reading });
      setSuccess(`Success! Usage: ${res.data.usage} units, Bill Generated: ${res.data.billAmount} RWF`);
      setCustId('');
      setReading('');
      fetchMeters();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add reading');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Meter Readings</h1>
      </div>

      <div className="glass-card" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Record New Reading</h2>
        
        {error && <div style={{ color: 'var(--danger-color)', marginBottom: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
        {success && <div style={{ color: 'var(--success-color)', marginBottom: '16px', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>{success}</div>}
        
        <form onSubmit={addReading} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label className="form-label">Customer</label>
            <select className="form-control" value={custId} onChange={e => setCustId(e.target.value)} required>
              <option value="">Select Customer</option>
              {customers.map(c => (
                <option key={c.cust_id} value={c.cust_id}>{c.name} (#{c.cust_id})</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label className="form-label">Current Reading (Units)</label>
            <input type="number" step="0.01" className="form-control" value={reading} onChange={e => setReading(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary">
            <Plus size={18} /> Record
          </button>
        </form>
      </div>

      <div className="glass-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Reading</th>
                <th>Date Recorded</th>
              </tr>
            </thead>
            <tbody>
              {meters.map(m => (
                <tr key={m.meter_id}>
                  <td>#{m.meter_id}</td>
                  <td>{m.customer_name}</td>
                  <td><Activity size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}/>{m.reading}</td>
                  <td>{new Date(m.date_recorded).toLocaleString()}</td>
                </tr>
              ))}
              {meters.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>No readings found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
