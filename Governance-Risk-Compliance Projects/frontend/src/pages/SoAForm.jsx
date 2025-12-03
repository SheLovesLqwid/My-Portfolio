import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api';

const SoAForm = () => {
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
          const response = await api.get(`/soa/${id}`);
          const control = response.data;
          Object.keys(control).forEach(key => {
            if (key === 'nextReviewDate' || key === 'lastReviewDate') {
              setValue(key, new Date(control[key]).toISOString().split('T')[0]);
            } else if (key === 'responsibleOwner') {
              setValue(key, control[key]._id);
            } else {
              setValue(key, control[key]);
            }
          });
        }
      } catch (error) {
        toast.error('Failed to fetch data');
        if (isEdit) navigate('/soa');
      }
    };

    fetchData();
  }, [id, isEdit, setValue, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/soa/${id}`, data);
        toast.success('Control updated successfully');
      } else {
        await api.post('/soa', data);
        toast.success('Control created successfully');
      }
      navigate('/soa');
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} control`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Control' : 'Create New Control'}
        </h1>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Control ID *
              </label>
              <input
                {...register('controlId', { required: 'Control ID is required' })}
                className="input-field"
                placeholder="e.g., A.9.1.1"
              />
              {errors.controlId && (
                <p className="mt-1 text-sm text-red-600">{errors.controlId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="input-field"
              >
                <option value="">Select category</option>
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
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Control Title *
            </label>
            <input
              {...register('controlTitle', { required: 'Control title is required' })}
              className="input-field"
              placeholder="Enter control title"
            />
            {errors.controlTitle && (
              <p className="mt-1 text-sm text-red-600">{errors.controlTitle.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Control Description *
            </label>
            <textarea
              {...register('controlDescription', { required: 'Control description is required' })}
              rows={4}
              className="input-field"
              placeholder="Describe the control requirements"
            />
            {errors.controlDescription && (
              <p className="mt-1 text-sm text-red-600">{errors.controlDescription.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Applicability *
              </label>
              <select
                {...register('applicability', { required: 'Applicability is required' })}
                className="input-field"
              >
                <option value="">Select applicability</option>
                <option value="Applicable">Applicable</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
              {errors.applicability && (
                <p className="mt-1 text-sm text-red-600">{errors.applicability.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Implementation Status *
              </label>
              <select
                {...register('implementationStatus', { required: 'Implementation status is required' })}
                className="input-field"
              >
                <option value="">Select status</option>
                <option value="Not Implemented">Not Implemented</option>
                <option value="Partially Implemented">Partially Implemented</option>
                <option value="Implemented">Implemented</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
              {errors.implementationStatus && (
                <p className="mt-1 text-sm text-red-600">{errors.implementationStatus.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Justification *
            </label>
            <textarea
              {...register('justification', { required: 'Justification is required' })}
              rows={3}
              className="input-field"
              placeholder="Justify the applicability and implementation status"
            />
            {errors.justification && (
              <p className="mt-1 text-sm text-red-600">{errors.justification.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsible Owner *
            </label>
            <select
              {...register('responsibleOwner', { required: 'Responsible owner is required' })}
              className="input-field"
            >
              <option value="">Select responsible owner</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName} - {user.department}
                </option>
              ))}
            </select>
            {errors.responsibleOwner && (
              <p className="mt-1 text-sm text-red-600">{errors.responsibleOwner.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Implementation Details
            </label>
            <textarea
              {...register('implementationDetails')}
              rows={3}
              className="input-field"
              placeholder="Describe how the control is implemented"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Evidence Location
            </label>
            <input
              {...register('evidenceLocation')}
              className="input-field"
              placeholder="Location of supporting evidence"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Review Date
              </label>
              <input
                {...register('lastReviewDate')}
                type="date"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Review Date *
              </label>
              <input
                {...register('nextReviewDate', { required: 'Next review date is required' })}
                type="date"
                className="input-field"
              />
              {errors.nextReviewDate && (
                <p className="mt-1 text-sm text-red-600">{errors.nextReviewDate.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/soa')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Control' : 'Create Control')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SoAForm;
