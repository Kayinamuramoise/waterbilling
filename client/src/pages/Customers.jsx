import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/customers/${editId}`, { name, address });
        setEditId(null);
      } else {
        await api.post('/customers', { name, address });
      }
      setName('');
      setAddress('');
      fetchCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (c) => {
    setEditId(c.cust_id);
    setName(c.name);
    setAddress(c.address);
  };

  const cancelEdit = () => {
    setEditId(null);
    setName('');
    setAddress('');
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
      </div>

      <div className="glass-card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.2rem' }}>{editId ? 'Edit Customer' : 'Add New Customer'}</h2>
          {editId && (
            <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={cancelEdit}>
              Cancel Edit
            </button>
          )}
        </div>
        <form onSubmit={handleCustomerSubmit} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label className="form-label">Name</label>
            <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label className="form-label">Address</label>
            <input type="text" className="form-control" value={address} onChange={e => setAddress(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary">
            {editId ? <><Check size={18} /> Update</> : <><Plus size={18} /> Add</>}
          </button>
        </form>
      </div>

      <div className="glass-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.cust_id}>
                  <td>#{c.cust_id}</td>
                  <td>{c.name}</td>
                  <td>{c.address}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-outline" style={{ padding: '6px 12px' }} onClick={() => startEdit(c)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn btn-danger" style={{ padding: '6px 12px' }} onClick={() => deleteCustomer(c.cust_id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>No customers found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
