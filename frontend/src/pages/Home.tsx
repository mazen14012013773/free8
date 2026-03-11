import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { serviceService } from '@/services/service.service';
import type { Service, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Star,
  ArrowRight,
  Palette,
  TrendingUp,
  FileText,
  Video,
  Music,
  Code,
  Briefcase,
  Heart,
  Database,
  Camera
} from 'lucide-react';
import { toast } from 'sonner';

const iconMap: { [key: string]: React.ElementType } = {
  Palette,
  TrendingUp,
  FileText,
  Video,
  Music,
  Code,
  Briefcase,
  Heart,
  Database,
  Camera
};

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [categoriesRes, servicesRes] = await Promise.all([
        serviceService.getCategories(),
        serviceService.getFeaturedServices(8)
      ]);
      setCategories(categoriesRes.categories);
      setFeaturedServices(servicesRes.services);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-primary/10 to-background py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Find the perfect{' '}
              <span className="text-primary">freelance</span> services for your
              business
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Connect with talented freelancers, get quality work done quickly and
              affordably. From design to development, we have got you covered.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="What service are you looking for?"
                    className="pl-12 h-14 text-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button type="submit" size="lg" className="h-14 px-8">
                  Search
                </Button>
              </div>
            </form>

            {/* Popular Searches */}
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <span className="text-muted-foreground">Popular:</span>
              {['Logo Design', 'WordPress', 'SEO', 'Video Editing', 'Web Development'].map(
                (term) => (
                  <button
                    key={term}
                    onClick={() => navigate(`/services?search=${encodeURIComponent(term)}`)}
                    className="text-primary hover:underline"
                  >
                    {term}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Explore Categories</h2>
            <Link
              to="/services"
              className="text-primary hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.slice(0, 10).map((category) => {
              const Icon = iconMap[category.icon] || Briefcase;
              return (
                <Link
                  key={category.id}
                  to={`/services?category=${category.id}`}
                  className="group"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-medium mb-1">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {category.serviceCount?.toLocaleString() || 0} services
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Services Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Featured Services</h2>
            <Link
              to="/services"
              className="text-primary hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredServices.map((service) => (
                <Link key={service._id} to={`/services/${service._id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={service.images[0] || '/placeholder-service.jpg'}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={service.freelancer.profilePicture} />
                          <AvatarFallback>
                            {service.freelancer.firstName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground truncate">
                          {service.freelancer.firstName} {service.freelancer.lastName}
                        </span>
                      </div>
                      <h3 className="font-medium line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {service.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {service.ratings.average.toFixed(1)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({service.ratings.count})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground">From</span>
                          <p className="font-semibold">
                            ${service.packages[0]?.price || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get your projects done in just a few simple steps. Connect with
              freelancers, collaborate, and pay securely.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Post a Project',
                description:
                  'Describe your project and the skills you are looking for. It is free and takes just a minute.',
              },
              {
                step: '2',
                title: 'Choose a Freelancer',
                description:
                  'Browse proposals, compare prices, and select the best freelancer for your project.',
              },
              {
                step: '3',
                title: 'Get Work Done',
                description:
                  'Collaborate with your freelancer, track progress, and pay only when satisfied.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join millions of businesses and freelancers already using FreelanceHub
            to get work done.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated ? (
              <>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate('/register')}
                >
                  Join as Freelancer
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground hover:bg-primary-foreground hover:text-primary"
                  onClick={() => navigate('/register')}
                >
                  Hire a Freelancer
                </Button>
              </>
            ) : user?.role === 'client' ? (
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/services')}
              >
                Find Services
              </Button>
            ) : (
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/dashboard/services/create')}
              >
                Create a Service
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;