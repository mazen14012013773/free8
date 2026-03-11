import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceService } from '@/services/service.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Plus, X, Loader2, ArrowLeft, Upload } from 'lucide-react';
import { toast } from 'sonner';

const categories = [
  { id: 'graphics-design', name: 'Graphics & Design' },
  { id: 'digital-marketing', name: 'Digital Marketing' },
  { id: 'writing-translation', name: 'Writing & Translation' },
  { id: 'video-animation', name: 'Video & Animation' },
  { id: 'music-audio', name: 'Music & Audio' },
  { id: 'programming-tech', name: 'Programming & Tech' },
  { id: 'business', name: 'Business' },
  { id: 'lifestyle', name: 'Lifestyle' },
  { id: 'data', name: 'Data' },
  { id: 'photography', name: 'Photography' },
];

const CreateService = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    tags: [] as string[],
    packages: {
      basic: {
        title: '',
        description: '',
        price: 5,
        deliveryTime: 1,
        revisions: 0,
        features: [''] as string[]
      },
      standard: {
        title: '',
        description: '',
        price: 25,
        deliveryTime: 3,
        revisions: 2,
        features: [''] as string[]
      },
      premium: {
        title: '',
        description: '',
        price: 50,
        deliveryTime: 5,
        revisions: 5,
        features: [''] as string[]
      }
    }
  });
  const [tagInput, setTagInput] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addFeature = (packageName: 'basic' | 'standard' | 'premium') => {
    setFormData(prev => ({
      ...prev,
      packages: {
        ...prev.packages,
        [packageName]: {
          ...prev.packages[packageName],
          features: [...prev.packages[packageName].features, '']
        }
      }
    }));
  };

  const updateFeature = (packageName: 'basic' | 'standard' | 'premium', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      packages: {
        ...prev.packages,
        [packageName]: {
          ...prev.packages[packageName],
          features: prev.packages[packageName].features.map((f, i) => i === index ? value : f)
        }
      }
    }));
  };

  const removeFeature = (packageName: 'basic' | 'standard' | 'premium', index: number) => {
    setFormData(prev => ({
      ...prev,
      packages: {
        ...prev.packages,
        [packageName]: {
          ...prev.packages[packageName],
          features: prev.packages[packageName].features.filter((_, i) => i !== index)
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const packages = [
        { name: 'basic', ...formData.packages.basic },
        { name: 'standard', ...formData.packages.standard },
        { name: 'premium', ...formData.packages.premium }
      ];

      await serviceService.createService({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || formData.category,
        tags: formData.tags,
        packages,
        serviceImages: images
      });

      toast.success('Service created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const PackageForm = ({ packageName, title }: { packageName: 'basic' | 'standard' | 'premium', title: string }) => (
    <div className="space-y-4">
      <h3 className="font-semibold capitalize">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Package Title</Label>
          <Input
            placeholder="e.g., Basic Logo Design"
            value={formData.packages[packageName].title}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              packages: {
                ...prev.packages,
                [packageName]: { ...prev.packages[packageName], title: e.target.value }
              }
            }))}
          />
        </div>
        <div>
          <Label>Price ($)</Label>
          <Input
            type="number"
            min={5}
            value={formData.packages[packageName].price}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              packages: {
                ...prev.packages,
                [packageName]: { ...prev.packages[packageName], price: parseInt(e.target.value) }
              }
            }))}
          />
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          placeholder="Describe what's included..."
          value={formData.packages[packageName].description}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            packages: {
              ...prev.packages,
              [packageName]: { ...prev.packages[packageName], description: e.target.value }
            }
          }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Delivery Time (days)</Label>
          <Input
            type="number"
            min={1}
            value={formData.packages[packageName].deliveryTime}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              packages: {
                ...prev.packages,
                [packageName]: { ...prev.packages[packageName], deliveryTime: parseInt(e.target.value) }
              }
            }))}
          />
        </div>
        <div>
          <Label>Revisions</Label>
          <Input
            type="number"
            min={0}
            value={formData.packages[packageName].revisions}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              packages: {
                ...prev.packages,
                [packageName]: { ...prev.packages[packageName], revisions: parseInt(e.target.value) }
              }
            }))}
          />
        </div>
      </div>
      <div>
        <Label>Features</Label>
        <div className="space-y-2">
          {formData.packages[packageName].features.map((feature, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder={`Feature ${index + 1}`}
                value={feature}
                onChange={(e) => updateFeature(packageName, index, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFeature(packageName, index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addFeature(packageName)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Feature
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-muted rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold">Create a New Service</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Service Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Service Title *</Label>
              <Input
                placeholder="e.g., I will design a professional logo for your business"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.title.length}/100 characters
              </p>
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe your service in detail..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subcategory</Label>
                <Input
                  placeholder="e.g., Logo Design"
                  value={formData.subcategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span key={tag} className="bg-muted px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <Label>Images</Label>
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop images or click to browse
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <Label htmlFor="image-upload">
                  <Button type="button" variant="outline" asChild>
                    <span>Select Images</span>
                  </Button>
                </Label>
                {images.length > 0 && (
                  <p className="text-sm mt-2">{images.length} image(s) selected</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Packages */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing Packages</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic">
              <TabsList className="w-full">
                <TabsTrigger value="basic" className="flex-1">Basic</TabsTrigger>
                <TabsTrigger value="standard" className="flex-1">Standard</TabsTrigger>
                <TabsTrigger value="premium" className="flex-1">Premium</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="mt-4">
                <PackageForm packageName="basic" title="Basic Package" />
              </TabsContent>
              <TabsContent value="standard" className="mt-4">
                <PackageForm packageName="standard" title="Standard Package" />
              </TabsContent>
              <TabsContent value="premium" className="mt-4">
                <PackageForm packageName="premium" title="Premium Package" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Service'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateService;