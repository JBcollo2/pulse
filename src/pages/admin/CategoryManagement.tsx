import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Tags, Calendar, AlertCircle, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

interface CategoryManagementProps {
  categories: Category[];
  onCreateCategory: (categoryData: { name: string; description?: string }) => Promise<void>;
  isLoading: boolean;
  error?: string;
  successMessage?: string;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({
  categories,
  onCreateCategory,
  isLoading,
  error,
  successMessage
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const categoryData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined
    };

    await onCreateCategory(categoryData);
    
    // Reset form after successful creation
    if (!error) {
      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {successMessage && (
        <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Create Category Section */}
      <Card className="shadow-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800 dark:text-gray-200">
              <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/20">
                <Plus className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              Create New Category
            </CardTitle>
            {!showCreateForm && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            )}
          </div>
        </CardHeader>
        
        {showCreateForm && (
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter category name"
                    disabled={isLoading}
                    className="border-gray-300 dark:border-gray-600 focus:border-pink-500 focus:ring-pink-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter category description"
                    disabled={isLoading}
                    rows={3}
                    className="border-gray-300 dark:border-gray-600 focus:border-pink-500 focus:ring-pink-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !formData.name.trim()}
                  className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex-1 md:flex-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Category
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ name: '', description: '' });
                  }}
                  disabled={isLoading}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Categories List */}
      <Card className="shadow-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800 dark:text-gray-200">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Tags className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            Existing Categories
            <span className="ml-2 px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
              {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {isLoading && categories.length === 0 ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                <p className="text-gray-700 dark:text-gray-300">Loading categories...</p>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tags className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No categories found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Create your first category to organize events better.
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Category
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className={cn(
                    "p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 hover:shadow-md transition-all duration-300 group"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                        <Tags className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {category.name}
                      </h3>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                      >
                        <Edit className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                      </Button>
                    </div>
                  </div>
                  
                  {category.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                      {category.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Created {formatDate(category.created_at)}</span>
                    </div>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryManagement;