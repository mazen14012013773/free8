import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { orderService } from '@/services/order.service';
import type { Order } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingBag,
  Loader2,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'client' | 'freelancer'>('all');

  useEffect(() => {
    fetchOrders();
  }, [activeTab, roleFilter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }

      const response = await orderService.getOrders(params);
      setOrders(response.orders);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'active':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return <ShoppingBag className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      active: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      delivered: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      revision: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
      completed: 'bg-green-100 text-green-800 hover:bg-green-100',
      cancelled: 'bg-red-100 text-red-800 hover:bg-red-100'
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return ['pending', 'active', 'delivered', 'revision'].includes(order.status);
    return order.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage your orders and track progress</p>
        </div>
        <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="client">As Client</SelectItem>
            <SelectItem value="freelancer">As Freelancer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No orders found</p>
                {user?.role === 'client' && (
                  <Link to="/services">
                    <Button>Browse Services</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Link key={order._id} to={`/dashboard/orders/${order._id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Order Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-muted-foreground">
                              Order #{order.orderNumber}
                            </span>
                            <Badge className={getStatusBadge(order.status)}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1 capitalize">{order.status}</span>
                            </Badge>
                          </div>
                          <h3 className="font-medium mb-1">{order.service.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {order.package.title} Package
                          </p>
                        </div>

                        {/* User Info */}
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
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
                          <div className="hidden md:block">
                            <p className="text-sm font-medium">
                              {order.client._id === user?.id
                                ? `${order.freelancer.firstName} ${order.freelancer.lastName}`
                                : `${order.client.firstName} ${order.client.lastName}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.client._id === user?.id ? 'Freelancer' : 'Client'}
                            </p>
                          </div>
                        </div>

                        {/* Price & Date */}
                        <div className="text-right">
                          <p className="font-semibold">${order.price}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Orders;