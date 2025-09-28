import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Database,
  RefreshCw,
  Smartphone,
  Building2,
  Calendar
} from 'lucide-react';

const MobileDashboard = () => {
  const [ipoData, setIpoData] = useState({
    totalIPOs: 0,
    totalValue: 0,
    avgReturn: 0,
    topPerformer: { company: '', return: 0 }
  });

  const [loading, setLoading] = useState(true);

  const [quickActions] = useState([
    { id: 1, title: 'View IPO Data', icon: Database, color: 'bg-blue-500', action: 'ipo-data' },
    { id: 2, title: 'Analytics', icon: BarChart3, color: 'bg-purple-500', action: 'analytics' },
    { id: 3, title: 'UW Rankings', icon: TrendingUp, color: 'bg-green-500', action: 'rankings' },
    { id: 4, title: 'Recent IPOs', icon: Calendar, color: 'bg-orange-500', action: 'recent' }
  ]);

  const [recentActivity] = useState([
    { id: 1, type: 'ipo', company: 'PT ABC Tbk', symbol: 'ABCA', return: 15.2, time: '2 days ago' },
    { id: 2, type: 'ipo', company: 'PT XYZ Tbk', symbol: 'XYZA', return: -5.8, time: '5 days ago' },
    { id: 3, type: 'ipo', company: 'PT DEF Tbk', symbol: 'DEFA', return: 8.3, time: '1 week ago' },
    { id: 4, type: 'update', message: 'New IPO data updated', time: '2 hours ago' }
  ]);

  useEffect(() => {
    // Simulate loading IPO data
    const loadData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIpoData({
        totalIPOs: 156,
        totalValue: 2500000000000, // 2.5T IDR
        avgReturn: 8.5,
        topPerformer: { company: 'PT Bank Jago Tbk', return: 45.2 }
      });
      
      setLoading(false);
    };
    
    loadData();
  }, []);

  const handleQuickAction = (action) => {
    // Navigate to appropriate section
    console.log(`Quick action: ${action}`);
    // In a real app, this would navigate to the specific component
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading IPO data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Mobile Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Smartphone className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">IPO Tracker Mobile</h2>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* IPO Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-medium">Total IPOs</p>
                <p className="text-lg font-bold text-green-800">{ipoData.totalIPOs}</p>
              </div>
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+{ipoData.avgReturn}% avg return</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium">Total Value</p>
                <p className="text-lg font-bold text-blue-800">Rp{(ipoData.totalValue / 1000000000000).toFixed(1)}T</p>
              </div>
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex items-center mt-1">
              <span className="text-xs text-blue-600">Market cap</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription className="text-sm">Access IPO tracking features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="h-16 flex-col space-y-1"
                onClick={() => handleQuickAction(action.action)}
              >
                <action.icon className={`h-5 w-5 ${action.color.replace('bg-', 'text-')}`} />
                <span className="text-xs text-center">{action.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent IPO Activity</CardTitle>
          <CardDescription className="text-sm">Latest IPO listings and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  {activity.type === 'ipo' ? (
                    <div className={`p-1 rounded ${activity.return >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      {activity.return >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                    </div>
                  ) : (
                    <div className="p-1 rounded bg-blue-100">
                      <Database className="h-3 w-3 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {activity.type === 'ipo' ? `${activity.symbol} IPO` : 'Data Update'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.type === 'ipo' ? `${activity.company} (${activity.return >= 0 ? '+' : ''}${activity.return}%)` : activity.message}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performer Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top Performer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">{ipoData.topPerformer.company}</span>
              </div>
              <Badge variant="default" className="bg-green-500">+{ipoData.topPerformer.return}%</Badge>
            </div>
            <div className="text-xs text-gray-500">
              Best performing IPO in the database
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileDashboard;
