import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { orderService } from '@/services/order.service';
import type { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  MessageSquare,
  Download,
  Loader2,
  ArrowLeft,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showDeliverDialog, setShowDeliverDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [revisionReason, setRevisionReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const response = await orderService.getOrder(id!);
      setOrder(response.order);
    } catch (error) {
      toast.error('Failed to load order');
      navigate('/dashboard/orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      await orderService.acceptOrder(id!);
      toast.success('Order accepted');
      setShowAcceptDialog(false);
      fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeliver = async () => {
    if (!deliveryNotes.trim()) {
      toast.error('Please add delivery notes');
      return;
    }
    setIsSubmitting(true);
    try {
      await orderService.deliverOrder(id!, { deliveryNotes });
      toast.success('Order delivered');
      setShowDeliverDialog(false);
      fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to deliver order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionReason.trim() || revisionReason.length < 10) {
      toast.error('Please provide detailed reason (min 10 characters)');
      return;
    }
    setIsSubmitting(true);
    try {
      await orderService.requestRevision(id!, revisionReason);
      toast.success('Revision requested');
      setShowRevisionDialog(false);
      fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to request revision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await orderService.completeOrder(id!);
      toast.success('Order completed!');
      setShowCompleteDialog(false);
      fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    setIsSubmitting(true);
    try {
      await orderService.cancelOrder(id!, cancelReason);
      toast.success('Order cancelled');
      setShowCancelDialog(false);
      fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      await orderService.sendMessage(id!, { message });
      setMessage('');
      fetchOrder();
    } catch (error) {
      toast.error('Failed to send message');
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

  const isClient = order?.client._id === user?.id;
  const isFreelancer = order?.freelancer._id === user?.id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-96">
        <p>Order not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-muted rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Order Status</p>
                  <Badge className={getStatusBadge(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Total Price</p>
                  <p className="text-2xl font-bold">${order.price}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-6">
                {isFreelancer && order.status === 'pending' && (
                  <Button onClick={() => setShowAcceptDialog(true)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Order
                  </Button>
                )}
                {isFreelancer && (order.status === 'active' || order.status === 'revision') && (
                  <Button onClick={() => setShowDeliverDialog(true)}>
                    <Send className="h-4 w-4 mr-2" />
                    Deliver Now
                  </Button>
                )}
                {isClient && order.status === 'delivered' && (
                  <>
                    <Button onClick={() => setShowCompleteDialog(true)} variant="default">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Complete
                    </Button>
                    {order.revisionsLeft > 0 && (
                      <Button onClick={() => setShowRevisionDialog(true)} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Request Revision ({order.revisionsLeft} left)
                      </Button>
                    )}
                  </>
                )}
                {['pending', 'active'].includes(order.status) && (
                  <Button onClick={() => setShowCancelDialog(true)} variant="destructive">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Order
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                {order.service.images?.[0] && (
                  <img
                    src={order.service.images[0]}
                    alt={order.service.title}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <div>
                  <h3 className="font-medium">{order.service.title}</h3>
                  <p className="text-sm text-muted-foreground">{order.package.title} Package</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="font-medium mb-2">Your Requirements</p>
                <p className="text-muted-foreground bg-muted p-4 rounded-lg">
                  {order.requirements}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                {order.messages?.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${msg.sender._id === user?.id ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.sender.profilePicture} />
                      <AvatarFallback>{msg.sender.firstName[0]}</AvatarFallback>
                    </Avatar>
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-lg ${
                        msg.sender._id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.sender._id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(msg.sentAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-lg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Other Party */}
          <Card>
            <CardHeader>
              <CardTitle>{isClient ? 'Freelancer' : 'Client'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={isClient ? order.freelancer.profilePicture : order.client.profilePicture}
                  />
                  <AvatarFallback>
                    {isClient ? order.freelancer.firstName[0] : order.client.firstName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {isClient
                      ? `${order.freelancer.firstName} ${order.freelancer.lastName}`
                      : `${order.client.firstName} ${order.client.lastName}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    @{isClient ? order.freelancer.username : order.client.username}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle>Order Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Date</span>
                <span>{new Date(order.deliveryDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revisions Left</span>
                <span>{order.revisionsLeft}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Status</span>
                <Badge variant="outline">{order.paymentStatus}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Delivered Files */}
          {order.deliveredFiles && order.deliveredFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Delivered Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.deliveredFiles.map((file, index) => (
                    <a
                      key={index}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg"
                    >
                      <Download className="h-4 w-4" />
                      <span className="text-sm">{file.filename}</span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to accept this order? You will be committed to delivering by {new Date(order.deliveryDate).toLocaleDateString()}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptDialog(false)}>Cancel</Button>
            <Button onClick={handleAccept} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accept Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeliverDialog} onOpenChange={setShowDeliverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deliver Order</DialogTitle>
            <DialogDescription>
              Add delivery notes and any files for the client.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Describe what you have delivered..."
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeliverDialog(false)}>Cancel</Button>
            <Button onClick={handleDeliver} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Deliver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
            <DialogDescription>
              Explain what needs to be changed. You have {order.revisionsLeft} revisions left.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Describe what needs to be revised..."
            value={revisionReason}
            onChange={(e) => setRevisionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevisionDialog(false)}>Cancel</Button>
            <Button onClick={handleRequestRevision} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Request Revision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Order</DialogTitle>
            <DialogDescription>
              Are you satisfied with the delivery? This will release payment to the freelancer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>Cancel</Button>
            <Button onClick={handleComplete} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancellation.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for cancellation..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderDetails;
