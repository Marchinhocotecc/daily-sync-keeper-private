import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LifeSyncCard } from '@/components/LifeSyncCard'
import { LifeSyncButton } from '@/components/LifeSyncButton'
import { AIAssistant, AssistantSuggestion, useAssistantT } from '@/services/ai_assistant'
import { useCalendarEvents } from '@/hooks/useCalendarEvents';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AssistentePage = () => {
  const { t } = useAssistantT();
  const tr = (k: string, fb: string) => { const v = t(k); return v === k ? fb : v; };
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: tr('greeting', 'Ciao! Sono il tuo assistente personale LifeSync. Come posso aiutarti oggi?'),
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<AssistantSuggestion[]>([])
  const { addEvent } = useCalendarEvents()

  // Keep a stable assistant instance across renders
  const assistantRef = useRef<AIAssistant | null>(null)
  if (!assistantRef.current) {
    assistantRef.current = new AIAssistant({
      addEvent: async (e) => {
        await addEvent(e.title, e.date, e.time, e.duration, e.color)
      }
    })
  }

  const refreshSuggestions = async () => {
    const s = await assistantRef.current!.suggestImprovements()
    setSuggestions(s)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const current = inputValue
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await assistantRef.current!.reply(current)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.text,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
      // If something was created, suggestions may change
      if (res.created) {
        await refreshSuggestions()
      }
    } catch {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Si è verificato un problema. Riprova.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
    } finally {
      setIsLoading(false)
    }
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // TODO: Implement voice recognition
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    refreshSuggestions()
  }, [])

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mobile-padding pt-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">{tr('title','Assistente')}</h1>
          <p className="text-muted-foreground">{tr('subtitle', 'Pianifica, organizza e mantieni il focus con il tuo assistente.')}</p>
        </div>

        {/* Suggestions */}
        <LifeSyncCard className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">{tr('suggestions', 'Suggerimenti')}</h3>
            <LifeSyncButton size="sm" onClick={refreshSuggestions}>{tr('update', 'Aggiorna')}</LifeSyncButton>
          </div>
          {suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tr('noSuggestions', 'Nessun suggerimento al momento.')}</p>
          ) : (
            <div className="space-y-2">
              {suggestions.map(s => (
                <div key={s.id} className="p-3 rounded-xl bg-background/50 border flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">{s.title}</div>
                    {s.description && <div className="text-xs text-muted-foreground">{s.description}</div>}
                  </div>
                  <LifeSyncButton size="sm" onClick={s.apply}>{tr('apply', 'Applica')}</LifeSyncButton>
                </div>
              ))}
            </div>
          )}
        </LifeSyncCard>

        {/* Chat Container */}
        <Card className="h-[calc(100vh-200px)] flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString('it-IT', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground rounded-lg p-3 max-w-[80%]">
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse">💭</div>
                      <span className="text-sm">{tr('writing', 'Sta scrivendo…')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleVoiceInput}
                className={isListening ? 'bg-red-500 text-white' : ''}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </Button>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={tr('inputPlaceholder', 'Scrivi il tuo messaggio...')}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AssistentePage;