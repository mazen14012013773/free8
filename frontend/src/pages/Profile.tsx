import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/user.service';
import { reviewService } from '@/services/review.service';
import type { User, Review } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Star,
  MapPin,
  Calendar,
  Globe,
  MessageSquare,
  Loader2,
  Briefcase,
  GraduationCap,
  Award
} from 'lucide-react';
import { toast } from 'sonner';

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, isAuthenticated } = useAuth();
  
  const [profile, setProfile] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [moreServices, setMoreServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setReviewStats] = useState<any>(null);

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await userService.getProfile(username!);
      setProfile(response.user);
      setReviews(response.reviews);
      setMoreServices(response.moreServices);

      // Fetch review stats
      if (response.user.role === 'freelancer') {
        const stats = await reviewService.getFreelancerStats(response.user.id);
        setReviewStats(stats);
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const isOwnProfile = currentUser?.username === username;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24 md:h-32 md:w-32">
                <AvatarImage src={profile.profilePicture} />
                <AvatarFallback className="text-2xl md:text-4xl">
                  {profile.firstName[0]}{profile.lastName[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">
                      {profile.firstName} {profile.lastName}
                    </h1>
                    <p className="text-muted-foreground mb-2">@{profile.username}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                      {profile.location?.country && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {profile.location.city}, {profile.location.country}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Member since {new Date(profile.memberSince!).toLocaleDateString()}
                      </span>
                      {profile.languages && profile.languages.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          Speaks {profile.languages.map(l => l.language).join(', ')}
                        </span>
                      )}
                    </div>

                    {profile.bio && (
                      <p className="text-muted-foreground max-w-2xl">{profile.bio}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!isOwnProfile && isAuthenticated && (
                      <Button>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contact Me
                      </Button>
                    )}
                    {isOwnProfile && (
                      <Button variant="outline" onClick={() => toast.info('Edit profile coming soon')}>
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t">
                  {profile.role === 'freelancer' && (
                    <>
                      <div className="text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="text-xl font-bold">
                            {profile.ratings?.average.toFixed(1) || '0'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {profile.ratings?.count || 0} Reviews
                        </p>
                      </div>
                      <Separator orientation="vertical" className="h-12 hidden md:block" />
                    </>
                  )}
                  <div className="text-center">
                    <p className="text-xl font-bold">{moreServices.length}</p>
                    <p className="text-sm text-muted-foreground">Services</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="space-y-6">
            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Education
                  </h3>
                  <div className="space-y-4">
                    {profile.education.map((edu, index) => (
                      <div key={index}>
                        <p className="font-medium">{edu.degree}</p>
                        <p className="text-sm text-muted-foreground">{edu.institution}</p>
                        <p className="text-sm text-muted-foreground">
                          {edu.startYear} - {edu.endYear || 'Present'}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Experience */}
            {profile.experience && profile.experience.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Experience
                  </h3>
                  <div className="space-y-4">
                    {profile.experience.map((exp, index) => (
                      <div key={index}>
                        <p className="font-medium">{exp.title}</p>
                        <p className="text-sm text-muted-foreground">{exp.company}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(exp.startDate).toLocaleDateString()} - {' '}
                          {exp.current ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString() : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="services">
              <TabsList className="w-full">
                <TabsTrigger value="services" className="flex-1">Services</TabsTrigger>
                {profile.role === 'freelancer' && (
                  <TabsTrigger value="reviews" className="flex-1">Reviews</TabsTrigger>
                )}
                <TabsTrigger value="portfolio" className="flex-1">Portfolio</TabsTrigger>
              </TabsList>

              <TabsContent value="services" className="mt-6">
                {moreServices.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">No services yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {moreServices.map((service) => (
                      <Link key={service._id} to={`/services/${service._id}`}>
                        <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                          <div className="relative h-40 overflow-hidden">
                            <img
                              src={service.images[0] || '/placeholder-service.jpg'}
                              alt={service.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <CardContent className="p-4">
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
                              <p className="font-semibold">
                                From ${service.packages[0]?.price || 0}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>

              {profile.role === 'freelancer' && (
                <TabsContent value="reviews" className="mt-6">
                  {reviews.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">No reviews yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <Card key={review._id}>
                          <CardContent className="p-4">
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
                                  <div className="flex items-center gap-0.5">
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
                                <p className="text-sm">{review.review}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              )}

              <TabsContent value="portfolio" className="mt-6">
                {profile.portfolio && profile.portfolio.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {profile.portfolio.map((item) => (
                      <Card key={item._id} className="overflow-hidden">
                        {item.imageUrl && (
                          <div className="h-48 overflow-hidden">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <h3 className="font-medium mb-1">{item.title}</h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">No portfolio items yet</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;