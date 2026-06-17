import { useState, useRef, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router'
import {
  Sparkles, SendHorizonal, Brain, PanelLeftClose, PanelLeft, Plus,
  Trash2, MessageSquareText, Clock, Calendar, LogOut, ArrowLeft
} from 'lucide-react'
import { BackButton } from '@/components/BackButton'

type AIModel = 'gemini' | 'grok' | 'deepseek'

const disciplines = [
  { id: 'general', label: 'General', icon: '🧠' },
  { id: 'languages', label: 'Languages', icon: '🌍' },
  { id: 'exam-prep', label: 'Exam Prep', icon: '📝' },
  { id: 'mechanics', label: 'Mechanics', icon: '🔧' },
  { id: 'bakery', label: 'Bakery', icon: '🥖' },
  { id: 'salon', label: 'Salon', icon: '💇' },
  { id: 'ai-skills', label: 'AI Skills', icon: '🤖' },
]

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function dateGroup(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const thisWeek = new Date(today.getTime() - today.getDay() * 86400000)
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (d.getTime() === today.getTime()) return 'Today'
  if (d.getTime() === yesterday.getTime()) return 'Yesterday'
  if (d >= thisWeek) return 'This Week'
  if (d >= thisMonth) return 'This Month'
  return 'Older'
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '...' : str
}

function SearchIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

export default function AITutor() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const [messages, setMessages] = useState<{ role: string; content: string; model?: AIModel }[]>([])
  const [input, setInput] = useState('')
  const [activeDiscipline, setActiveDiscipline] = useState('general')
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [showDisciplines, setShowDisciplines] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarSearch, setSidebarSearch] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { data: conversations, refetch: refetchConversations } = trpc.ai.getConversations.useQuery(undefined, {
    enabled: !!user,
  })

  const chat = trpc.ai.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.message, model: data.model as AIModel }])
      setConversationId(data.conversationId)
      refetchConversations()
    },
    onError: (err) => {
      setMessages(prev => [...prev, { role: 'assistant', content: err.message || 'Service unavailable. Please try again.', model: 'gemini' }])
    },
  })

  const loadHistory = trpc.ai.getHistory.useMutation({
    onSuccess: (data) => {
      setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })))
    },
  })

  const deleteConversation = trpc.ai.deleteConversation.useMutation({
    onSuccess: () => {
      if (conversationId) {
        setConversationId(undefined)
        setMessages([])
      }
      refetchConversations()
    },
  })

  const groupedConversations = useMemo(() => {
    if (!conversations) return []
    const filtered = sidebarSearch
      ? conversations.filter((c: any) =>
          (c.title || '').toLowerCase().includes(sidebarSearch.toLowerCase()) ||
          (c.lastMessage || '').toLowerCase().includes(sidebarSearch.toLowerCase())
        )
      : conversations
    const groups: { label: string; items: any[] }[] = []
    const seen = new Set<string>()
    for (const conv of filtered) {
      const group = dateGroup(new Date(conv.updatedAt))
      if (!seen.has(group)) {
        seen.add(group)
        groups.push({ label: group, items: [] })
      }
      const g = groups.find(g => g.label === group)!
      g.items.push(conv)
    }
    return groups
  }, [conversations, sidebarSearch])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

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
    setConversationId(undefined)
    chat.mutate({ message: prompt, discipline: activeDiscipline })
  }

  const handleSelectConversation = (id: number) => {
    setConversationId(String(id))
    loadHistory.mutate({ conversationId: String(id) })
  }

  const handleNewChat = () => {
    setConversationId(undefined)
    setMessages([])
  }

  const handleDeleteConversation = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    deleteConversation.mutate({ conversationId: String(id) })
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
        <div className="absolute top-20 left-4">
          <BackButton />
        </div>
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
    <div className="h-full flex bg-[#090D1A]">
      {/* Sidebar - Dark Theme */}
      <div
        className={`${
          sidebarOpen ? 'w-[260px]' : 'w-0'
        } flex flex-col bg-[#0E1320] border-r border-[rgba(255,255,255,0.07)] transition-all duration-200 overflow-hidden flex-shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center px-5 py-4 border-b border-[rgba(255,255,255,0.07)]">
          <img src="/PBI_logo.jpg" alt="Pacemaker Institute" className="h-9 w-auto" />
        </div>

        {/* New Chat Button */}
        <div className="px-4 pt-3.5 pb-2">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#5457e5] hover:to-[#7c4fe5] shadow-[0_4px_16px_rgba(99,102,241,0.3)] transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            New Conversation
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-2 pb-1">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)]">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search conversations..."
              value={sidebarSearch}
              onChange={e => setSidebarSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-[#F1F5F9] outline-none placeholder-[#4A5568]"
            />
            <span className="text-[10px] text-[#4A5568] bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 rounded">⌘K</span>
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 pb-1 text-[10px] font-bold text-[#4A5568] uppercase tracking-[1.2px]">History</div>
          {!groupedConversations.length ? (
            <div className="flex flex-col items-center justify-center h-32 text-[#4A5568] px-6 text-center">
              <MessageSquareText className="h-5 w-5 mb-2 opacity-50" />
              <p className="text-xs leading-relaxed">
                {sidebarSearch ? 'No matching conversations' : 'No conversations yet'}
              </p>
            </div>
          ) : (
            groupedConversations.map(group => (
              <div key={group.label}>
                <div className="flex items-center gap-1.5 px-5 pt-3.5 pb-1">
                  {group.label === 'Today' ? (
                    <Clock className="h-3 w-3 text-[#4A5568]" />
                  ) : (
                    <Calendar className="h-3 w-3 text-[#4A5568]" />
                  )}
                  <span className="text-[10px] font-semibold text-[#4A5568] uppercase tracking-[1px]">
                    {group.label}
                  </span>
                </div>
                {group.items.map((conv: any) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`group relative mx-2 my-px px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                      String(conv.id) === conversationId
                        ? 'bg-[rgba(99,102,241,0.12)] border-l-[3px] border-[#6366F1]'
                        : 'hover:bg-[rgba(255,255,255,0.04)] border-l-[3px] border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-[rgba(255,255,255,0.06)] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MessageSquareText className="h-3 w-3 text-[#8B95A8]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium text-[#E2E8F0] truncate">
                            {conv.title || 'Chat'}
                          </p>
                          <span className="text-[10px] text-[#4A5568] flex-shrink-0">
                            {timeAgo(new Date(conv.updatedAt))}
                          </span>
                        </div>
                        {conv.lastMessage && (
                          <p className="text-[11px] text-[#6B7280] mt-0.5 line-clamp-1 leading-relaxed">
                            {truncate(conv.lastMessage.replace(/<[^>]*>/g, ''), 60)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(239,68,68,0.15)]"
                      >
                        <Trash2 className="h-3 w-3 text-[#6B7280] hover:text-[#F87171] transition-colors" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-[rgba(255,255,255,0.07)]">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#8B95A8] hover:text-[#F87171] hover:bg-[rgba(239,68,68,0.08)] transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Minimal header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-100">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
              title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4 text-neutral-400" />
              ) : (
                <PanelLeft className="h-4 w-4 text-neutral-400" />
              )}
            </button>
            <div className="flex items-center gap-2 ml-0.5">
              <div className="w-7 h-7 rounded-md bg-neutral-900 flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-neutral-800">PI Assistant</span>
            </div>
            <Link to="/dashboard" className="ml-2 text-xs text-neutral-400 hover:text-neutral-600 transition-colors px-2 py-1 rounded-md hover:bg-neutral-100 flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Dashboard
            </Link>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowDisciplines(!showDisciplines)}
              className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 transition-colors px-2.5 py-1.5 rounded-md hover:bg-neutral-100"
            >
              <span>{disciplines.find(d => d.id === activeDiscipline)?.icon}</span>
              <span>{disciplines.find(d => d.id === activeDiscipline)?.label}</span>
            </button>
            {showDisciplines && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDisciplines(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 py-1 min-w-[160px] overflow-hidden">
                  {disciplines.map(d => (
                    <button
                      key={d.id}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs ${
                        activeDiscipline === d.id
                          ? 'text-neutral-900 font-medium bg-neutral-50'
                          : 'text-neutral-500'
                      } hover:bg-neutral-50 transition-colors`}
                      onClick={() => { setActiveDiscipline(d.id); setShowDisciplines(false) }}
                    >
                      <span>{d.icon}</span>
                      <span>{d.label}</span>
                      {activeDiscipline === d.id && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-neutral-900" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="min-h-full flex flex-col items-center justify-center px-4 py-12">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center mb-5 shadow-sm">
                <Sparkles className="h-6 w-6 text-neutral-500" />
              </div>
              <h1 className="text-xl font-semibold text-neutral-800 mb-1.5">{t('aiTutor.helpHeading')}</h1>
              <p className="text-sm text-neutral-400 mb-8 text-center max-w-sm leading-relaxed">
                {t('aiTutor.helpDesc')}
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-xl w-full">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggested(prompt)}
                    className="text-left px-4 py-3 rounded-xl text-sm text-neutral-600 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-sm transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6">
              <div className="space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role === 'assistant' ? (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <Brain className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 flex-shrink-0" />
                    )}
                    <div className={`${msg.role === 'user' ? 'text-right' : ''} max-w-[80%]`}>
                      <div
                        className={`${
                          msg.role === 'user'
                            ? 'inline-block bg-neutral-100 rounded-2xl rounded-tr-md px-4 py-2.5'
                            : 'px-1 py-0.5'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-800">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {chat.isPending && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex items-center gap-1.5 py-2">
                      <span className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-neutral-100 bg-white">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-end gap-2 bg-white border border-neutral-200 rounded-xl px-3 py-2 focus-within:border-neutral-400 focus-within:shadow-[0_0_0_2px_rgba(0,0,0,0.04)] transition-all">
              <textarea
                ref={textareaRef}
                placeholder="Ask me anything..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={chat.isPending}
                rows={1}
                className="flex-1 text-sm bg-transparent outline-none resize-none max-h-[200px] text-neutral-800 placeholder-neutral-400 disabled:opacity-50"
              />
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {input.length > 0 && (
                  <span className="text-[10px] text-neutral-300 tabular-nums">{input.length}</span>
                )}
                <button
                  onClick={handleSend}
                  disabled={chat.isPending || !input.trim()}
                  className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-100 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95"
                >
                  <SendHorizonal className="h-4 w-4 text-white disabled:text-neutral-400" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-neutral-300 text-center mt-2">
              PI Assistant may produce inaccurate information. Verify important facts.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
