import React, { useState, useEffect } from 'react';
import api from '../api';
import { Check, Printer } from 'lucide-react';

export default function Bills() {
  const [bills, setBills] = useState([]);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await api.get('/bills');
      setBills(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsPaid = async (id) => {
    try {
      await api.put(`/bills/${id}/pay`);
      fetchBills();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Bills & Reports</h1>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={18} /> Print Report
        </button>
      </div>

      <div className="glass-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Customer</th>
                <th>Amount (RWF)</th>
                <th>Date Generated</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(b => (
                <tr key={b.bill_id}>
                  <td>#{b.bill_id}</td>
                  <td>{b.customer_name}</td>
                  <td style={{ fontWeight: 600 }}>{b.amount}</td>
                  <td>{new Date(b.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${b.status === 'paid' ? 'badge-paid' : 'badge-pending'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td>
                    {b.status === 'pending' && (
                      <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => markAsPaid(b.bill_id)}>
                        <Check size={14} /> Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>No bills found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
