import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Tags, Calendar, AlertCircle, CheckCircle, Sparkles, RefreshCw, Lightbulb, Info, X, HelpCircle } from 'lucide-react';
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
      {/* Similar Categories Warning */}
      {similarCategoriesWarning && (
        <Alert variant="destructive" className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
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
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Create Anyway
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSimilarCategoriesWarning(null)}
                  className="border-yellow-300"
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
        <Card className="shadow-lg border-blue-200 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-blue-900 dark:text-blue-100">
                <div className="p-2 rounded-lg bg-blue-500 text-white">
                  <HelpCircle className="w-5 h-5" />
                </div>
                Quick Guide: Category Management
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowGuide(false)}
                className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">Create Categories</h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">Use AI to generate category names, descriptions, and keywords automatically. Just describe what you want!</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">Edit & Enhance</h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">Click Edit on any category to modify it. Use the AI enhance button to improve descriptions with one click.</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">Organize Events</h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">Categories help you organize and filter your events. Assign categories when creating or editing events.</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">Delete Safely</h4>
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
          className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Show Guide
        </Button>
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* AI Suggestion Section */}
              {!aiSuggestion && (
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                  <div className="flex items-start gap-3 mb-3">
                    <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Get AI Assistance</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                        Describe what kind of category you want to create, and AI will suggest a complete category with name, description, and keywords.
                      </p>
                      <div className="space-y-2">
                        <Textarea
                          value={inputForSuggestion}
                          onChange={(e) => setInputForSuggestion(e.target.value)}
                          placeholder="E.g., 'I want a category for tech conferences and workshops' or 'Categories for music festivals'"
                          rows={2}
                          className="text-sm bg-white dark:bg-gray-800 border-emerald-200 dark:border-emerald-700 focus:border-emerald-500 focus:ring-emerald-500"
                        />
                        <Button
                          type="button"
                          onClick={handleGetAISuggestion}
                          disabled={isGeneratingSuggestion || isLoading || !inputForSuggestion.trim()}
                          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
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
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">AI Suggestion Applied</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          The form has been auto-filled with AI suggestions. You can edit the fields or regenerate new suggestions.
                        </p>
                        {aiSuggestion.keywords && aiSuggestion.keywords.length > 0 && (
                          <div className="mt-3">
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Suggested Keywords:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {aiSuggestion.keywords.map((keyword: string, idx: number) => (
                                <span key={idx} className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded text-xs font-medium">
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
                      className="flex-shrink-0 hover:bg-green-100 dark:hover:bg-green-900/30"
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
                    className="border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
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
                    {aiSuggestion && <Sparkles className="w-3 h-3 text-emerald-500" />}
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
                    className="border-gray-300 dark:border-gray-600 focus:border-pink-500 focus:ring-pink-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    Description (Optional)
                    {aiSuggestion && <Sparkles className="w-3 h-3 text-emerald-500" />}
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
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="submit"
                  disabled={isLoading || !formData.name.trim()}
                  className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex-1"
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
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={cn(
                    "p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 hover:shadow-md transition-all duration-300",
                    expandedCategory === category.id && "ring-2 ring-pink-500"
                  )}
                >
                  {editingCategory === category.id ? (
                    <div className="space-y-3">
                      {editAiSuggestion && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                              AI Enhanced - Auto-filled
                            </span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleReSuggestEdit(category.id)}
                            disabled={isGeneratingEditSuggestion || isLoading}
                            variant="outline"
                            className="mt-2 w-full text-xs border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
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
                          className="w-full text-xs border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
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
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
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
                          <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Tags className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {category.name}
                            {category.ai_description_enhanced && (
                              <Sparkles className="w-3 h-3 text-emerald-500 inline-block ml-1" />
                            )}
                          </h3>
                        </div>
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-800 dark:text-gray-200 mb-3 line-clamp-2 leading-relaxed font-medium">
                          {category.description}
                        </p>
                      )}
                      {category.ai_suggested_keywords && category.ai_suggested_keywords.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {category.ai_suggested_keywords.slice(0, 3).map((keyword, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded text-xs font-medium">
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
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                          Active
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(category)}
                          disabled={isLoading}
                          className="flex-1 text-xs border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium shadow-sm hover:shadow transition-all duration-300"
                        >
                          Edit
                        </Button>
                        {onUpdateCategory && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEnhanceDescription(category.id)}
                            disabled={isLoading}
                            className="flex-1 text-xs border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-medium shadow-sm hover:shadow transition-all duration-300"
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
                            Delete
                          </Button>
                        )}
                      </div>
                      {category.latest_insight && (
                        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs border border-blue-200 dark:border-blue-700">
                          <div className="flex items-center gap-1 mb-1">
                            <Lightbulb className="w-3 h-3 text-blue-600" />
                            <span className="font-medium text-blue-700 dark:text-blue-300">AI Insight</span>
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
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
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
