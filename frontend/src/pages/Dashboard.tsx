import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/user.service';
import { orderService } from '@/services/order.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ShoppingBag,
  DollarSign,
  Briefcase,
  Star,
  TrendingUp,
  ArrowRight,
  Loader2,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsData, ordersData] = await Promise.all([
        userService.getStats(),
        orderService.getOrders({ limit: 5 })
      ]);
      setStats(statsData);
      setRecentOrders(ordersData.orders);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-blue-100 text-blue-800',
      delivered: 'bg-purple-100 text-purple-800',
      revision: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your account
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold">
                  {(stats?.orders.asClient.active || 0) + (stats?.orders.asFreelancer.active || 0)}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Orders</p>
                <p className="text-2xl font-bold">
                  {(stats?.orders.asClient.completed || 0) + (stats?.orders.asFreelancer.completed || 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {user?.role === 'freelancer' && (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="text-2xl font-bold">
                      ${stats?.earnings?.total?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">My Services</p>
                    <p className="text-2xl font-bold">{stats?.services || 0}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Briefcase className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {user?.role === 'client' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">
                    ${stats?.orders.asClient.total?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link to="/dashboard/orders">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No orders yet</p>
                  {user?.role === 'client' && (
                    <Link to="/services">
                      <Button>Browse Services</Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <Link
                      key={order._id}
                      to={`/dashboard/orders/${order._id}`}
                      className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={
                            order.client._id === user?.id
                              ? order.freelancer.profilePicture
                              : order.client.profilePicture
                          }
                        />
                        <AvatarFallback>
                          {order.client._id === user?.id
                            ? order.freelancer.firstName[0]
                            : order.client.firstName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{order.service.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.client._id === user?.id
                            ? `With ${order.freelancer.firstName} ${order.freelancer.lastName}`
                            : `For ${order.client.firstName} ${order.client.lastName}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusBadge(order.status)}>
                          {order.status}
                        </Badge>
                        <p className="text-sm font-medium mt-1">${order.price}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {user?.role === 'freelancer' ? (
                <>
                  <Link to="/dashboard/services/create">
                    <Button className="w-full justify-start" variant="outline">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Create New Service
                    </Button>
                  </Link>
                  <Link to="/dashboard/orders">
                    <Button className="w-full justify-start" variant="outline">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Manage Orders
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/services">
                    <Button className="w-full justify-start" variant="outline">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Find Services
                    </Button>
                  </Link>
                  <Link to="/dashboard/orders">
                    <Button className="w-full justify-start" variant="outline">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      My Orders
                    </Button>
                  </Link>
                </>
              )}
              <Link to="/dashboard/messages">
                <Button className="w-full justify-start" variant="outline">
                  <Clock className="h-4 w-4 mr-2" />
                  Messages
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.profilePicture} />
                  <AvatarFallback>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-muted-foreground">@{user?.username}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Role</span>
                  <Badge variant="secondary" className="capitalize">
                    {user?.role}
                  </Badge>
                </div>
                {user?.ratings && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rating</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {user.ratings.average.toFixed(1)} ({user.ratings.count})
                    </span>
                  </div>
                )}
              </div>
              <Link to={`/profile/${user?.username}`}>
                <Button variant="outline" className="w-full mt-4">
                  View Public Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
