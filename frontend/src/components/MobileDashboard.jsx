import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Database,
  RefreshCw,
  Smartphone,
  Building2,
  Calendar,
  Search,
  Filter,
  Star,
  Eye,
  ArrowRight,
  Activity,
  Target,
  Zap,
  Globe,
  Users,
  Award,
  ChevronRight,
  Clock,
  TrendingUp as TrendingUpIcon,
  AlertCircle,
  CheckCircle,
  XCircle,
  List
} from 'lucide-react';
import MobileIPOList from './MobileIPOList';

const MobileDashboard = () => {
  const [ipoData, setIpoData] = useState({
    totalIPOs: 0,
    totalValue: 0,
    avgReturn: 0,
    topPerformer: { company: '', return: 0 },
    marketTrend: 'up',
    activeIPOs: 0
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const [quickActions] = useState([
    { id: 1, title: 'IPO Data', icon: Database, color: 'text-blue-600', bgColor: 'bg-blue-50', action: 'ipo-data' },
    { id: 2, title: 'Analytics', icon: BarChart3, color: 'text-purple-600', bgColor: 'bg-purple-50', action: 'analytics' },
    { id: 3, title: 'Rankings', icon: Award, color: 'text-green-600', bgColor: 'bg-green-50', action: 'rankings' },
    { id: 4, title: 'Live Feed', icon: Activity, color: 'text-orange-600', bgColor: 'bg-orange-50', action: 'live-feed' }
  ]);

  const [recentActivity] = useState([
    { id: 1, type: 'ipo', company: 'PT Bank Jago Tbk', symbol: 'ARTO', return: 15.2, time: '2 hours ago', status: 'success' },
    { id: 2, type: 'ipo', company: 'PT GoTo Gojek Tokopedia', symbol: 'GOTO', return: -5.8, time: '1 day ago', status: 'warning' },
    { id: 3, type: 'ipo', company: 'PT Bukalapak.com Tbk', symbol: 'BUKA', return: 8.3, time: '3 days ago', status: 'success' },
    { id: 4, type: 'update', message: 'Market data refreshed', time: '5 minutes ago', status: 'info' },
    { id: 5, type: 'ipo', company: 'PT Kalbe Farma Tbk', symbol: 'KLBF', return: 12.1, time: '1 week ago', status: 'success' }
  ]);

  const [topPerformers] = useState([
    { company: 'PT Bank Jago Tbk', symbol: 'ARTO', return: 45.2, change: '+12.5%' },
    { company: 'PT Bukalapak.com Tbk', symbol: 'BUKA', return: 38.7, change: '+8.2%' },
    { company: 'PT Kalbe Farma Tbk', symbol: 'KLBF', return: 32.1, change: '+5.9%' }
  ]);

  useEffect(() => {
    // Simulate loading IPO data
    const loadData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIpoData({
        totalIPOs: 156,
        totalValue: 2500000000000, // 2.5T IDR
        avgReturn: 8.5,
        topPerformer: { company: 'PT Bank Jago Tbk', return: 45.2 },
        marketTrend: 'up',
        activeIPOs: 12
      });
      
      setLoading(false);
    };
    
    loadData();
  }, []);

  const handleQuickAction = (action) => {
    console.log(`Quick action: ${action}`);
    // In a real app, this would navigate to the specific component
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading IPO Tracker</h3>
          <p className="text-gray-600">Fetching latest market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Enhanced Mobile Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">IPO Tracker</h1>
                <p className="text-sm text-gray-600">Indonesian Market</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full border-gray-300 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search IPOs, companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/90 backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Market Overview Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Total IPOs</p>
                  <p className="text-2xl font-bold text-green-800">{ipoData.totalIPOs}</p>
                </div>
                <div className="bg-green-200 p-2 rounded-lg">
                  <Building2 className="h-6 w-6 text-green-700" />
                </div>
              </div>
              <div className="flex items-center">
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-xs text-green-600 font-medium">+{ipoData.avgReturn}% avg return</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Market Value</p>
                  <p className="text-2xl font-bold text-blue-800">Rp{(ipoData.totalValue / 1000000000000).toFixed(1)}T</p>
                </div>
                <div className="bg-blue-200 p-2 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-700" />
                </div>
              </div>
              <div className="flex items-center">
                <Globe className="h-3 w-3 text-blue-600 mr-1" />
                <span className="text-xs text-blue-600 font-medium">IDX Market Cap</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Quick Actions */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Zap className="h-5 w-5 text-yellow-500 mr-2" />
              Quick Actions
            </CardTitle>
            <CardDescription>Access key features instantly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  className={`h-20 flex-col space-y-2 ${action.bgColor} border-gray-200 hover:shadow-md transition-all duration-200`}
                  onClick={() => handleQuickAction(action.action)}
                >
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                  <span className="text-sm font-medium text-gray-700">{action.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg">
            <TabsTrigger value="overview" className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center space-x-1">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">IPOs</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center space-x-1">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="top" className="flex items-center space-x-1">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Top</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Market Status */}
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Market Status</h3>
                    <p className="text-sm text-gray-600">Real-time market overview</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-green-100 p-2 rounded-full">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">Bullish</p>
                      <p className="text-xs text-gray-500">+2.3% today</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active IPOs */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Clock className="h-4 w-4 text-orange-500 mr-2" />
                  Active IPOs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-3xl font-bold text-orange-600 mb-2">{ipoData.activeIPOs}</div>
                  <p className="text-sm text-gray-600">Currently trading</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <MobileIPOList />
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Activity className="h-4 w-4 text-blue-500 mr-2" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest IPO listings and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(activity.status)}`}>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getStatusIcon(activity.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.type === 'ipo' ? `${activity.symbol} IPO` : 'System Update'}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {activity.type === 'ipo' 
                              ? `${activity.company} (${activity.return >= 0 ? '+' : ''}${activity.return}%)` 
                              : activity.message
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{activity.time}</span>
                        <ChevronRight className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="top" className="mt-4">
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Award className="h-4 w-4 text-yellow-500 mr-2" />
                  Top Performers
                </CardTitle>
                <CardDescription>Best performing IPOs this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPerformers.map((performer, index) => (
                    <div key={performer.symbol} className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center space-x-3">
                        <div className="bg-yellow-100 p-2 rounded-full">
                          <span className="text-sm font-bold text-yellow-700">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{performer.symbol}</p>
                          <p className="text-xs text-gray-600">{performer.company}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">+{performer.return}%</p>
                        <p className="text-xs text-gray-500">{performer.change}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MobileDashboard;
