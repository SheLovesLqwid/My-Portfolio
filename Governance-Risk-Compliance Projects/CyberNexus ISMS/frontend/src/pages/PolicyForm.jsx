import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api';

const PolicyForm = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
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
          const response = await api.get(`/policies/${id}`);
          const policy = response.data;
          Object.keys(policy).forEach(key => {
            if (key === 'effectiveDate' || key === 'reviewDate' || key === 'nextReviewDate' || key === 'approvalDate') {
              if (policy[key]) {
                setValue(key, new Date(policy[key]).toISOString().split('T')[0]);
              }
            } else if (key === 'owner' || key === 'approver') {
              if (policy[key]) {
                setValue(key, policy[key]._id);
              }
            } else {
              setValue(key, policy[key]);
            }
          });
        }
      } catch (error) {
        toast.error('Failed to fetch data');
        if (isEdit) navigate('/policies');
      }
    };

    fetchData();
  }, [id, isEdit, setValue, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== '') {
          formData.append(key, data[key]);
        }
      });

      if (selectedFile) {
        formData.append('file', selectedFile);
      } else if (!isEdit) {
        toast.error('Please select a file to upload');
        setLoading(false);
        return;
      }

      if (isEdit) {
        await api.put(`/policies/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Policy updated successfully');
      } else {
        await api.post('/policies', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Policy uploaded successfully');
      }
      navigate('/policies');
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'upload'} policy`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, DOC, DOCX, and TXT files are allowed');
        e.target.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Policy' : 'Upload New Policy'}
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
                placeholder="Enter policy title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
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
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={4}
              className="input-field"
              placeholder="Describe the policy"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Version *
              </label>
              <input
                {...register('version', { required: 'Version is required' })}
                className="input-field"
                placeholder="e.g., 1.0"
              />
              {errors.version && (
                <p className="mt-1 text-sm text-red-600">{errors.version.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                {...register('status')}
                className="input-field"
              >
                <option value="Draft">Draft</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Published">Published</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner *
              </label>
              <select
                {...register('owner', { required: 'Owner is required' })}
                className="input-field"
              >
                <option value="">Select owner</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.firstName} {user.lastName} - {user.department}
                  </option>
                ))}
              </select>
              {errors.owner && (
                <p className="mt-1 text-sm text-red-600">{errors.owner.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Approver
              </label>
              <select
                {...register('approver')}
                className="input-field"
              >
                <option value="">Select approver</option>
                {users.filter(user => ['Admin', 'Manager'].includes(user.role)).map(user => (
                  <option key={user._id} value={user._id}>
                    {user.firstName} {user.lastName} - {user.department}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Effective Date *
              </label>
              <input
                {...register('effectiveDate', { required: 'Effective date is required' })}
                type="date"
                className="input-field"
              />
              {errors.effectiveDate && (
                <p className="mt-1 text-sm text-red-600">{errors.effectiveDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review Date
              </label>
              <input
                {...register('reviewDate')}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Policy File {!isEdit && '*'}
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt"
              className="input-field"
            />
            <p className="mt-1 text-sm text-gray-500">
              Supported formats: PDF, DOC, DOCX, TXT (Max size: 10MB)
            </p>
            {selectedFile && (
              <p className="mt-1 text-sm text-green-600">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              {...register('tags')}
              className="input-field"
              placeholder="Enter tags separated by commas"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/policies')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Policy' : 'Upload Policy')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PolicyForm;
