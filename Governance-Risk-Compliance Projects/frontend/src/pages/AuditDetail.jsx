import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PencilIcon, ArrowLeftIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../services/api';

const AuditDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchAudit();
  }, [id]);

  const fetchAudit = async () => {
    try {
      const response = await api.get(`/audits/${id}`);
      setAudit(response.data);
    } catch (error) {
      toast.error('Failed to fetch audit details');
      navigate('/audits');
    } finally {
      setLoading(false);
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

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
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

  if (!audit) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Audit not found</p>
        <Link to="/audits" className="text-primary-600 hover:text-primary-500">
          Back to Audits
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/audits')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Audit Details</h1>
        </div>
        {hasRole(['Admin', 'Manager', 'Auditor']) && (
          <Link
            to={`/audits/${audit._id}/edit`}
            className="btn-primary flex items-center"
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            Edit Audit
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Audit ID</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{audit.auditId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <p className="mt-1 text-sm text-gray-900">{audit.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(audit.type)}`}>
                  {audit.type}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(audit.status)}`}>
                  {audit.status}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Scope</label>
              <p className="mt-1 text-sm text-gray-900">{audit.scope}</p>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Objectives</label>
              <p className="mt-1 text-sm text-gray-900">{audit.objectives}</p>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Audit Criteria</label>
              <p className="mt-1 text-sm text-gray-900">{audit.auditCriteria}</p>
            </div>
          </div>

          {/* Findings */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Findings ({audit.findings?.length || 0})
            </h2>
            {audit.findings && audit.findings.length > 0 ? (
              <div className="space-y-4">
                {audit.findings.map((finding, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{finding.title}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(finding.severity)}`}>
                        {finding.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{finding.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Category:</span> {finding.category}
                      </div>
                      <div>
                        <span className="font-medium">Related Control:</span> {finding.relatedControl}
                      </div>
                      <div>
                        <span className="font-medium">Action Owner:</span> {finding.actionOwner?.firstName} {finding.actionOwner?.lastName}
                      </div>
                      <div>
                        <span className="font-medium">Target Date:</span> {new Date(finding.targetDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="font-medium text-sm">Corrective Action:</span>
                      <p className="text-sm text-gray-600">{finding.correctiveAction}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No findings recorded</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Schedule */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Schedule
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Planned Start</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(audit.plannedStartDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Planned End</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(audit.plannedEndDate).toLocaleDateString()}
                </p>
              </div>
              {audit.actualStartDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Actual Start</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(audit.actualStartDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {audit.actualEndDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Actual End</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(audit.actualEndDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Team */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Audit Team
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Lead Auditor</label>
                <p className="mt-1 text-sm text-gray-900">
                  {audit.leadAuditor?.firstName} {audit.leadAuditor?.lastName}
                </p>
              </div>
              {audit.auditTeam && audit.auditTeam.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Audit Team</label>
                  <div className="mt-1 space-y-1">
                    {audit.auditTeam.map((member, index) => (
                      <p key={index} className="text-sm text-gray-900">
                        {member.firstName} {member.lastName}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {audit.auditees && audit.auditees.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Auditees</label>
                  <div className="mt-1 space-y-1">
                    {audit.auditees.map((auditee, index) => (
                      <p key={index} className="text-sm text-gray-900">
                        {auditee.firstName} {auditee.lastName}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditDetail;
