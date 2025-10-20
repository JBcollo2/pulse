import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Tags, Calendar, AlertCircle, CheckCircle, Sparkles, RefreshCw, Lightbulb, Info, X, HelpCircle, TrendingUp, Eye, Zap, Star, MapPin, Music, Coffee, Camera, GamepadIcon, GraduationCap, Briefcase, ShoppingBag, Utensils, Trash2, Edit3 } from 'lucide-react';
import { cn } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  ai_description_enhanced?: boolean;
  ai_suggested_keywords?: string[];
  latest_insight?: {
    insights_text: string;
    stats: any;
    ai_powered: boolean;
  };
}

interface CategoryData {
  name?: string;
  description?: string;
  action?: string;
  data?: {
    name: string;
    description?: string;
    keywords?: string[];
  };
  confirm_despite_similar?: boolean;
}

interface CategoryManagementProps {
  categories: Category[];
  onCreateCategory: (categoryData: CategoryData) => Promise<any>;
  onUpdateCategory?: (categoryId: number, categoryData: any) => Promise<any>;
  onDeleteCategory?: (categoryId: number, action?: string) => Promise<void>;
  isLoading: boolean;
  error?: string;
  successMessage?: string;
  aiState?: any;
  getAIStateForCategory?: (categoryId: number) => any;
  getCurrentAISuggestion?: () => any;
  getSimilarCategories?: () => any;
}

// Enhanced icon mapping for categories
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  
  const iconMap: { [key: string]: React.ReactNode } = {
    // Technology & Digital
    'technology': <Zap className="w-4 h-4" />, 'tech': <Zap className="w-4 h-4" />, 'digital': <Zap className="w-4 h-4" />,
    'software': <Zap className="w-4 h-4" />, 'coding': <Zap className="w-4 h-4" />, 'programming': <Zap className="w-4 h-4" />,
    
    // Music & Entertainment
    'music': <Music className="w-4 h-4" />, 'concert': <Music className="w-4 h-4" />, 'festival': <Music className="w-4 h-4" />,
    'entertainment': <Music className="w-4 h-4" />, 'band': <Music className="w-4 h-4" />,
    
    // Sports & Fitness
    'sports': <Eye className="w-4 h-4" />, 'fitness': <Eye className="w-4 h-4" />, 'gym': <Eye className="w-4 h-4" />,
    
    // Business & Professional
    'business': <Briefcase className="w-4 h-4" />, 'networking': <Briefcase className="w-4 h-4" />,
    'conference': <Briefcase className="w-4 h-4" />, 'workshop': <Briefcase className="w-4 h-4" />,
    
    // Education
    'education': <GraduationCap className="w-4 h-4" />, 'bootcamp': <GraduationCap className="w-4 h-4" />,
    'course': <GraduationCap className="w-4 h-4" />, 'training': <GraduationCap className="w-4 h-4" />,
    
    // Food & Dining
    'food': <Utensils className="w-4 h-4" />, 'dining': <Utensils className="w-4 h-4" />, 'restaurant': <Utensils className="w-4 h-4" />,
    
    // Travel & Outdoor
    'travel': <MapPin className="w-4 h-4" />, 'outdoor': <MapPin className="w-4 h-4" />, 'adventure': <MapPin className="w-4 h-4" />,
    
    // Fashion
    'fashion': <ShoppingBag className="w-4 h-4" />, 'clothing': <ShoppingBag className="w-4 h-4" />, 'style': <ShoppingBag className="w-4 h-4" />,
    
    // Night Life
    'night': <Coffee className="w-4 h-4" />, 'party': <Coffee className="w-4 h-4" />, 'club': <Coffee className="w-4 h-4" />,
    
    // Photography & Arts
    'photography': <Camera className="w-4 h-4" />, 'art': <Camera className="w-4 h-4" />, 'gallery': <Camera className="w-4 h-4" />,
    
    // Gaming
    'gaming': <GamepadIcon className="w-4 h-4" />, 'esports': <GamepadIcon className="w-4 h-4" />,
    
    // Agriculture
    'farm': <Utensils className="w-4 h-4" />, 'agricultural': <Utensils className="w-4 h-4" />,
  };

  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key)) {
      return icon;
    }
  }

  return <Tags className="w-4 h-4" />;
};

// Color schemes for categories
const colorSchemes = [
  { bg: 'from-blue-500 to-cyan-500', text: 'text-white', border: 'border-blue-400' },
  { bg: 'from-purple-500 to-pink-500', text: 'text-white', border: 'border-purple-400' },
  { bg: 'from-green-500 to-emerald-500', text: 'text-white', border: 'border-green-400' },
  { bg: 'from-orange-500 to-amber-500', text: 'text-white', border: 'border-orange-400' },
  { bg: 'from-indigo-500 to-violet-500', text: 'text-white', border: 'border-indigo-400' },
  { bg: 'from-teal-500 to-cyan-500', text: 'text-white', border: 'border-teal-400' },
];

const getColorScheme = (categoryId: number) => {
  return colorSchemes[categoryId % colorSchemes.length];
};

const CategoryManagement: React.FC<CategoryManagementProps> = ({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  isLoading,
  error,
  successMessage,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: ''
  });
  const [deletingCategory, setDeletingCategory] = useState<number | null>(null);
  const [deleteImpact, setDeleteImpact] = useState<any>(null);
  const [editAiSuggestion, setEditAiSuggestion] = useState<any>(null);
  const [isGeneratingEditSuggestion, setIsGeneratingEditSuggestion] = useState(false);
  const [similarCategoriesWarning, setSimilarCategoriesWarning] = useState<any>(null);
  const [inputForSuggestion, setInputForSuggestion] = useState('');

  useEffect(() => {
    if (aiSuggestion && aiSuggestion.name) {
      setFormData({
        name: aiSuggestion.name || '',
        description: aiSuggestion.description || ''
      });
    }
  }, [aiSuggestion]);

  useEffect(() => {
    if (editAiSuggestion && editAiSuggestion.name) {
      setEditFormData(prev => ({
        name: editAiSuggestion.name || prev.name,
        description: editAiSuggestion.description || prev.description
      }));
    }
  }, [editAiSuggestion]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGetAISuggestion = async () => {
    const inputText = inputForSuggestion.trim() || formData.description.trim() || formData.name.trim();
    if (!inputText) return;

    setIsGeneratingSuggestion(true);
    setSimilarCategoriesWarning(null);

    try {
      const response = await onCreateCategory({
        action: 'suggest',
        description: inputText
      });
      if (response?.action === 'suggestion_generated' && response.data) {
        setAiSuggestion({
          name: response.data.name || '',
          description: response.data.description || '',
          keywords: response.data.keywords || [],
          ai_generated: true
        });
      }
    } catch (err) {
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  const handleGetEditAISuggestion = async (categoryId: number) => {
    if (!editFormData.description.trim() && !editFormData.name.trim()) return;
    setIsGeneratingEditSuggestion(true);
    try {
      const response = await onUpdateCategory?.(categoryId, {
        action: 'enhance_description',
        description: editFormData.description || editFormData.name
      });
      if (response?.action === 'description_enhanced' && response.data) {
        setEditAiSuggestion({
          name: editFormData.name,
          description: response.data.enhanced || response.data.enhanced_description || '',
          keywords: [],
          ai_generated: true
        });
      }
    } catch (err) {
    } finally {
      setIsGeneratingEditSuggestion(false);
    }
  };

  const handleSaveWithAI = async () => {
    if (!formData.name.trim()) return;

    setSimilarCategoriesWarning(null);

    const categoryData: any = {
      action: 'create',
      name: formData.name.trim(),
      description: formData.description.trim() || undefined
    };
    if (aiSuggestion?.keywords && aiSuggestion.keywords.length > 0) {
      categoryData.keywords = aiSuggestion.keywords;
    }
    const result = await onCreateCategory(categoryData);
    if (result?.action === 'similar_categories_found') {
      setSimilarCategoriesWarning({
        similar: result.data,
        warning: result.warning
      });
      return;
    }
    if (result?.action === 'category_created' || result?.success) {
      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
      setAiSuggestion(null);
      setInputForSuggestion('');
      setSimilarCategoriesWarning(null);
    }
  };

  const handleConfirmDespiteSimilar = async () => {
    if (!formData.name.trim()) return;

    const categoryData: any = {
      action: 'create',
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      confirm_despite_similar: true
    };
    if (aiSuggestion?.keywords && aiSuggestion.keywords.length > 0) {
      categoryData.keywords = aiSuggestion.keywords;
    }
    const result = await onCreateCategory(categoryData);
    if (result?.action === 'category_created' || result?.success) {
      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
      setAiSuggestion(null);
      setInputForSuggestion('');
      setSimilarCategoriesWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSaveWithAI();
  };

  const handleSaveEdit = async (categoryId: number) => {
    if (!onUpdateCategory) return;
    try {
      const updateData: any = {
        action: 'update',
        name: editFormData.name,
        description: editFormData.description
      };
      if (editAiSuggestion?.keywords && editAiSuggestion.keywords.length > 0) {
        updateData.keywords = editAiSuggestion.keywords;
      }
      await onUpdateCategory(categoryId, updateData);
      setEditingCategory(null);
      setEditFormData({ name: '', description: '' });
      setEditAiSuggestion(null);
    } catch (err) {
    }
  };

  const handleCheckDeleteImpact = async (categoryId: number) => {
    if (!onDeleteCategory) return;
    setDeletingCategory(categoryId);
    try {
      await onDeleteCategory(categoryId, 'check_impact');
      setDeleteImpact({
        warning: 'This action cannot be undone.',
        impact: { affected_events: 0 }
      });
    } catch (err) {
      setDeletingCategory(null);
    }
  };

  const handleConfirmDelete = async (categoryId: number) => {
    if (!onDeleteCategory) return;
    try {
      await onDeleteCategory(categoryId, 'confirm_delete');
      setDeletingCategory(null);
      setDeleteImpact(null);
    } catch (err) {
    }
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category.id);
    setEditFormData({
      name: category.name,
      description: category.description || ''
    });
    setEditAiSuggestion(null);
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
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50/80 backdrop-blur-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-900/20 backdrop-blur-sm">
          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription className="text-emerald-800 dark:text-emerald-200">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Similar Categories Warning */}
      {similarCategoriesWarning && (
        <Alert variant="destructive" className="border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <div className="space-y-2">
              <p className="font-medium">{similarCategoriesWarning.warning}</p>
              {similarCategoriesWarning.similar && similarCategoriesWarning.similar.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm mb-1">Similar categories found:</p>
                  <ul className="list-disc list-inside text-sm">
                    {similarCategoriesWarning.similar.map((cat: any, idx: number) => (
                      <li key={idx}>{cat.name}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleConfirmDespiteSimilar}
                  disabled={isLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Create Anyway
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSimilarCategoriesWarning(null)}
                  className="border-amber-300 text-amber-700 dark:text-amber-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Guide Panel */}
      {showGuide && (
        <Card className="shadow-xl border-blue-100 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-3 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200/20 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="flex items-center justify-between relative z-10">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-blue-900 dark:text-blue-100">
                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg">
                  <HelpCircle className="w-5 h-5" />
                </div>
                Quick Guide: Category Management
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowGuide(false)}
                className="text-blue-600 dark:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 relative z-10">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-blue-200/50 dark:border-blue-700/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1.5">Create Categories</h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">Use AI to generate category names, descriptions, and keywords automatically. Just describe what you want!</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-blue-200/50 dark:border-blue-700/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1.5">Edit & Enhance</h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">Click Edit on any category to modify it. Use AI to enhance descriptions and generate keywords with one click.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-blue-200/50 dark:border-blue-700/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md">
                    <Tags className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1.5">Organize Events</h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">Categories help you organize and filter your events. Assign categories when creating or editing events.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-blue-200/50 dark:border-blue-700/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1.5">Delete Safely</h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">Before deleting, the system checks how many events use that category to prevent accidental data loss.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!showGuide && (
        <Button
          onClick={() => setShowGuide(true)}
          variant="outline"
          size="sm"
          className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Show Guide
        </Button>
      )}

      {/* Create Category Section */}
      <Card className="shadow-xl border-purple-200 dark:border-purple-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl -z-0"></div>
        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800 dark:text-gray-200">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                <Plus className="w-5 h-5" />
              </div>
              Create New Category
            </CardTitle>
            {!showCreateForm && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            )}
          </div>
        </CardHeader>
        
        {showCreateForm && (
          <CardContent className="space-y-4 relative z-10">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* AI Suggestion Section */}
              {!aiSuggestion && (
                <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-700 shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-md">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                        Get AI Assistance
                        <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full font-medium">Smart</span>
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                        Describe what kind of category you want to create, and AI will suggest a complete category with name, description, and keywords.
                      </p>
                      <div className="space-y-2">
                        <Textarea
                          value={inputForSuggestion}
                          onChange={(e) => setInputForSuggestion(e.target.value)}
                          placeholder="E.g., 'I want a category for tech conferences and workshops' or 'Categories for music festivals'"
                          rows={2}
                          className="text-sm bg-white dark:bg-gray-800 border-purple-200 dark:border-purple-700 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                        />
                        <Button
                          type="button"
                          onClick={handleGetAISuggestion}
                          disabled={isGeneratingSuggestion || isLoading || !inputForSuggestion.trim()}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          {isGeneratingSuggestion ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating AI Suggestion...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate & Auto-fill Form
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Suggestion Applied Banner */}
              {aiSuggestion && (
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                          AI Suggestion Applied
                          <Star className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          The form has been auto-filled with AI suggestions. You can edit the fields or regenerate new suggestions.
                        </p>
                        {aiSuggestion.keywords && aiSuggestion.keywords.length > 0 && (
                          <div className="mt-3">
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Suggested Keywords:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {aiSuggestion.keywords.map((keyword: string, idx: number) => (
                                <span key={idx} className="px-3 py-1 bg-white/80 dark:bg-gray-800/80 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium border border-emerald-200 dark:border-emerald-700 shadow-sm">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAiSuggestion(null);
                        setFormData({ name: '', description: '' });
                      }}
                      className="flex-shrink-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleGetAISuggestion()}
                    disabled={isGeneratingSuggestion || isLoading}
                    variant="outline"
                    size="sm"
                    className="border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  >
                    {isGeneratingSuggestion ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate Suggestion
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    Category Name *
                    {aiSuggestion && <Sparkles className="w-3 h-3 text-purple-500" />}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter category name"
                    disabled={isLoading}
                    required
                    className="border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    Description (Optional)
                    {aiSuggestion && <Sparkles className="w-3 h-3 text-purple-500" />}
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter category description"
                    disabled={isLoading}
                    rows={3}
                    className="border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="submit"
                  disabled={isLoading || !formData.name.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Category
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ name: '', description: '' });
                    setAiSuggestion(null);
                    setInputForSuggestion('');
                    setSimilarCategoriesWarning(null);
                  }}
                  disabled={isLoading}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Categories List */}
      <Card className="shadow-xl border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-b">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800 dark:text-gray-200">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
              <Tags className="w-5 h-5" />
            </div>
            Existing Categories
            <span className="ml-2 px-3 py-1 text-xs font-medium bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 rounded-full border border-blue-200 dark:border-blue-700">
              {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading && categories.length === 0 ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                <p className="text-gray-700 dark:text-gray-300">Loading categories...</p>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Tags className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No categories found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Create your first category to organize events better.
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Category
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const colorScheme = getColorScheme(category.id);
                return (
                  <div
                    key={category.id}
                    className={cn(
                      "group relative p-5 rounded-xl border-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1",
                      "border-gray-200/50 dark:border-gray-700/50 hover:border-purple-300 dark:hover:border-purple-600"
                    )}
                  >
                    {editingCategory === category.id ? (
                      <div className="space-y-3">
                        {editAiSuggestion && (
                          <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700 mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                AI Enhanced - Auto-filled
                              </span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleGetEditAISuggestion(category.id)}
                              disabled={isGeneratingEditSuggestion || isLoading}
                              variant="outline"
                              className="mt-2 w-full text-xs border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            >
                              {isGeneratingEditSuggestion ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Re-generating...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  Regenerate
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                        <Input
                          value={editFormData.name}
                          name="name"
                          onChange={handleEditInputChange}
                          placeholder="Category name"
                          className="text-sm rounded-lg"
                        />
                        <Textarea
                          value={editFormData.description}
                          name="description"
                          onChange={handleEditInputChange}
                          placeholder="Description"
                          rows={2}
                          className="text-xs rounded-lg resize-none"
                        />
                        {!editAiSuggestion && (
                          <Button
                            size="sm"
                            onClick={() => handleGetEditAISuggestion(category.id)}
                            disabled={isGeneratingEditSuggestion || isLoading}
                            variant="outline"
                            className="w-full text-xs border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                          >
                            {isGeneratingEditSuggestion ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Getting AI Enhancement...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 mr-1" />
                                Get AI Enhancement
                              </>
                            )}
                          </Button>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(category.id)}
                            disabled={isLoading}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingCategory(null);
                              setEditFormData({ name: '', description: '' });
                              setEditAiSuggestion(null);
                            }}
                            disabled={isLoading}
                            className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 flex-1">
                            <div className={`p-2 rounded-lg bg-gradient-to-r ${colorScheme.bg} text-white shadow-md`}>
                              {getCategoryIcon(category.name)}
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1">
                              {category.name}
                              {category.ai_description_enhanced && (
                                <Sparkles className="w-3 h-3 text-purple-500" />
                              )}
                            </h3>
                          </div>
                        </div>

                        {category.description && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2 leading-relaxed">
                            {category.description}
                          </p>
                        )}

                        {category.ai_suggested_keywords && category.ai_suggested_keywords.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {category.ai_suggested_keywords.slice(0, 3).map((keyword, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded text-xs font-medium border border-purple-200 dark:border-purple-700">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Created {formatDate(category.created_at)}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-xs font-medium border border-green-200 dark:border-green-700">
                            Active
                          </span>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(category)}
                            disabled={isLoading}
                            className="flex-1 text-xs border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium shadow-sm hover:shadow transition-all duration-300"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          {onUpdateCategory && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGetEditAISuggestion(category.id)}
                              disabled={isLoading}
                              className="flex-1 text-xs border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-medium shadow-sm hover:shadow transition-all duration-300"
                              title="Enhance with AI"
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              AI
                            </Button>
                          )}
                          {onDeleteCategory && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckDeleteImpact(category.id)}
                              disabled={isLoading}
                              className="flex-1 text-xs border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium shadow-sm hover:shadow transition-all duration-300"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>

                        {category.latest_insight && (
                          <div className="mt-3 p-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                            <div className="flex items-center gap-1 mb-1">
                              <Lightbulb className="w-3 h-3 text-purple-600" />
                              <span className="font-medium text-purple-700 dark:text-purple-300 text-xs">AI Insight</span>
                            </div>
                            <p className="text-gray-800 dark:text-gray-200 text-xs line-clamp-2 leading-relaxed">
                              {category.latest_insight.insights_text}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {deletingCategory && deleteImpact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="max-w-md w-full shadow-2xl border-red-200 dark:border-red-800 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
            <CardHeader className="border-b border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
              <CardTitle className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertCircle className="w-6 h-6" />
                Confirm Deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="text-gray-800 dark:text-gray-200 font-medium">
                {deleteImpact.warning || 'Are you sure you want to delete this category?'}
              </div>
              {deleteImpact.impact && deleteImpact.impact.affected_events > 0 && (
                <div className="p-4 bg-amber-50/80 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                    <Info className="w-4 h-4 inline mr-2" />
                    This will affect <strong>{deleteImpact.impact.affected_events}</strong> event(s)
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleConfirmDelete(deletingCategory)}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Confirm Delete'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeletingCategory(null);
                    setDeleteImpact(null);
                  }}
                  disabled={isLoading}
                  className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;