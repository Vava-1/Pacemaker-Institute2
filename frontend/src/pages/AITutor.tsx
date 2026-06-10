import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Link } from 'react-router'
import { toast } from 'sonner'
import {
  Brain, Send, Sparkles, Loader2, Menu,
} from 'lucide-react'

type AIModel = 'gemini' | 'grok' | 'deepseek' | 'claude'

const disciplines = [
  { id: 'languages', label: 'Languages' },
  { id: 'exam-prep', label: 'Exam Prep' },
  { id: 'mechanics', label: 'Mechanics' },
  { id: 'bakery', label: 'Bakery' },
  { id: 'salon', label: 'Salon' },
  { id: 'ai-skills', label: 'AI Skills' },
  { id: 'general', label: 'General' },
]

const modelBadge: Record<AIModel, { label: string; color: string }> = {
  gemini: { label: 'Gemini', color: 'bg-blue-100 text-blue-700' },
  grok: { label: 'Grok', color: 'bg-purple-100 text-purple-700' },
  deepseek: { label: 'DeepSeek', color: 'bg-amber-100 text-amber-700' },
  claude: { label: 'Claude', color: 'bg-emerald-100 text-emerald-700' },
}

export default function AITutor() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [messages, setMessages] = useState<{ role: string; content: string; model?: AIModel }[]>([])
  const [input, setInput] = useState('')
  const [activeDiscipline, setActiveDiscipline] = useState('general')
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [showDisciplines, setShowDisciplines] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const chat = trpc.ai.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.message, model: data.model as AIModel }])
      setConversationId(data.conversationId)
    },
    onError: (err) => {
      toast.error(err.message || t('aiTutor.notResponding'))
    },
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || chat.isPending) return
    const userMessage = input.trim()
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setInput('')
    chat.mutate({ message: userMessage, conversationId, discipline: activeDiscipline })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggested = (prompt: string) => {
    setMessages([{ role: 'user', content: prompt }])
    chat.mutate({ message: prompt, discipline: activeDiscipline })
  }

  const suggestedPrompts = [
    "Explain French verb conjugations",
    "Help me prepare for TOEFL",
    "What are the basics of car engines?",
    "How do I make sourdough bread?",
    "Teach me about AI tools for teachers",
    "Practice German greetings with me",
  ]

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('aiTutor.title')}</h2>
          <p className="text-slate-500 mb-6 text-sm">{t('aiTutor.loginPrompt')}</p>
          <Link to="/login">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              {t('aiTutor.loginToChat')}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Brain className="h-4 w-4 text-white" />
          </div>
           <span className="font-semibold text-base">{t('aiTutor.title')}</span>
          <span className="text-xs text-emerald-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {t('aiTutor.online')}
          </span>
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-500"
            onClick={() => setShowDisciplines(!showDisciplines)}
          >
            <Menu className="h-4 w-4 mr-1" />
            {disciplines.find(d => d.id === activeDiscipline)?.label}
          </Button>
          {showDisciplines && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 min-w-[140px]">
              {disciplines.map(d => (
                <button
                  key={d.id}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100 ${activeDiscipline === d.id ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
                  onClick={() => { setActiveDiscipline(d.id); setShowDisciplines(false) }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages / Empty State */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-1">{t('aiTutor.helpHeading')}</h2>
            <p className="text-sm text-slate-400 mb-8 text-center max-w-sm">
              {t('aiTutor.helpDesc')}
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
              {suggestedPrompts.map((prompt, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="text-left justify-start h-auto py-2 px-3 text-sm text-slate-600 border-slate-200 hover:bg-slate-50"
                  onClick={() => handleSuggested(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'assistant' ? (
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                      {user.name?.charAt(0) ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`${msg.role === 'user' ? 'text-right' : ''} max-w-[85%]`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800">
                    {msg.content}
                  </p>
                  {msg.role === 'assistant' && msg.model && (
                    <span className={`inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded ${modelBadge[msg.model].color}`}>
                      {t(`aiTutor.models.${msg.model}`)}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {chat.isPending && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <Loader2 className="h-4 w-4 animate-spin text-slate-400 mt-2" />
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-slate-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-2 items-center">
          <Input
            placeholder={t('aiTutor.placeholder')}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={chat.isPending}
            className="flex-1 border-slate-300 focus-visible:ring-blue-500 rounded-lg"
          />
          <Button
            onClick={handleSend}
            disabled={chat.isPending || !input.trim()}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-10 w-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
