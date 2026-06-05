import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Link } from 'react-router'
import {
  Brain, Send, Sparkles, Languages, GraduationCap,
  Wrench, Cake, Scissors, Zap, Loader2,
} from 'lucide-react'

const disciplines = [
  { id: 'languages', label: 'Languages', icon: Languages, color: 'from-blue-500 to-blue-600' },
  { id: 'exam-prep', label: 'Exam Prep', icon: GraduationCap, color: 'from-purple-500 to-purple-600' },
  { id: 'mechanics', label: 'Mechanics', icon: Wrench, color: 'from-red-500 to-red-600' },
  { id: 'bakery', label: 'Bakery', icon: Cake, color: 'from-orange-500 to-orange-600' },
  { id: 'salon', label: 'Salon', icon: Scissors, color: 'from-pink-500 to-pink-600' },
  { id: 'ai-skills', label: 'AI Skills', icon: Zap, color: 'from-emerald-500 to-emerald-600' },
  { id: 'general', label: 'General', icon: Sparkles, color: 'from-indigo-500 to-indigo-600' },
]

export default function AITutor() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')
  const [activeDiscipline, setActiveDiscipline] = useState('general')
  const [conversationId, setConversationId] = useState<number | undefined>()
  const scrollRef = useRef<HTMLDivElement>(null)

  const chat = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      setConversationId(data.conversationId)
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
    chat.mutate({ message: userMessage, discipline: activeDiscipline, conversationId })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
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
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">PI Assistant</h2>
            <p className="text-slate-500 mb-6">Login to chat with your personal AI tutor available 24/7.</p>
            <Link to="/login">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <Sparkles className="mr-2 h-4 w-4" /> Login to Chat
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col max-w-6xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">PI Assistant</h1>
              <div className="flex items-center gap-1 text-xs text-emerald-500">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online - Ready to help
              </div>
            </div>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> AI-Powered
          </Badge>
        </div>

        {/* Discipline Selector */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {disciplines.map(d => {
            const Icon = d.icon
            return (
              <Button
                key={d.id}
                variant={activeDiscipline === d.id ? 'default' : 'outline'}
                size="sm"
                className={`flex-shrink-0 ${activeDiscipline === d.id ? `bg-gradient-to-r ${d.color} text-white border-0` : ''}`}
                onClick={() => setActiveDiscipline(d.id)}
              >
                <Icon className="h-3 w-3 mr-1" /> {d.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12">
                <Brain className="h-16 w-16 text-slate-200 dark:text-slate-700 mb-4" />
                <h3 className="text-lg font-medium text-slate-500 mb-2">How can I help you today?</h3>
                <p className="text-sm text-slate-400 text-center max-w-md mb-6">
                  I'm your personal AI tutor. Ask me anything about your courses, get explanations, or practice exercises.
                </p>
                <div className="grid grid-cols-2 gap-2 max-w-lg w-full px-4">
                  {suggestedPrompts.map((prompt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="text-left justify-start h-auto py-2 text-sm"
                      onClick={() => {
                        setMessages([{ role: 'user', content: prompt }])
                        chat.mutate({ message: prompt, discipline: activeDiscipline })
                      }}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Brain className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{user.name?.charAt(0) ?? 'U'}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {chat.isPending && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex gap-2 max-w-3xl mx-auto">
              <Input
                placeholder="Ask PI Assistant anything..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={chat.isPending}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={chat.isPending || !input.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
