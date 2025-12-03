import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, PencilIcon, TrashIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../services/api';

const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    status: ''
  });
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchPolicies();
  }, [filters]);

  const fetchPolicies = async () => {
    try {
      const response = await api.get('/policies', { params: filters });
      setPolicies(response.data.policies);
    } catch (error) {
      toast.error('Failed to fetch policies');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this policy?')) {
      try {
        await api.delete(`/policies/${id}`);
        toast.success('Policy deleted successfully');
        fetchPolicies();
      } catch (error) {
        toast.error('Failed to delete policy');
      }
    }
  };

  const handleDownload = async (id, fileName) => {
    try {
      const response = await api.get(`/policies/${id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download policy');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Under Review': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Published': return 'bg-green-100 text-green-800';
      case 'Archived': return 'bg-red-100 text-red-800';
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
        <h1 className="text-2xl font-bold text-gray-900">Policy Management</h1>
        {hasRole(['Admin', 'Manager']) && (
          <Link
            to="/policies/new"
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Upload Policy
          </Link>
        )}
      </div>

      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="input-field"
            >
              <option value="">All Categories</option>
              <option value="Information Security Policy">Information Security Policy</option>
              <option value="Access Control Policy">Access Control Policy</option>
              <option value="Acceptable Use Policy">Acceptable Use Policy</option>
              <option value="Data Classification Policy">Data Classification Policy</option>
              <option value="Incident Response Policy">Incident Response Policy</option>
              <option value="Business Continuity Policy">Business Continuity Policy</option>
              <option value="Risk Management Policy">Risk Management Policy</option>
              <option value="Supplier Security Policy">Supplier Security Policy</option>
              <option value="HR Security Policy">HR Security Policy</option>
              <option value="Asset Management Policy">Asset Management Policy</option>
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
              <option value="Draft">Draft</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Published">Published</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Policy ID</th>
                <th className="table-header-cell">Title</th>
                <th className="table-header-cell">Category</th>
                <th className="table-header-cell">Version</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Owner</th>
                <th className="table-header-cell">Effective Date</th>
                <th className="table-header-cell">Next Review</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {policies.map((policy) => (
                <tr key={policy._id}>
                  <td className="table-cell font-medium">{policy.policyId}</td>
                  <td className="table-cell">
                    <div className="max-w-xs truncate">{policy.title}</div>
                  </td>
                  <td className="table-cell text-xs">{policy.category}</td>
                  <td className="table-cell">{policy.version}</td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(policy.status)}`}>
                      {policy.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    {policy.owner?.firstName} {policy.owner?.lastName}
                  </td>
                  <td className="table-cell">
                    {new Date(policy.effectiveDate).toLocaleDateString()}
                  </td>
                  <td className="table-cell">
                    {new Date(policy.nextReviewDate).toLocaleDateString()}
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDownload(policy._id, policy.fileName)}
                        className="text-green-600 hover:text-green-900"
                        title="Download"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </button>
                      {hasRole(['Admin', 'Manager']) && (
                        <>
                          <Link
                            to={`/policies/${policy._id}/edit`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(policy._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {policies.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No policies found. {hasRole(['Admin', 'Manager']) && (
                <Link to="/policies/new" className="text-primary-600 hover:text-primary-500">
                  Upload your first policy
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Policies;
