import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { riskService } from '../services/riskService';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const RiskForm = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm();

  const likelihood = watch('likelihood');
  const impact = watch('impact');
  const riskScore = likelihood && impact ? likelihood * impact : 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isEdit) {
          const risk = await riskService.getRisk(id);
          Object.keys(risk).forEach(key => {
            if (key === 'reviewDate') {
              setValue(key, new Date(risk[key]).toISOString().split('T')[0]);
            } else if (key === 'owner') {
              setValue(key, risk[key]._id);
            } else {
              setValue(key, risk[key]);
            }
          });
        }
      } catch (error) {
        toast.error('Failed to fetch risk data');
        navigate('/risks');
      }
    };

    fetchData();
  }, [id, isEdit, setValue, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEdit) {
        await riskService.updateRisk(id, data);
        toast.success('Risk updated successfully');
      } else {
        await riskService.createRisk(data);
        toast.success('Risk created successfully');
      }
      navigate('/risks');
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} risk`);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (score) => {
    if (score <= 5) return { level: 'Low', color: 'text-green-600' };
    if (score <= 10) return { level: 'Medium', color: 'text-yellow-600' };
    if (score <= 15) return { level: 'High', color: 'text-orange-600' };
    return { level: 'Critical', color: 'text-red-600' };
  };

  const riskLevelInfo = getRiskLevel(riskScore);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Risk' : 'Create New Risk'}
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
                placeholder="Enter risk title"
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
                <option value="Operational">Operational</option>
                <option value="Technical">Technical</option>
                <option value="Financial">Financial</option>
                <option value="Strategic">Strategic</option>
                <option value="Compliance">Compliance</option>
                <option value="Reputational">Reputational</option>
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
              placeholder="Describe the risk in detail"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Likelihood (1-5) *
              </label>
              <select
                {...register('likelihood', { required: 'Likelihood is required' })}
                className="input-field"
              >
                <option value="">Select</option>
                <option value="1">1 - Very Low</option>
                <option value="2">2 - Low</option>
                <option value="3">3 - Medium</option>
                <option value="4">4 - High</option>
                <option value="5">5 - Very High</option>
              </select>
              {errors.likelihood && (
                <p className="mt-1 text-sm text-red-600">{errors.likelihood.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Impact (1-5) *
              </label>
              <select
                {...register('impact', { required: 'Impact is required' })}
                className="input-field"
              >
                <option value="">Select</option>
                <option value="1">1 - Very Low</option>
                <option value="2">2 - Low</option>
                <option value="3">3 - Medium</option>
                <option value="4">4 - High</option>
                <option value="5">5 - Very High</option>
              </select>
              {errors.impact && (
                <p className="mt-1 text-sm text-red-600">{errors.impact.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Risk Score
              </label>
              <div className="input-field bg-gray-50 flex items-center justify-between">
                <span className="font-medium">{riskScore}</span>
                <span className={`text-sm font-medium ${riskLevelInfo.color}`}>
                  {riskLevelInfo.level}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Treatment *
              </label>
              <select
                {...register('treatment', { required: 'Treatment is required' })}
                className="input-field"
              >
                <option value="">Select treatment</option>
                <option value="Accept">Accept</option>
                <option value="Mitigate">Mitigate</option>
                <option value="Transfer">Transfer</option>
                <option value="Avoid">Avoid</option>
              </select>
              {errors.treatment && (
                <p className="mt-1 text-sm text-red-600">{errors.treatment.message}</p>
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
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Monitoring">Monitoring</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Treatment Plan
            </label>
            <textarea
              {...register('treatmentPlan')}
              rows={3}
              className="input-field"
              placeholder="Describe the treatment plan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Review Date *
            </label>
            <input
              {...register('reviewDate', { required: 'Review date is required' })}
              type="date"
              className="input-field"
            />
            {errors.reviewDate && (
              <p className="mt-1 text-sm text-red-600">{errors.reviewDate.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/risks')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Risk' : 'Create Risk')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RiskForm;
