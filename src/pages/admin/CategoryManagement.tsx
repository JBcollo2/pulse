import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, Plus, Tags, Calendar, AlertCircle, CheckCircle, 
  Sparkles, RefreshCw, Lightbulb, Info, X, HelpCircle, 
  Trash2, Edit3, Zap, Users, TrendingUp, Star, Palette,
  MapPin, Music, Coffee, Camera, GamepadIcon, GraduationCap,
  Briefcase, Heart, ShoppingBag, Utensils
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  event_count?: number;
  color_scheme?: string;
  icon?: string;
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

// Icon mapping for categories
const categoryIcons: { [key: string]: React.ReactNode } = {
  'Outdoor Adventures': <MapPin className="w-5 h-5" />,
  'Tech Summit': <Zap className="w-5 h-5" />,
  'Bootcamp Course': <GraduationCap className="w-5 h-5" />,
  'Fashion Show': <ShoppingBag className="w-5 h-5" />,
  'Travel Events': <MapPin className="w-5 h-5" />,
  'Farm Events': <Utensils className="w-5 h-5" />,
  'Music Fest': <Music className="w-5 h-5" />,
  'Night Life': <Coffee className="w-5 h-5" />,
  'default': <Tags className="w-5 h-5" />
};

// Color schemes for categories
const colorSchemes = [
  { bg: 'from-blue-500 to-cyan-500', text: 'text-white', border: 'border-blue-400' },
  { bg: 'from-purple-500 to-pink-500', text: 'text-white', border: 'border-purple-400' },
  { bg: 'from-green-500 to-emerald-500', text: 'text-white', border: 'border-green-400' },
  { bg: 'from-orange-500 to-red-500', text: 'text-white', border: 'border-orange-400' },
  { bg: 'from-indigo-500 to-purple-500', text: 'text-white', border: 'border-indigo-400' },
  { bg: 'from-teal-500 to-cyan-500', text: 'text-white', border: 'border-teal-400' },
];

const getCategoryIcon = (categoryName: string): React.ReactNode => {
  return categoryIcons[categoryName] || categoryIcons['default'];
};

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
  aiState,
  getAIStateForCategory,
  getCurrentAISuggestion,
  getSimilarCategories,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: ''
  });
  const [enhancedDescription, setEnhancedDescription] = useState<string | null>(null);
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[] | null>(null);
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
      } else if (response?.suggestion) {
        setAiSuggestion({
          name: response.suggestion.name || '',
          description: response.suggestion.description || '',
          keywords: response.suggestion.keywords || [],
          ai_generated: true
        });
      } else if (response?.name || response?.description) {
        setAiSuggestion({
          name: response.name || '',
          description: response.description || '',
          keywords: response.keywords || [],
          ai_generated: true
        });
      }
    } catch (err) {
      console.error('Error getting AI suggestion:', err);
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
      } else if (response?.enhanced_description) {
        setEditAiSuggestion({
          name: editFormData.name,
          description: response.enhanced_description,
          keywords: [],
          ai_generated: true
        });
      }
    } catch (err) {
      console.error('Error getting edit AI suggestion:', err);
    } finally {
      setIsGeneratingEditSuggestion(false);
    }
  };

  const handleReSuggest = async () => {
    setAiSuggestion(null);
    await handleGetAISuggestion();
  };

  const handleReSuggestEdit = async (categoryId: number) => {
    setEditAiSuggestion(null);
    await handleGetEditAISuggestion(categoryId);
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

  const handleEnhanceDescription = async (categoryId: number) => {
    if (!onUpdateCategory) return;
    try {
      const response = await onUpdateCategory(categoryId, { action: 'enhance_description' });
      if (response?.data?.enhanced || response?.enhanced_description) {
        setEnhancedDescription(response.data?.enhanced || response.enhanced_description);
      }
    } catch (err) {
      console.error('Error enhancing description:', err);
    }
  };

  const handleUpdateKeywords = async (categoryId: number) => {
    if (!onUpdateCategory) return;
    try {
      const response = await onUpdateCategory(categoryId, { action: 'generate_keywords' });
      if (response?.data?.suggested || response?.suggested_keywords) {
        setSuggestedKeywords(response.data?.suggested || response.suggested_keywords);
      }
    } catch (err) {
      console.error('Error updating keywords:', err);
    }
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
      console.error('Error saving edit:', err);
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
      console.error('Error deleting category:', err);
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

      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
          Manage Categories
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
          Create and manage event categories with AI assistance. Organize your events efficiently with smart categorization.
        </p>
      </div>

      {/* Quick Guide Panel */}
      {showGuide && (
        <Card className="shadow-xl border-blue-100 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-3 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200/20 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="flex items-center justify-between relative z-10">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-blue-900 dark:text-blue-100">
                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg">
                  <HelpCircle className="w-6 h-6" />
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
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Create Categories</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      Use AI to generate category names, descriptions, and keywords automatically. Just describe what you want!
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-lg">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Edit & Enhance</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      Click Edit on any category to modify it. Use AI to enhance descriptions and generate keywords with one click.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-lg">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Organize Events</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      Categories help you organize and filter your events. Assign categories when creating or editing events.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-lg">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete Safely</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      Before deleting, the system checks how many events use that category to prevent accidental data loss.
                    </p>
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
          className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg shadow-sm"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Show Guide
        </Button>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Create Category Section */}
        <div className="lg:col-span-2">
          <Card className="shadow-xl border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800 dark:text-gray-200">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                    <Plus className="w-5 h-5" />
                  </div>
                  Create New Category
                </CardTitle>
                {!showCreateForm && (
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                    disabled={isLoading}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                )}
              </div>
            </CardHeader>
            {showCreateForm && (
              <CardContent className="space-y-6 pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* AI Suggestion Section */}
                  {!aiSuggestion && (
                    <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200 dark:border-purple-700 backdrop-blur-sm">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white shadow-lg">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-lg">Get AI Assistance</h4>
                          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                            Describe what kind of category you want to create, and AI will suggest a complete category with name, description, and keywords.
                          </p>
                          <div className="space-y-3">
                            <Textarea
                              value={inputForSuggestion}
                              onChange={(e) => setInputForSuggestion(e.target.value)}
                              placeholder="E.g., 'I want a category for tech conferences and workshops' or 'Categories for music festivals'"
                              rows={3}
                              className="text-sm bg-white/80 dark:bg-gray-800/80 border-purple-200 dark:border-purple-700 focus:border-purple-500 focus:ring-purple-500 rounded-lg resize-none backdrop-blur-sm"
                            />
                            <Button
                              type="button"
                              onClick={handleGetAISuggestion}
                              disabled={isGeneratingSuggestion || isLoading || !inputForSuggestion.trim()}
                              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg py-3"
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
                    <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-700 backdrop-blur-sm">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white shadow-lg">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-lg">AI Suggestion Applied</h4>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                              The form has been auto-filled with AI suggestions. You can edit the fields or regenerate new suggestions.
                            </p>
                            {aiSuggestion.keywords && aiSuggestion.keywords.length > 0 && (
                              <div className="mt-4">
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Suggested Keywords:</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {aiSuggestion.keywords.map((keyword: string, idx: number) => (
                                    <Badge key={idx} variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700">
                                      {keyword}
                                    </Badge>
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
                          className="flex-shrink-0 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        onClick={handleReSuggest}
                        disabled={isGeneratingSuggestion || isLoading}
                        variant="outline"
                        size="sm"
                        className="border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
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
                  <div className="grid gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        Category Name *
                        {aiSuggestion && <Sparkles className="w-4 h-4 text-purple-500" />}
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
                        className="border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 rounded-lg backdrop-blur-sm"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="description" className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        Description (Optional)
                        {aiSuggestion && <Sparkles className="w-4 h-4 text-purple-500" />}
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Enter category description"
                        disabled={isLoading}
                        rows={4}
                        className="border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 rounded-lg resize-none backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="submit"
                      disabled={isLoading || !formData.name.trim()}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg py-3"
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
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <Card className="shadow-xl border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800 dark:text-gray-200">
                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
                Category Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Categories</span>
                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                  {categories.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50/50 dark:bg-green-900/20 rounded-lg border border-green-200/50 dark:border-green-700/50">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Enhanced</span>
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200">
                  {categories.filter(cat => cat.ai_description_enhanced).length}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg border border-purple-200/50 dark:border-purple-700/50">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">With Keywords</span>
                <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200">
                  {categories.filter(cat => cat.ai_suggested_keywords && cat.ai_suggested_keywords.length > 0).length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-xl border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800 dark:text-gray-200">
                <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
                  <Zap className="w-5 h-5" />
                </div>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Category
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                onClick={() => setShowGuide(true)}
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Show Guide
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Categories List */}
      <Card className="shadow-xl border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-b">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800 dark:text-gray-200">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
              <Tags className="w-5 h-5" />
            </div>
            Existing Categories
            <Badge variant="secondary" className="ml-2 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-blue-200 dark:border-blue-700">
              {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
            </Badge>
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
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
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
                      "group relative p-6 rounded-2xl border-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2",
                      expandedCategory === category.id 
                        ? `ring-4 ring-purple-500/50 border-purple-300 dark:border-purple-600` 
                        : `border-gray-200/50 dark:border-gray-700/50 hover:border-${colorScheme.border.split('-')[1]}-300`
                    )}
                  >
                    {editingCategory === category.id ? (
                      <div className="space-y-4">
                        {editAiSuggestion && (
                          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-700 mb-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                AI Enhanced - Auto-filled
                              </span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleReSuggestEdit(category.id)}
                              disabled={isGeneratingEditSuggestion || isLoading}
                              variant="outline"
                              className="w-full text-sm border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
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
                          className="text-sm rounded-lg border-gray-300"
                        />
                        <Textarea
                          value={editFormData.description}
                          name="description"
                          onChange={handleEditInputChange}
                          placeholder="Description"
                          rows={3}
                          className="text-sm rounded-lg resize-none border-gray-300"
                        />
                        {!editAiSuggestion && (
                          <Button
                            size="sm"
                            onClick={() => handleGetEditAISuggestion(category.id)}
                            disabled={isGeneratingEditSuggestion || isLoading}
                            variant="outline"
                            className="w-full text-sm border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
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
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
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
                            className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Category Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`p-3 rounded-xl bg-gradient-to-r ${colorScheme.bg} text-white shadow-lg`}>
                              {getCategoryIcon(category.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg truncate flex items-center gap-2">
                                {category.name}
                                {category.ai_description_enhanced && (
                                  <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                )}
                              </h3>
                              {category.event_count !== undefined && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Users className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {category.event_count} events
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {category.description && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2 leading-relaxed">
                            {category.description}
                          </p>
                        )}

                        {/* Keywords */}
                        {category.ai_suggested_keywords && category.ai_suggested_keywords.length > 0 && (
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-1">
                              {category.ai_suggested_keywords.slice(0, 4).map((keyword, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="secondary" 
                                  className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700 text-xs"
                                >
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Created {formatDate(category.created_at)}</span>
                          </div>
                          <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700">
                            Active
                          </Badge>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(category)}
                            disabled={isLoading}
                            className="flex-1 text-sm border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg shadow-sm hover:shadow transition-all duration-300"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          {onUpdateCategory && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEnhanceDescription(category.id)}
                              disabled={isLoading}
                              className="flex-1 text-sm border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg shadow-sm hover:shadow transition-all duration-300"
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
                              className="flex-1 text-sm border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg shadow-sm hover:shadow transition-all duration-300"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>

                        {/* AI Insight */}
                        {category.latest_insight && (
                          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span className="font-semibold text-purple-700 dark:text-purple-300 text-sm">AI Insight</span>
                            </div>
                            <p className="text-gray-800 dark:text-gray-200 text-sm line-clamp-2 leading-relaxed">
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
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
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
                  className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
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