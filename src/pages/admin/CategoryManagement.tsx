import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Tags, Calendar, AlertCircle, CheckCircle, Sparkles, RefreshCw, Lightbulb, Info, X, HelpCircle, TrendingUp, Eye, Zap, Star, Palette, Wand2, FolderOpen, Edit3, Trash2, Save, Clock, Hash } from 'lucide-react';
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

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  
  const iconMap = {
    'technology': '💻', 'tech': '💻', 'music': '🎵', 'concert': '🎤', 
    'sports': '⚽', 'fitness': '💪', 'business': '💼', 'art': '🎨',
    'food': '🍽️', 'education': '📚', 'health': '🏥', 'travel': '✈️',
    'gaming': '🎮', 'fashion': '👗', 'photography': '📸', 'outdoor': '🏔️',
    'night': '🌙', 'bootcamp': '🎓', 'agricultural': '🌾', 'farm': '🚜'
  };

  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key) || key.includes(name)) {
      return icon;
    }
  }

  const genericIcons = ['🎯', '⭐', '🎪', '🎭', '🎨', '🎵', '🎮', '🎊', '🎁', '🔥', '💫', '🌟', '✨', '💎', '🏆'];
  const charCode = categoryName && categoryName.length > 0 ? categoryName.charCodeAt(0) : 0;
  return genericIcons[Math.abs(charCode) % genericIcons.length];
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
      {similarCategoriesWarning && (
        <Alert variant="destructive" className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-900 dark:text-amber-200">
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
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Create Anyway
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSimilarCategoriesWarning(null)}
                  className="border-amber-400 hover:bg-amber-50"
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
        <Card className="shadow-xl border-teal-200 dark:border-teal-700 bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-teal-900/20 dark:via-cyan-900/20 dark:to-emerald-900/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-teal-900 dark:text-teal-100">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg">
                  <HelpCircle className="w-5 h-5" />
                </div>
                Quick Guide: Category Management
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowGuide(false)}
                className="text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-teal-200/50 dark:border-teal-700/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md">1</div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1.5 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      Create Categories
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">Use AI to generate category names, descriptions, and keywords automatically. Just describe what you want!</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-teal-200/50 dark:border-teal-700/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md">2</div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1.5 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Edit & Enhance
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">Click Edit on any category to modify it. Use the AI enhance button to improve descriptions with one click.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-teal-200/50 dark:border-teal-700/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md">3</div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1.5 flex items-center gap-2">
                      <Tags className="w-4 h-4 text-amber-600" />
                      Organize Events
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">Categories help you organize and filter your events. Assign categories when creating or editing events.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-teal-200/50 dark:border-teal-700/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-rose-600 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md">4</div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1.5 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      Delete Safely
                    </h4>
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
          className="border-teal-300 dark:border-teal-600 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Show Guide
        </Button>
      )}

      {/* Create Category Section */}
      <Card className="shadow-xl border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 overflow-hidden">
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
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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
                <div className="p-5 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700 shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-md">
                      <Wand2 className="w-5 h-5 text-white" />
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
                          className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          {isGeneratingSuggestion ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating AI Suggestion...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-4 h-4 mr-2" />
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
                <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700 shadow-sm">
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
                    className="border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="submit"
                  disabled={isLoading || !formData.name.trim()}
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
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
      <Card className="shadow-xl border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-full blur-3xl -z-0"></div>
        <CardHeader className="pb-4 relative z-10">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800 dark:text-gray-200">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg">
              <FolderOpen className="w-5 h-5" />
            </div>
            Existing Categories
            <span className="ml-2 px-3 py-1 text-xs font-medium bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
              {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          {isLoading && categories.length === 0 ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                <p className="text-gray-700 dark:text-gray-300">Loading categories...</p>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No categories found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Create your first category to organize events better.
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Category
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={cn(
                    "p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 hover:shadow-lg transition-all duration-300 relative overflow-hidden",
                    editingCategory === category.id && "ring-2 ring-purple-500"
                  )}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 rounded-full blur-2xl -z-0"></div>
                  
                  {editingCategory === category.id ? (
                    <div className="space-y-3 relative z-10">
                      {editAiSuggestion && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Wand2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
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
                        className="text-sm"
                      />
                      <Textarea
                        value={editFormData.description}
                        name="description"
                        onChange={handleEditInputChange}
                        placeholder="Description"
                        rows={2}
                        className="text-xs resize-none"
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
                              <Wand2 className="w-3 h-3 mr-1" />
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
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          <Save className="w-3 h-3 mr-1" />
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
                      <div className="flex items-start justify-between mb-3 relative z-10">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">{getCategoryIcon(category.name)}</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {category.name}
                            {category.ai_description_enhanced && (
                              <Sparkles className="w-3 h-3 text-purple-500 inline-block ml-1" />
                            )}
                          </h3>
                        </div>
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-800 dark:text-gray-200 mb-3 line-clamp-2 leading-relaxed font-medium relative z-10">
                          {category.description}
                        </p>
                      )}
                      {category.ai_suggested_keywords && category.ai_suggested_keywords.length > 0 && (
                        <div className="mb-3 relative z-10">
                          <div className="flex flex-wrap gap-1">
                            {category.ai_suggested_keywords.slice(0, 3).map((keyword, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 rounded-full text-xs font-medium flex items-center gap-1">
                                <Hash className="w-2 h-2" />
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3 relative z-10">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Created {formatDate(category.created_at)}</span>
                        </div>
                        <span className="px-2 py-1 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                          Active
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-600 relative z-10">
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
                            <Wand2 className="w-3 h-3" />
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
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      {category.latest_insight && (
                        <div className="mt-3 p-2 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded text-xs border border-indigo-200 dark:border-indigo-700 relative z-10">
                          <div className="flex items-center gap-1 mb-1">
                            <Lightbulb className="w-3 h-3 text-indigo-600" />
                            <span className="font-medium text-indigo-700 dark:text-indigo-300">AI Insight</span>
                          </div>
                          <p className="text-gray-800 dark:text-gray-200 line-clamp-2 leading-relaxed">
                            {category.latest_insight.insights_text}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {deletingCategory && deleteImpact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full shadow-2xl">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                Confirm Deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                {deleteImpact.warning || 'Are you sure you want to delete this category?'}
              </div>
              {deleteImpact.impact && deleteImpact.impact.affected_events > 0 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-700">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                    <Info className="w-4 h-4 inline mr-1" />
                    This will affect <strong>{deleteImpact.impact.affected_events}</strong> event(s)
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleConfirmDelete(deletingCategory)}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
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