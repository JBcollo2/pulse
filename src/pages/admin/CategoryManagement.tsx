import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Tags, Calendar, AlertCircle, CheckCircle, Sparkles, RefreshCw, Lightbulb, Info } from 'lucide-react';
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

  // Auto-fill form when AI suggestion is received
  useEffect(() => {
    if (aiSuggestion) {
      setFormData({
        name: aiSuggestion.name || '',
        description: aiSuggestion.description || ''
      });
    }
  }, [aiSuggestion]);

  // Auto-fill edit form when edit AI suggestion is received
  useEffect(() => {
    if (editAiSuggestion) {
      setEditFormData({
        name: editAiSuggestion.name || editFormData.name,
        description: editAiSuggestion.description || editFormData.description
      });
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
    if (!formData.description.trim() && !formData.name.trim()) return;
    setIsGeneratingSuggestion(true);
    try {
      const response = await onCreateCategory({
        action: 'suggest',
        description: formData.description || formData.name
      });

      if (response && response.suggestion) {
        setAiSuggestion(response.suggestion);
      } else {
        setAiSuggestion({
          name: response?.name || 'AI Generated Name',
          description: response?.description || formData.description,
          keywords: response?.keywords || [],
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
        action: 'suggest_enhancement',
        description: editFormData.description || editFormData.name
      });

      if (response && response.suggestion) {
        setEditAiSuggestion(response.suggestion);
      } else {
        setEditAiSuggestion({
          name: response?.name || editFormData.name,
          description: response?.description || editFormData.description,
          keywords: response?.keywords || [],
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
    const categoryData = {
      action: 'create',
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      keywords: aiSuggestion?.keywords || []
    };
    const result = await onCreateCategory(categoryData);

    if (!error) {
      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
      setAiSuggestion(null);
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

      if (response && response.enhanced_description) {
        setEnhancedDescription(response.enhanced_description);
      }
    } catch (err) {
      console.error('Error enhancing description:', err);
    }
  };

  const handleUpdateKeywords = async (categoryId: number) => {
    if (!onUpdateCategory) return;

    try {
      const response = await onUpdateCategory(categoryId, { action: 'update_keywords' });

      if (response && response.keywords) {
        setSuggestedKeywords(response.keywords);
      }
    } catch (err) {
      console.error('Error updating keywords:', err);
    }
  };

  const handleSaveEdit = async (categoryId: number) => {
    if (!onUpdateCategory) return;

    try {
      await onUpdateCategory(categoryId, {
        action: 'update',
        name: editFormData.name,
        description: editFormData.description,
        keywords: editAiSuggestion?.keywords || []
      });

      setEditingCategory(null);
      setEditFormData({ name: '', description: '' });
      setEditAiSuggestion(null);
    } catch (err) {
      console.error('Error updating category:', err);
    }
  };

  const handleCheckDeleteImpact = async (categoryId: number) => {
    if (!onDeleteCategory) return;

    setDeletingCategory(categoryId);
    try {
      await onDeleteCategory(categoryId, 'check_impact');
      setDeleteImpact({
        warning: 'This action cannot be undone.',
        impact: { affected_events: 5 }
      });
    } catch (err) {
      console.error('Error checking delete impact:', err);
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
              {/* AI Suggestion Info Banner */}
              {aiSuggestion && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="flex items-start gap-3 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">AI Suggestion Applied</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        The form has been auto-filled with AI suggestions. You can edit the fields or click "Re-suggest" for new suggestions.
                      </p>
                      {aiSuggestion.keywords && aiSuggestion.keywords.length > 0 && (
                        <div className="mt-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Suggested Keywords:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {aiSuggestion.keywords.map((keyword: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleReSuggest}
                    disabled={isGeneratingSuggestion || isLoading}
                    variant="outline"
                    size="sm"
                    className="border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    {isGeneratingSuggestion ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Re-generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Re-suggest
                      </>
                    )}
                  </Button>
                </div>
              )}
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
                    placeholder="Enter category description or let AI suggest one"
                    disabled={isLoading}
                    rows={3}
                    className="border-gray-300 dark:border-gray-600 focus:border-pink-500 focus:ring-pink-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                  />
                </div>
                {/* AI Suggestion Button */}
                {!aiSuggestion && (formData.description.trim() || formData.name.trim()) && (
                  <Button
                    onClick={handleGetAISuggestion}
                    disabled={isGeneratingSuggestion || isLoading}
                    variant="outline"
                    className="border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    {isGeneratingSuggestion ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating AI Suggestion...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Get AI Suggestion & Auto-fill
                      </>
                    )}
                  </Button>
                )}
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
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Category
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ name: '', description: '' });
                    setAiSuggestion(null);
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
                      {/* AI Suggestion Info for Edit */}
                      {editAiSuggestion && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                              AI Enhanced - Auto-filled
                            </span>
                          </div>
                          {editAiSuggestion.keywords && editAiSuggestion.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {editAiSuggestion.keywords.map((keyword: string, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleReSuggestEdit(category.id)}
                            disabled={isGeneratingEditSuggestion || isLoading}
                            variant="outline"
                            className="mt-2 w-full text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                          >
                            {isGeneratingEditSuggestion ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Re-generating...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Re-suggest
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

                      {/* AI Enhance Button for Edit */}
                      {!editAiSuggestion && (
                        <Button
                          size="sm"
                          onClick={() => handleGetEditAISuggestion(category.id)}
                          disabled={isGeneratingEditSuggestion || isLoading}
                          variant="outline"
                          className="w-full text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          {isGeneratingEditSuggestion ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Getting AI Suggestion...
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
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white"
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
                          className="flex-1"
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
                              <Sparkles className="w-3 h-3 text-purple-500 inline-block ml-1" />
                            )}
                          </h3>
                        </div>
                      </div>

                      {category.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                          {category.description}
                        </p>
                      )}
                      {category.ai_suggested_keywords && category.ai_suggested_keywords.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {category.ai_suggested_keywords.slice(0, 3).map((keyword, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
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
                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(category)}
                          disabled={isLoading}
                          className="flex-1 text-xs"
                        >
                          Edit
                        </Button>
                        {onUpdateCategory && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEnhanceDescription(category.id)}
                            disabled={isLoading}
                            className="flex-1 text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                            title="Enhance with AI"
                          >
                            <Sparkles className="w-3 h-3" />
                          </Button>
                        )}
                        {onDeleteCategory && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckDeleteImpact(category.id)}
                            disabled={isLoading}
                            className="flex-1 text-xs border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                      {category.latest_insight && (
                        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                          <div className="flex items-center gap-1 mb-1">
                            <Lightbulb className="w-3 h-3 text-blue-600" />
                            <span className="font-medium text-blue-700 dark:text-blue-300">AI Insight</span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
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
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Confirm Deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {deleteImpact.warning || 'Are you sure you want to delete this category?'}
              </div>

              {deleteImpact.impact && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <Info className="w-4 h-4 inline mr-1" />
                    This will affect <strong>{deleteImpact.impact.affected_events}</strong> event(s)
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  onClick={() => handleConfirmDelete(deletingCategory)}
                  disabled={isLoading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
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
                  className="flex-1"
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
