import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Plus, X, Loader2, ArrowLeft } from 'lucide-react';
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

const EditService = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    tags: [] as string[],
    packages: {
      basic: { title: '', description: '', price: 5, deliveryTime: 1, revisions: 0, features: [''] },
      standard: { title: '', description: '', price: 25, deliveryTime: 3, revisions: 2, features: [''] },
      premium: { title: '', description: '', price: 50, deliveryTime: 5, revisions: 5, features: [''] }
    }
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (id) {
      fetchService();
    }
  }, [id]);

  const fetchService = async () => {
    try {
      setIsLoading(true);
      const response = await serviceService.getService(id!);
      const service = response.service;
      
      setFormData({
        title: service.title,
        description: service.description,
        category: service.category,
        subcategory: service.subcategory,
        tags: service.tags || [],
        packages: {
          basic: service.packages.find(p => p.name === 'basic') || formData.packages.basic,
          standard: service.packages.find(p => p.name === 'standard') || formData.packages.standard,
          premium: service.packages.find(p => p.name === 'premium') || formData.packages.premium
        }
      });
      setExistingImages(service.images || []);
    } catch (error) {
      toast.error('Failed to load service');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
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
    setIsSubmitting(true);
    try {
      const packages = [
        { name: 'basic', ...formData.packages.basic },
        { name: 'standard', ...formData.packages.standard },
        { name: 'premium', ...formData.packages.premium }
      ];

      await serviceService.updateService(id!, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        tags: formData.tags,
        packages,
        serviceImages: images,
        keepExistingImages: existingImages.length > 0 && images.length === 0 ? 'true' : 'false'
      });

      toast.success('Service updated successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update service');
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
            value={formData.packages[packageName].title}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              packages: { ...prev.packages, [packageName]: { ...prev.packages[packageName], title: e.target.value } }
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
              packages: { ...prev.packages, [packageName]: { ...prev.packages[packageName], price: parseInt(e.target.value) } }
            }))}
          />
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.packages[packageName].description}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            packages: { ...prev.packages, [packageName]: { ...prev.packages[packageName], description: e.target.value } }
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
              packages: { ...prev.packages, [packageName]: { ...prev.packages[packageName], deliveryTime: parseInt(e.target.value) } }
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
              packages: { ...prev.packages, [packageName]: { ...prev.packages[packageName], revisions: parseInt(e.target.value) } }
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
                value={feature}
                onChange={(e) => updateFeature(packageName, index, e.target.value)}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(packageName, index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => addFeature(packageName)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Feature
          </Button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold">Edit Service</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Service Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                maxLength={100}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
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
                  value={formData.subcategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span key={tag} className="bg-muted px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <Label>Images</Label>
              {existingImages.length > 0 && (
                <div className="flex gap-2 mb-2">
                  {existingImages.map((img, idx) => (
                    <img key={idx} src={img} alt="" className="w-20 h-20 object-cover rounded" />
                  ))}
                </div>
              )}
              <Input type="file" accept="image/*" multiple onChange={handleImageChange} />
            </div>
          </CardContent>
        </Card>

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
              <TabsContent value="basic" className="mt-4"><PackageForm packageName="basic" title="Basic Package" /></TabsContent>
              <TabsContent value="standard" className="mt-4"><PackageForm packageName="standard" title="Standard Package" /></TabsContent>
              <TabsContent value="premium" className="mt-4"><PackageForm packageName="premium" title="Premium Package" /></TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditService;