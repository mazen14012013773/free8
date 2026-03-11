import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { serviceService } from '@/services/service.service';
import { orderService } from '@/services/order.service';
import type { Service, Review } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Star,
  Clock,
  RefreshCw,
  Check,
  MessageSquare,
  Share2,
  Flag,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

const ServiceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [moreServices, setMoreServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<'basic' | 'standard' | 'premium'>('basic');
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [orderRequirements, setOrderRequirements] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchServiceDetails();
    }
  }, [id]);

  const fetchServiceDetails = async () => {
    try {
      setIsLoading(true);
      const response = await serviceService.getService(id!);
      setService(response.service);
      setReviews(response.reviews);
      setMoreServices(response.moreServices);
    } catch (error) {
      toast.error('Failed to load service details');
      navigate('/services');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/services/${id}` } } });
      return;
    }

    if (user?.role !== 'client') {
      toast.error('Only clients can place orders');
      return;
    }

    setShowOrderDialog(true);
  };

  const submitOrder = async () => {
    if (!orderRequirements.trim() || orderRequirements.length < 10) {
      toast.error('Please provide detailed requirements (min 10 characters)');
      return;
    }

    setIsSubmitting(true);
    try {
      await orderService.createOrder({
        serviceId: id!,
        packageName: selectedPackage,
        requirements: orderRequirements
      });
      toast.success('Order placed successfully!');
      setShowOrderDialog(false);
      navigate('/dashboard/orders');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPackageDetails = () => {
    if (!service) return null;
    return service.packages.find(p => p.name === selectedPackage);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Service not found</p>
      </div>
    );
  }

  const selectedPackageDetails = getPackageDetails();

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Service Header */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4">{service.title}</h1>
              <div className="flex items-center gap-4">
                <Link to={`/profile/${service.freelancer.username}`} className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={service.freelancer.profilePicture} />
                    <AvatarFallback>
                      {service.freelancer.firstName[0]}{service.freelancer.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium hover:text-primary">
                      {service.freelancer.firstName} {service.freelancer.lastName}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{service.freelancer.ratings?.average.toFixed(1) || '0'}</span>
                      <span>({service.freelancer.ratings?.count || 0} reviews)</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Service Images */}
            {service.images.length > 0 && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={service.images[0]}
                  alt={service.title}
                  className="w-full h-64 md:h-96 object-cover"
                />
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="overview">
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                <TabsTrigger value="packages" className="flex-1">Packages</TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1">Reviews ({reviews.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">About This Service</h3>
                    <div className="prose max-w-none whitespace-pre-line">
                      {service.description}
                    </div>
                  </CardContent>
                </Card>

                {service.faq && service.faq.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
                      <div className="space-y-4">
                        {service.faq.map((item, index) => (
                          <div key={index}>
                            <p className="font-medium mb-1">Q: {item.question}</p>
                            <p className="text-muted-foreground">A: {item.answer}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="packages">
                <Card>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      {service.packages.map((pkg) => (
                        <div
                          key={pkg.name}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedPackage === pkg.name
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-muted-foreground'
                          }`}
                          onClick={() => setSelectedPackage(pkg.name)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold capitalize">{pkg.name}</h4>
                            {selectedPackage === pkg.name && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <p className="text-2xl font-bold mb-2">${pkg.price}</p>
                          <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{pkg.deliveryTime} days delivery</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <RefreshCw className="h-4 w-4" />
                              <span>{pkg.revisions} revisions</span>
                            </div>
                          </div>
                          <Separator className="my-4" />
                          <ul className="space-y-2">
                            {pkg.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <Check className="h-4 w-4 text-primary mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <Card>
                  <CardContent className="p-6">
                    {reviews.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No reviews yet</p>
                    ) : (
                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <div key={review._id} className="border-b last:border-0 pb-6 last:pb-0">
                            <div className="flex items-start gap-4">
                              <Avatar>
                                <AvatarImage src={review.reviewer.profilePicture} />
                                <AvatarFallback>
                                  {review.reviewer.firstName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">
                                    {review.reviewer.firstName} {review.reviewer.lastName}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-3 w-3 ${
                                          i < review.rating
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-muted'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                                <p>{review.review}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                {/* Package Selector */}
                <div className="flex border rounded-lg mb-6">
                  {['basic', 'standard', 'premium'].map((pkg) => (
                    <button
                      key={pkg}
                      onClick={() => setSelectedPackage(pkg as any)}
                      className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
                        selectedPackage === pkg
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {pkg}
                    </button>
                  ))}
                </div>

                {selectedPackageDetails && (
                  <>
                    <div className="mb-6">
                      <p className="text-3xl font-bold">${selectedPackageDetails.price}</p>
                      <p className="text-muted-foreground">{selectedPackageDetails.title}</p>
                    </div>

                    <p className="text-sm mb-6">{selectedPackageDetails.description}</p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Delivery Time
                        </span>
                        <span>{selectedPackageDetails.deliveryTime} days</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4" />
                          Revisions
                        </span>
                        <span>{selectedPackageDetails.revisions}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full mb-4"
                      size="lg"
                      onClick={handleOrder}
                      disabled={user?._id === service.freelancer._id}
                    >
                      {user?._id === service.freelancer._id
                        ? 'Your Service'
                        : 'Continue (${selectedPackageDetails.price})'}
                    </Button>
                  </>
                )}

                <Button variant="outline" className="w-full mb-4">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Seller
                </Button>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Place Your Order</DialogTitle>
            <DialogDescription>
              Provide details about your project requirements
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Selected Package</label>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium capitalize">{selectedPackage} Package</p>
                <p className="text-sm text-muted-foreground">
                  ${selectedPackageDetails?.price} - {selectedPackageDetails?.deliveryTime} days delivery
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Project Requirements *</label>
              <Textarea
                placeholder="Describe what you need in detail..."
                value={orderRequirements}
                onChange={(e) => setOrderRequirements(e.target.value)}
                rows={5}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 10 characters required
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitOrder} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Placing Order...
                </>
              ) : (
                `Place Order ($${selectedPackageDetails?.price})`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceDetails;