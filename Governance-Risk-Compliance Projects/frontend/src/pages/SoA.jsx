import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../services/api';

const SoA = () => {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    applicability: '',
    implementationStatus: ''
  });
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchControls();
  }, [filters]);

  const fetchControls = async () => {
    try {
      const response = await api.get('/soa', { params: filters });
      setControls(response.data.controls);
    } catch (error) {
      toast.error('Failed to fetch controls');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this control?')) {
      try {
        await api.delete(`/soa/${id}`);
        toast.success('Control deleted successfully');
        fetchControls();
      } catch (error) {
        toast.error('Failed to delete control');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Implemented': return 'bg-green-100 text-green-800';
      case 'Partially Implemented': return 'bg-yellow-100 text-yellow-800';
      case 'Not Implemented': return 'bg-red-100 text-red-800';
      case 'Not Applicable': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Statement of Applicability</h1>
        {hasRole(['Admin', 'Manager', 'Auditor']) && (
          <Link
            to="/soa/new"
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Control
          </Link>
        )}
      </div>

      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="input-field"
            >
              <option value="">All Categories</option>
              <option value="A.5 Information Security Policies">A.5 Information Security Policies</option>
              <option value="A.6 Organization of Information Security">A.6 Organization of Information Security</option>
              <option value="A.7 Human Resource Security">A.7 Human Resource Security</option>
              <option value="A.8 Asset Management">A.8 Asset Management</option>
              <option value="A.9 Access Control">A.9 Access Control</option>
              <option value="A.10 Cryptography">A.10 Cryptography</option>
              <option value="A.11 Physical and Environmental Security">A.11 Physical and Environmental Security</option>
              <option value="A.12 Operations Security">A.12 Operations Security</option>
              <option value="A.13 Communications Security">A.13 Communications Security</option>
              <option value="A.14 System Acquisition, Development and Maintenance">A.14 System Acquisition, Development and Maintenance</option>
              <option value="A.15 Supplier Relationships">A.15 Supplier Relationships</option>
              <option value="A.16 Information Security Incident Management">A.16 Information Security Incident Management</option>
              <option value="A.17 Information Security Aspects of Business Continuity Management">A.17 Information Security Aspects of Business Continuity Management</option>
              <option value="A.18 Compliance">A.18 Compliance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Applicability</label>
            <select
              value={filters.applicability}
              onChange={(e) => setFilters({ ...filters, applicability: e.target.value })}
              className="input-field"
            >
              <option value="">All</option>
              <option value="Applicable">Applicable</option>
              <option value="Not Applicable">Not Applicable</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Implementation Status</label>
            <select
              value={filters.implementationStatus}
              onChange={(e) => setFilters({ ...filters, implementationStatus: e.target.value })}
              className="input-field"
            >
              <option value="">All Statuses</option>
              <option value="Implemented">Implemented</option>
              <option value="Partially Implemented">Partially Implemented</option>
              <option value="Not Implemented">Not Implemented</option>
              <option value="Not Applicable">Not Applicable</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Control ID</th>
                <th className="table-header-cell">Control Title</th>
                <th className="table-header-cell">Category</th>
                <th className="table-header-cell">Applicability</th>
                <th className="table-header-cell">Implementation Status</th>
                <th className="table-header-cell">Responsible Owner</th>
                <th className="table-header-cell">Next Review</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {controls.map((control) => (
                <tr key={control._id}>
                  <td className="table-cell font-medium">{control.controlId}</td>
                  <td className="table-cell">
                    <div className="max-w-xs truncate">{control.controlTitle}</div>
                  </td>
                  <td className="table-cell text-xs">{control.category}</td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      control.applicability === 'Applicable' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {control.applicability}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(control.implementationStatus)}`}>
                      {control.implementationStatus}
                    </span>
                  </td>
                  <td className="table-cell">
                    {control.responsibleOwner?.firstName} {control.responsibleOwner?.lastName}
                  </td>
                  <td className="table-cell">
                    {new Date(control.nextReviewDate).toLocaleDateString()}
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      {hasRole(['Admin', 'Manager', 'Auditor']) && (
                        <>
                          <Link
                            to={`/soa/${control._id}/edit`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                          {hasRole(['Admin', 'Manager']) && (
                            <button
                              onClick={() => handleDelete(control._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {controls.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No controls found. {hasRole(['Admin', 'Manager', 'Auditor']) && (
                <Link to="/soa/new" className="text-primary-600 hover:text-primary-500">
                  Create your first control
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SoA;
