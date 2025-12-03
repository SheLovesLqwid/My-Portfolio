import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../services/api';

const Audits = () => {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    status: ''
  });
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchAudits();
  }, [filters]);

  const fetchAudits = async () => {
    try {
      const response = await api.get('/audits', { params: filters });
      setAudits(response.data.audits);
    } catch (error) {
      toast.error('Failed to fetch audits');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this audit?')) {
      try {
        await api.delete(`/audits/${id}`);
        toast.success('Audit deleted successfully');
        fetchAudits();
      } catch (error) {
        toast.error('Failed to delete audit');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Planned': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Internal': return 'bg-purple-100 text-purple-800';
      case 'External': return 'bg-orange-100 text-orange-800';
      case 'Certification': return 'bg-green-100 text-green-800';
      case 'Surveillance': return 'bg-blue-100 text-blue-800';
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
        <h1 className="text-2xl font-bold text-gray-900">Audit Management</h1>
        {hasRole(['Admin', 'Manager', 'Auditor']) && (
          <Link
            to="/audits/new"
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Schedule Audit
          </Link>
        )}
      </div>

      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="input-field"
            >
              <option value="">All Types</option>
              <option value="Internal">Internal</option>
              <option value="External">External</option>
              <option value="Certification">Certification</option>
              <option value="Surveillance">Surveillance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field"
            >
              <option value="">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Audit ID</th>
                <th className="table-header-cell">Title</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Lead Auditor</th>
                <th className="table-header-cell">Planned Start</th>
                <th className="table-header-cell">Planned End</th>
                <th className="table-header-cell">Findings</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {audits.map((audit) => (
                <tr key={audit._id}>
                  <td className="table-cell font-medium">{audit.auditId}</td>
                  <td className="table-cell">
                    <div className="max-w-xs truncate">{audit.title}</div>
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(audit.type)}`}>
                      {audit.type}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(audit.status)}`}>
                      {audit.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    {audit.leadAuditor?.firstName} {audit.leadAuditor?.lastName}
                  </td>
                  <td className="table-cell">
                    {new Date(audit.plannedStartDate).toLocaleDateString()}
                  </td>
                  <td className="table-cell">
                    {new Date(audit.plannedEndDate).toLocaleDateString()}
                  </td>
                  <td className="table-cell">
                    <span className="text-sm">
                      {audit.findings?.length || 0} findings
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <Link
                        to={`/audits/${audit._id}`}
                        className="text-gray-600 hover:text-gray-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      {hasRole(['Admin', 'Manager', 'Auditor']) && (
                        <>
                          <Link
                            to={`/audits/${audit._id}/edit`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                          {hasRole(['Admin', 'Manager']) && (
                            <button
                              onClick={() => handleDelete(audit._id)}
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
          {audits.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No audits found. {hasRole(['Admin', 'Manager', 'Auditor']) && (
                <Link to="/audits/new" className="text-primary-600 hover:text-primary-500">
                  Schedule your first audit
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Audits;
