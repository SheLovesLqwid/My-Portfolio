import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import {
  ShieldExclamationIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  DocumentIcon,
  UserGroupIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [alerts, setAlerts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, activitiesData, alertsData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentActivities(),
          dashboardService.getAlerts()
        ]);
        
        setStats(statsData);
        setActivities(activitiesData.activities);
        setAlerts(alertsData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981'];

  const statCards = [
    {
      title: 'Total Risks',
      value: stats?.overview?.totalRisks || 0,
      subtitle: `${stats?.overview?.highRisks || 0} High/Critical`,
      icon: ShieldExclamationIcon,
      color: 'bg-red-500',
      link: '/risks'
    },
    {
      title: 'Compliance',
      value: `${stats?.overview?.compliancePercentage || 0}%`,
      subtitle: 'ISO 27001 Controls',
      icon: ClipboardDocumentListIcon,
      color: 'bg-green-500',
      link: '/soa'
    },
    {
      title: 'Active Audits',
      value: stats?.overview?.activeAudits || 0,
      subtitle: `${stats?.overview?.openFindings || 0} Open Findings`,
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      link: '/audits'
    },
    {
      title: 'Policies',
      value: stats?.overview?.publishedPolicies || 0,
      subtitle: `${stats?.overview?.upcomingReviews || 0} Due for Review`,
      icon: DocumentIcon,
      color: 'bg-purple-500',
      link: '/policies'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link key={index} to={card.link} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${card.color} rounded-md p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{card.title}</dt>
                    <dd className="text-lg font-medium text-gray-900">{card.value}</dd>
                    <dd className="text-sm text-gray-500">{card.subtitle}</dd>
                  </dl>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Distribution</h3>
          {stats?.charts?.risksByLevel?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.charts.risksByLevel}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ _id, count }) => `${_id}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="_id"
                >
                  {stats.charts.risksByLevel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No risk data available
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Trend</h3>
          {stats?.charts?.riskTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.charts.riskTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id.month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No trend data available
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h3>
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                  activity.type === 'Risk' ? 'bg-red-400' :
                  activity.type === 'Audit' ? 'bg-blue-400' : 'bg-green-400'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {activity.type}: {activity.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    by {activity.createdBy?.firstName} {activity.createdBy?.lastName}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(activity.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-sm text-gray-500">No recent activities</p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Alerts & Notifications</h3>
          <div className="space-y-3">
            {alerts.criticalRisks?.slice(0, 3).map((risk, index) => (
              <div key={index} className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Critical Risk: {risk.title}</p>
                  <p className="text-xs text-gray-500">Owner: {risk.owner?.firstName} {risk.owner?.lastName}</p>
                </div>
              </div>
            ))}
            {alerts.upcomingAudits?.slice(0, 2).map((audit, index) => (
              <div key={index} className="flex items-start space-x-3">
                <DocumentTextIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Upcoming Audit: {audit.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(audit.plannedStartDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {(!alerts.criticalRisks?.length && !alerts.upcomingAudits?.length) && (
              <p className="text-sm text-gray-500">No active alerts</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
