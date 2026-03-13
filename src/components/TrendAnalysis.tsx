import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { supabaseDataManager } from '../services/SupabaseDataManager';
import { StockTrend, TrendAnalysis } from '../types';

interface TrendAnalysisProps {
  organizationId: string;
  refreshKey?: number;
}

const TrendAnalysisComponent: React.FC<TrendAnalysisProps> = ({ organizationId, refreshKey }) => {
  const [timeframe, setTimeframe] = useState<'minute' | 'hour' | 'day' | 'week' | 'month'>('day');
  const [trends, setTrends] = useState<StockTrend[]>([]);
  const [analysis, setAnalysis] = useState<TrendAnalysis[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadTrendData();
  }, [organizationId, timeframe, refreshKey]);

  const loadTrendData = () => {
    const loadData = async () => {
      const trendData = await supabaseDataManager.getCumulativeStockTrends(organizationId, timeframe);
      const analysisData = await supabaseDataManager.getTrendAnalysis(organizationId);
      
      setTrends([]);
      setAnalysis(analysisData);
      setChartData(trendData);
    };
    
    loadData();
  };

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'minute': return 'Last Hour (per minute)';
      case 'hour': return 'Last 24 Hours (per hour)';
      case 'day': return 'Last 30 Days (per day)';
      case 'week': return 'Last 12 Weeks (per week)';
      case 'month': return 'Last 12 Months (per month)';
      default: return 'Stock Changes';
    }
  };

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntil = (dateString: string | null) => {
    if (!dateString) return null;
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              Stock Trends Analysis
            </h3>
            <p className="text-gray-600 mt-1">Monitor inventory patterns and predict restocking needs</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
            >
              <option value="minute">Per Minute</option>
              <option value="hour">Per Hour</option>
              <option value="day">Per Day</option>
              <option value="week">Per Week</option>
              <option value="month">Per Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">{getTimeframeLabel()}</h4>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              {Array.from(new Set(trends.map(t => t.medicineName))).map((medicine, index) => (
                <Line
                  key={medicine}
                  type="monotone"
                  dataKey={medicine}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 2 }}
                />
              ))}
              {chartData.length > 0 && Object.keys(chartData[0]).filter(key => key !== 'time').map((medicine, index) => (
                <Line
                  key={medicine}
                  type="monotone"
                  dataKey={medicine}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Predictions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-purple-600" />
          Stock Predictions & Recommendations
        </h4>
        
        {analysis.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No trend data available yet</p>
            <p className="text-gray-400 text-sm">Stock movements will appear here as you manage inventory</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.map((item, index) => {
              const stockoutDays = getDaysUntil(item.expectedStockoutDate);
              const restockDays = getDaysUntil(item.recommendedRestockDate);
              
              return (
                <div key={item.medicineName} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-gray-900 truncate">{item.medicineName}</h5>
                    {getTrendIcon(item.trend)}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Stock:</span>
                      <span className="font-medium text-blue-600">{item.currentStock}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Daily Usage:</span>
                      <span className="font-medium">{item.averageConsumption.toFixed(1)}</span>
                    </div>
                    
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-600">Stockout in:</span>
                        <span className={`font-medium ${
                          stockoutDays && stockoutDays <= 7 ? 'text-red-600' :
                          stockoutDays && stockoutDays <= 14 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {stockoutDays ? `${stockoutDays} days` : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Restock by:</span>
                        <span className={`font-medium ${
                          restockDays && restockDays <= 3 ? 'text-red-600' :
                          restockDays && restockDays <= 7 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {restockDays ? `${restockDays} days` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    {restockDays && restockDays <= 7 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                        <div className="flex items-center">
                          <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                          <span className="text-yellow-800 text-xs font-medium">Restock Soon!</span>
                        </div>
                      </div>
                    )}
                    
                    {stockoutDays && stockoutDays <= 3 && (
                      <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                        <div className="flex items-center">
                          <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                          <span className="text-red-800 text-xs font-medium">Critical Stock!</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendAnalysisComponent;