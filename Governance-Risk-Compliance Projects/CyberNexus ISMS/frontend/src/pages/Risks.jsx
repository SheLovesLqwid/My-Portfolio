import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { riskService } from '../services/riskService';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Risks = () => {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    riskLevel: ''
  });
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchRisks();
  }, [filters]);

  const fetchRisks = async () => {
    try {
      const data = await riskService.getRisks(filters);
      setRisks(data.risks);
    } catch (error) {
      toast.error('Failed to fetch risks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this risk?')) {
      try {
        await riskService.deleteRisk(id);
        toast.success('Risk deleted successfully');
        fetchRisks();
      } catch (error) {
        toast.error('Failed to delete risk');
      }
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Monitoring': return 'bg-blue-100 text-blue-800';
      case 'Closed': return 'bg-green-100 text-green-800';
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
        <h1 className="text-2xl font-bold text-gray-900">Risk Management</h1>
        {hasRole(['Admin', 'Manager', 'Auditor']) && (
          <Link
            to="/risks/new"
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Risk
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
              <option value="Operational">Operational</option>
              <option value="Technical">Technical</option>
              <option value="Financial">Financial</option>
              <option value="Strategic">Strategic</option>
              <option value="Compliance">Compliance</option>
              <option value="Reputational">Reputational</option>
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
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Monitoring">Monitoring</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
            <select
              value={filters.riskLevel}
              onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
              className="input-field"
            >
              <option value="">All Levels</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Risk ID</th>
                <th className="table-header-cell">Title</th>
                <th className="table-header-cell">Category</th>
                <th className="table-header-cell">Risk Level</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Owner</th>
                <th className="table-header-cell">Review Date</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {risks.map((risk) => (
                <tr key={risk._id}>
                  <td className="table-cell font-medium">{risk.riskId}</td>
                  <td className="table-cell">
                    <div className="max-w-xs truncate">{risk.title}</div>
                  </td>
                  <td className="table-cell">{risk.category}</td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(risk.riskLevel)}`}>
                      {risk.riskLevel}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(risk.status)}`}>
                      {risk.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    {risk.owner?.firstName} {risk.owner?.lastName}
                  </td>
                  <td className="table-cell">
                    {new Date(risk.reviewDate).toLocaleDateString()}
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      {hasRole(['Admin', 'Manager', 'Auditor']) && (
                        <>
                          <Link
                            to={`/risks/${risk._id}/edit`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                          {hasRole(['Admin', 'Manager']) && (
                            <button
                              onClick={() => handleDelete(risk._id)}
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
          {risks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No risks found. {hasRole(['Admin', 'Manager', 'Auditor']) && (
                <Link to="/risks/new" className="text-primary-600 hover:text-primary-500">
                  Create your first risk
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Risks;
