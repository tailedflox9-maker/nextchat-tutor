// src/components/Sidebar.tsx
import React, { useState, useMemo } from 'react';
import {
  Settings, Trash2, X, ChevronLeft, ChevronRight, Search, Plus,
  Book, Beaker, Palette, Building, Cpu, Wind, Brain, Check, AlertCircle, ChevronDown, User
} from 'lucide-react';
import { BookProject, APISettings, BookCategory, ModelProvider } from '../types';

interface SidebarProps {
  books: BookProject[];
  currentBookId: string | null;
  onSelectBook: (id: string | null) => void;
  onDeleteBook: (id: string) => void;
  onOpenSettings: () => void;
  onNewBook: () => void;
  onCloseSidebar: () => void;
  isSidebarOpen: boolean;
  isFolded?: boolean;
  onToggleFold?: () => void;
  settings: APISettings;
  onModelChange: (model: string, provider: ModelProvider) => void;
}

const getCategoryIcon = (category?: BookCategory) => {
  switch (category) {
    case 'programming': return Cpu;
    case 'science': return Beaker;
    case 'art': return Palette;
    case 'business': return Building;
    default: return Book;
  }
};

// SVG Icons from public folder with white filter
const GoogleIcon = () => (
  <img src="/gemini.svg" alt="Google AI" className="w-4 h-4 filter brightness-0 invert" />
);

const MistralIcon = () => (
  <img src="/mistral.svg" alt="Mistral AI" className="w-4 h-4 filter brightness-0 invert" />
);

const ZhipuIcon = () => (
  <img src="/zhipu.svg" alt="ZhipuAI" className="w-4 h-4 filter brightness-0 invert" />
);

// Enhanced model configuration with all models
const modelConfig = {
  google: {
    name: "Google AI",
    icon: GoogleIcon,
    models: [
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: 'Fast, lightweight model' },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Enhanced lightweight model' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Balanced speed and capability' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Latest flash model' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Previous generation flash' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Most capable model' },
    ]
  },
  mistral: {
    name: "Mistral AI",
    icon: MistralIcon,
    models: [
      { id: 'open-mistral-7b', name: 'Open Mistral 7B', description: 'Open source 7B model' },
      { id: 'open-mixtral-8x7b', name: 'Open Mixtral 8x7B', description: 'Mixture of experts model' },
      { id: 'mistral-small-latest', name: 'Mistral Small', description: 'Cost-effective model' },
      { id: 'mistral-large-latest', name: 'Mistral Large', description: 'Most powerful model' },
    ]
  },
  zhipu: {
    name: "ZhipuAI",
    icon: ZhipuIcon,
    models: [
      { id: 'glm-4.5-flash', name: 'GLM 4.5 Flash', description: 'Chinese AI model' },
    ]
  }
};

export function Sidebar({
  books,
  currentBookId,
  onSelectBook,
  onDeleteBook,
  onOpenSettings,
  onNewBook,
  onCloseSidebar,
  isFolded = false,
  onToggleFold,
  isSidebarOpen,
  settings,
  onModelChange,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  
  const sortedBooks = useMemo(() => {
    const filtered = books.filter(book =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [books, searchQuery]);

  const hasApiKeyForProvider = (provider: ModelProvider): boolean => {
    switch (provider) {
      case 'google': return !!settings.googleApiKey;
      case 'mistral': return !!settings.mistralApiKey;
      case 'zhipu': return !!settings.zhipuApiKey;
      default: return false;
    }
  };

  const getCurrentModelInfo = () => {
    const provider = modelConfig[settings.selectedProvider];
    const model = provider?.models.find(m => m.id === settings.selectedModel);
    return { provider, model };
  };

  const { provider: currentProvider, model: currentModel } = getCurrentModelInfo();

  // Enhanced sidebar classes with smooth transitions
  const sidebarClasses = `sidebar transition-all duration-300 ease-in-out ${
    isSidebarOpen ? 'sidebar-open translate-x-0' : 'hidden lg:flex -translate-x-full lg:translate-x-0'
  } ${isFolded ? 'sidebar-folded w-14' : 'w-64'}`;

  return (
    <div className="relative">
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ease-in-out"
          onClick={onCloseSidebar}
        />
      )}

      <aside className={sidebarClasses} style={{ zIndex: 50 }}>
        {/* Header */}
        <div className={`border-b border-[var(--color-border)] flex flex-col gap-2 transition-all duration-300 ease-in-out ${
          isFolded ? 'p-1' : 'p-2'
        }`}>
          <div className={`flex items-center transition-all duration-300 ease-in-out ${
            isFolded ? 'justify-center flex-col gap-2' : 'justify-between'
          }`}>
            {/* Logo Section */}
            <a href="/" className={`flex items-center group transition-all duration-300 ease-in-out ${
              isFolded ? 'flex-col gap-1 px-2 py-1' : 'gap-2 px-1'
            }`}>
              <img 
                src="/white-logo.png" 
                alt="Logo" 
                className="w-8 h-8 shrink-0 transition-all duration-300 ease-in-out" 
              />
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isFolded ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100'
              }`}>
                {!isFolded && (
                  <div>
                    <h1 className="text-lg font-bold">Pustakam</h1>
                    <p className="text-xs text-gray-500 -mt-1">injin</p>
                  </div>
                )}
              </div>
              {isFolded && (
                <div className="text-center">
                  <h1 className="text-xs font-bold leading-tight">Pustakam</h1>
                </div>
              )}
            </a>
            
            {/* Close Button - Mobile Only */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isFolded ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100'
            }`}>
              {!isFolded && (
                <button 
                  onClick={onCloseSidebar} 
                  className="btn-ghost lg:hidden p-2 hover:bg-white/10 transition-colors duration-200" 
                  title="Close sidebar"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
          
          {/* New Book Button - Fixed centering */}
          <button 
            onClick={onNewBook} 
            className={`btn btn-primary w-full flex items-center justify-center gap-2 font-bold text-sm transition-all duration-300 ease-in-out hover:scale-105 active:scale-95 ${
              isFolded ? 'p-3' : 'py-2.5 px-4'
            }`}
          >
            <Plus className="w-5 h-5 shrink-0" strokeWidth={2.5} />
            <span className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
              isFolded ? 'max-w-0 opacity-0 w-0' : 'max-w-xs opacity-100'
            }`}>
              {!isFolded && 'New Book'}
            </span>
          </button>
        </div>

        {/* Model Selection - Fixed for collapsed mode */}
        <div className={`border-b border-[var(--color-border)] transition-all duration-300 ease-in-out ${
          isFolded ? 'p-2' : 'p-2'
        }`}>
          <div className="relative">
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className={`w-full flex items-center rounded-lg border transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 ${
                modelDropdownOpen 
                  ? 'border-blue-500/50 bg-blue-500/10 shadow-lg' 
                  : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
              } ${
                isFolded ? 'justify-center p-3' : 'justify-between p-2'
              }`}
              title={isFolded ? `${currentProvider?.name || 'Select Provider'} - ${currentModel?.name || 'No model selected'}` : undefined}
            >
              {isFolded ? (
                /* Folded Mode - Just icon centered */
                <>
                  {currentProvider ? <currentProvider.icon /> : <Brain className="w-4 h-4" />}
                </>
              ) : (
                /* Expanded Mode - Full layout */
                <>
                  <div className="flex items-center gap-3">
                    {currentProvider ? <currentProvider.icon /> : <Brain className="w-4 h-4" />}
                    <div className="text-left">
                      <div className="text-sm font-medium text-white transition-colors duration-200">
                        {currentProvider?.name || 'Select Provider'}
                      </div>
                      <div className="text-xs text-gray-400 truncate max-w-[140px] transition-colors duration-200">
                        {currentModel?.name || 'No model selected'}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-all duration-300 ease-in-out ${
                    modelDropdownOpen ? 'rotate-180 text-blue-400' : 'hover:text-gray-300'
                  }`} />
                </>
              )}
            </button>
            
            {/* Provider name below icon in folded mode */}
            {isFolded && currentProvider && (
              <div className="text-xs text-gray-400 text-center mt-1 leading-tight transition-all duration-300 ease-in-out">
                {currentProvider.name.split(' ')[0]}
              </div>
            )}

            {/* Dropdown Menu - Works in both modes */}
            {modelDropdownOpen && (
              <div className={`absolute z-[100] ${
                isFolded ? 'left-full ml-2 top-0 w-64' : 'top-full left-0 right-0 mt-1'
              } bg-[var(--color-sidebar)] border border-white/10 rounded-lg shadow-xl max-h-80 overflow-y-auto
              animate-in slide-in-from-top-2 duration-200 ease-out`}>
                {(Object.entries(modelConfig) as [ModelProvider, typeof modelConfig.google][]).map(([provider, config]) => {
                  const hasApiKey = hasApiKeyForProvider(provider);
                  const IconComponent = config.icon;
                  
                  return (
                    <div key={provider} className="p-1">
                      {/* Provider Header */}
                      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <IconComponent />
                          {config.name}
                          {!hasApiKey && (
                            <div className="flex items-center gap-1 ml-auto animate-pulse">
                              <AlertCircle className="w-3 h-3 text-red-400" />
                              <span className="text-xs text-red-400">No Key</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Models List */}
                      <div className="py-1">
                        {config.models.map((model) => {
                          const isSelected = settings.selectedModel === model.id && settings.selectedProvider === provider;
                          
                          return (
                            <button
                              key={model.id}
                              onClick={() => {
                                if (!hasApiKey) {
                                  alert(`Please configure your ${config.name} API key in Settings first.`);
                                  onOpenSettings();
                                  setModelDropdownOpen(false);
                                  return;
                                }
                                onModelChange(model.id, provider);
                                setModelDropdownOpen(false);
                              }}
                              disabled={!hasApiKey}
                              className={`w-full flex items-center justify-between px-3 py-2.5 text-left rounded-md transition-all duration-200 ease-in-out group transform hover:scale-[1.02] active:scale-[0.98] ${
                                isSelected
                                  ? 'bg-blue-500/20 text-blue-300 shadow-md'
                                  : hasApiKey 
                                    ? 'hover:bg-white/5 text-gray-300 hover:text-white hover:shadow-sm' 
                                    : 'text-gray-500 cursor-not-allowed opacity-50'
                              }`}
                              title={!hasApiKey ? `Configure ${config.name} API key in Settings` : model.description}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                {isSelected && (
                                  <IconComponent />
                                )}
                                <div>
                                  <div className="text-sm font-medium transition-colors duration-200">{model.name}</div>
                                  <div className="text-xs opacity-70 transition-opacity duration-200 group-hover:opacity-100">{model.description}</div>
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-blue-400 animate-in zoom-in-50 duration-200" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                
                {/* Settings Link */}
                <div className="border-t border-white/10 p-1">
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setModelDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Settings className="w-4 h-4" />
                    Configure API Keys
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Books List */}
        <div className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${
          isFolded ? 'p-1' : 'p-2'
        }`}>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isFolded ? 'max-h-0 opacity-0' : 'max-h-full opacity-100'
          }`}>
            {!isFolded && (
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 transition-colors duration-200" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search books..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all duration-200 ease-in-out focus:scale-[1.02]"
                />
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            {sortedBooks.map(book => {
              const isSelected = currentBookId === book.id;
              const CategoryIcon = getCategoryIcon(book.category);
              return (
                <div
                  key={book.id}
                  onClick={() => onSelectBook(book.id)}
                  className={`group flex items-center w-full rounded-lg cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] ${
                    isFolded ? 'justify-center p-2' : 'gap-3 p-2'
                  } ${
                    isSelected
                      ? 'bg-white text-black font-semibold shadow-md'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white hover:shadow-sm'
                  }`}
                  title={isFolded ? book.title : undefined}
                >
                  <CategoryIcon className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
                    isSelected ? 'text-black' : 'text-gray-400'
                  }`} />
                  <div className={`flex flex-1 items-center min-w-0 transition-all duration-300 ease-in-out overflow-hidden ${
                    isFolded ? 'max-w-0 opacity-0' : 'max-w-full opacity-100'
                  }`}>
                    {!isFolded && (
                      <>
                        <span className="flex-1 text-sm font-medium truncate">{book.title}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteBook(book.id); }}
                          className={`p-1.5 opacity-0 group-hover:opacity-100 rounded-md transition-all duration-200 ease-in-out transform hover:scale-110 active:scale-90 ${
                            isSelected 
                              ? 'text-gray-600 hover:text-red-500 hover:bg-black/10' 
                              : 'text-gray-500 hover:text-red-400 hover:bg-red-900/20'
                          }`}
                          title="Delete book"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isFolded ? 'max-h-0 opacity-0' : 'max-h-full opacity-100'
          }`}>
            {sortedBooks.length === 0 && !isFolded && (
              <div className="text-center p-6 text-sm text-gray-500">
                <p>No books found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Settings, Collapse Button, and Creator Credit */}
        <div className={`border-t border-[var(--color-border)] transition-all duration-300 ease-in-out ${
          isFolded ? 'p-2' : 'p-0'
        }`}>
          {!isFolded ? (
            <div>
              {/* Settings and Collapse Button */}
              <div className="p-3 flex items-center gap-2">
                <button 
                  onClick={onOpenSettings}
                  className="flex-1 flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
                
                {/* Collapse Button */}
                {onToggleFold && (
                  <button 
                    onClick={onToggleFold} 
                    className="hidden lg:block p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-110 active:scale-90"
                    title="Collapse sidebar"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}
              </div>
              
              {/* Creator Credit */}
              <div className="px-3 pb-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <User className="w-3 h-3" />
                  <span>Made by</span>
                  <a
                    href="https://linkedin.com/in/tanmay-kalbande"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    Tanmay Kalbande
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button 
                onClick={onOpenSettings}
                className="w-full p-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-110 active:scale-90"
                title="Settings"
              >
                <Settings className="w-5 h-5 mx-auto" />
              </button>
              
              {/* Expand Button for Folded State */}
              {onToggleFold && (
                <button 
                  onClick={onToggleFold} 
                  className="hidden lg:block w-full p-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-110 active:scale-90"
                  title="Expand sidebar"
                >
                  <ChevronRight size={18} className="mx-auto" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Click outside handler for dropdown */}
        {modelDropdownOpen && (
          <div 
            className="fixed inset-0 z-[99]" 
            onClick={() => setModelDropdownOpen(false)}
          />
        )}
      </aside>
    </div>
  );
}
