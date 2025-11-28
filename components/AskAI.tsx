import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, X, Shirt, Activity, MessageSquare } from 'lucide-react';
import { WeatherData, AISuggestion } from '../types';
import { generateSuggestions } from '../services/geminiService';
import Button from './Button';

interface AskAIProps {
  weather: WeatherData;
  isOpen: boolean;
  onClose: () => void;
}

const AskAI: React.FC<AskAIProps> = ({ weather, isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const [style, setStyle] = useState('Casual');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AISuggestion | null>(null);

  const handleAsk = async () => {
    setLoading(true);
    try {
      const suggestion = await generateSuggestions(weather, style, i18n.language);
      setResult(suggestion);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-center gap-2 text-primary dark:text-blue-400">
            <Sparkles className="w-5 h-5" />
            <h2 className="font-bold text-lg">{t('ai_modal_title')}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!result && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('ask_ai_desc')}</p>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Style</label>
                <div className="flex gap-2">
                  {['Casual', 'Business', 'Sport'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        style === s
                          ? 'bg-primary text-white shadow-md transform scale-105'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {t(`style_${s.toLowerCase()}`)}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="action"
                fullWidth
                onClick={handleAsk}
                isLoading={loading}
                icon={!loading && <Sparkles className="w-5 h-5" />}
              >
                {t('generate')}
              </Button>
            </div>
          )}

          {result && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl space-y-3">
                 <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-300">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-blue-500 uppercase mb-1">Summary</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{result.summary}</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-300 mt-1">
                    <Shirt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t('ai_suggestion_outfit')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{result.outfit}</p>
                  </div>
                </div>

                <div className="w-full h-px bg-gray-100 dark:bg-gray-800" />

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-300 mt-1">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t('ai_suggestion_activity')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{result.activities}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setResult(null)} 
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AskAI;