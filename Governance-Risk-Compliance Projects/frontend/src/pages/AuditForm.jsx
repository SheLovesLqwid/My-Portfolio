import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api';

const AuditForm = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersResponse = await api.get('/users');
        setUsers(usersResponse.data.users || []);

        if (isEdit) {
          const response = await api.get(`/audits/${id}`);
          const audit = response.data;
          Object.keys(audit).forEach(key => {
            if (key === 'plannedStartDate' || key === 'plannedEndDate' || key === 'actualStartDate' || key === 'actualEndDate') {
              if (audit[key]) {
                setValue(key, new Date(audit[key]).toISOString().split('T')[0]);
              }
            } else if (key === 'leadAuditor') {
              setValue(key, audit[key]._id);
            } else if (key === 'auditTeam' || key === 'auditees') {
              setValue(key, audit[key].map(user => user._id));
            } else {
              setValue(key, audit[key]);
            }
          });
        }
      } catch (error) {
        toast.error('Failed to fetch data');
        if (isEdit) navigate('/audits');
      }
    };

    fetchData();
  }, [id, isEdit, setValue, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/audits/${id}`, data);
        toast.success('Audit updated successfully');
      } else {
        await api.post('/audits', data);
        toast.success('Audit created successfully');
      }
      navigate('/audits');
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} audit`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Audit' : 'Schedule New Audit'}
        </h1>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                className="input-field"
                placeholder="Enter audit title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                {...register('type', { required: 'Type is required' })}
                className="input-field"
              >
                <option value="">Select type</option>
                <option value="Internal">Internal</option>
                <option value="External">External</option>
                <option value="Certification">Certification</option>
                <option value="Surveillance">Surveillance</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scope *
            </label>
            <textarea
              {...register('scope', { required: 'Scope is required' })}
              rows={3}
              className="input-field"
              placeholder="Define the audit scope"
            />
            {errors.scope && (
              <p className="mt-1 text-sm text-red-600">{errors.scope.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Objectives *
            </label>
            <textarea
              {...register('objectives', { required: 'Objectives are required' })}
              rows={3}
              className="input-field"
              placeholder="Define the audit objectives"
            />
            {errors.objectives && (
              <p className="mt-1 text-sm text-red-600">{errors.objectives.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audit Criteria *
            </label>
            <textarea
              {...register('auditCriteria', { required: 'Audit criteria are required' })}
              rows={3}
              className="input-field"
              placeholder="Define the audit criteria (e.g., ISO 27001:2013)"
            />
            {errors.auditCriteria && (
              <p className="mt-1 text-sm text-red-600">{errors.auditCriteria.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lead Auditor *
            </label>
            <select
              {...register('leadAuditor', { required: 'Lead auditor is required' })}
              className="input-field"
            >
              <option value="">Select lead auditor</option>
              {users.filter(user => ['Admin', 'Auditor'].includes(user.role)).map(user => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName} - {user.department}
                </option>
              ))}
            </select>
            {errors.leadAuditor && (
              <p className="mt-1 text-sm text-red-600">{errors.leadAuditor.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Planned Start Date *
              </label>
              <input
                {...register('plannedStartDate', { required: 'Planned start date is required' })}
                type="date"
                className="input-field"
              />
              {errors.plannedStartDate && (
                <p className="mt-1 text-sm text-red-600">{errors.plannedStartDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Planned End Date *
              </label>
              <input
                {...register('plannedEndDate', { required: 'Planned end date is required' })}
                type="date"
                className="input-field"
              />
              {errors.plannedEndDate && (
                <p className="mt-1 text-sm text-red-600">{errors.plannedEndDate.message}</p>
              )}
            </div>
          </div>

          {isEdit && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual Start Date
                  </label>
                  <input
                    {...register('actualStartDate')}
                    type="date"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual End Date
                  </label>
                  <input
                    {...register('actualEndDate')}
                    type="date"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="input-field"
                >
                  <option value="Planned">Planned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Overall Conclusion
                </label>
                <textarea
                  {...register('overallConclusion')}
                  rows={4}
                  className="input-field"
                  placeholder="Provide overall audit conclusion"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recommendations
                </label>
                <textarea
                  {...register('recommendations')}
                  rows={4}
                  className="input-field"
                  placeholder="Provide audit recommendations"
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/audits')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Audit' : 'Schedule Audit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuditForm;
