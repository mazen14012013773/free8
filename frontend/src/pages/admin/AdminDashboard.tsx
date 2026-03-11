import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '@/services/admin.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Briefcase,
  ShoppingBag,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats?.users?.total?.toLocaleString() || 0}</p>
                <p className="text-xs text-green-600">
                  +{stats?.users?.newThisMonth || 0} this month
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Services</p>
                <p className="text-2xl font-bold">{stats?.services?.active?.toLocaleString() || 0}</p>
                <p className="text-xs text-green-600">
                  +{stats?.services?.newThisMonth || 0} this month
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{stats?.orders?.total?.toLocaleString() || 0}</p>
                <p className="text-xs text-green-600">
                  +{stats?.orders?.thisMonth || 0} this month
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ShoppingBag className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">${stats?.revenue?.total?.toLocaleString() || 0}</p>
                <p className="text-xs text-green-600">
                  +${stats?.revenue?.thisMonth?.toLocaleString() || 0} this month
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Users</CardTitle>
            <Link to="/admin/users">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivity?.users?.map((user: any) => (
                <div key={user._id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profilePicture} />
                    <AvatarFallback>{user.firstName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">{user.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link to="/admin/orders">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivity?.orders?.map((order: any) => (
                <div key={order._id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{order.service?.title}</p>
                    <p className="text-xs text-muted-foreground">#{order.orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${order.price}</p>
                    <Badge variant="outline" className="text-xs capitalize">{order.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Reports</CardTitle>
            <Link to="/admin/reports">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivity?.reports?.map((report: any) => (
                <div key={report._id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">{report.type} Report</p>
                    <p className="text-xs text-muted-foreground">{report.reason}</p>
                  </div>
                  <Badge variant="destructive" className="text-xs">Pending</Badge>
                </div>
              ))}
              {(!stats?.recentActivity?.reports || stats.recentActivity.reports.length === 0) && (
                <p className="text-center text-muted-foreground py-4">No pending reports</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
