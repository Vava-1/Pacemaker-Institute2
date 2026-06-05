import { useState } from 'react'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
  MessageSquare, Send, Users, Hash, Languages,
  Wrench, Cake, Scissors, Brain, GraduationCap,
} from 'lucide-react'

const roomIcons: Record<string, any> = {
  general: MessageSquare,
  languages: Languages,
  'exam-prep': GraduationCap,
  mechanics: Wrench,
  bakery: Cake,
  salon: Scissors,
  'ai-skills': Brain,
}

const mockMessages: Record<number, any[]> = {
  1: [
    { id: 1, senderId: 2, senderName: 'Alice M.', content: 'Hello everyone! How is your learning going today?', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, senderId: 3, senderName: 'Bob K.', content: 'Great! Just finished a French exercise. The AI tutor is really helpful.', createdAt: new Date(Date.now() - 3500000).toISOString() },
    { id: 3, senderId: 4, senderName: 'Carla N.', content: 'Has anyone tried the new bakery course? Thinking of enrolling.', createdAt: new Date(Date.now() - 3400000).toISOString() },
    { id: 4, senderId: 2, senderName: 'Alice M.', content: 'Yes! The sourdough module is amazing. Highly recommend it.', createdAt: new Date(Date.now() - 3300000).toISOString() },
    { id: 5, senderId: 5, senderName: 'David O.', content: 'Just passed my DELF B1! Thanks to this platform!', createdAt: new Date(Date.now() - 3200000).toISOString() },
    { id: 6, senderId: 3, senderName: 'Bob K.', content: 'Congratulations David! That is awesome!', createdAt: new Date(Date.now() - 3100000).toISOString() },
    { id: 7, senderId: 6, senderName: 'Emma P.', content: 'Anyone want to practice German together? I am at A2 level.', createdAt: new Date(Date.now() - 3000000).toISOString() },
    { id: 8, senderId: 7, senderName: 'Frank R.', content: 'Emma, I would love to! I am also A2 in German.', createdAt: new Date(Date.now() - 2900000).toISOString() },
    { id: 9, senderId: 2, senderName: 'Alice M.', content: 'The leaderboard is getting competitive! I need to do more exercises.', createdAt: new Date(Date.now() - 2800000).toISOString() },
    { id: 10, senderId: 4, senderName: 'Carla N.', content: 'Same here! The daily streak feature is really motivating.', createdAt: new Date(Date.now() - 2700000).toISOString() },
  ],
  2: [
    { id: 11, senderId: 8, senderName: 'Jean P.', content: 'Bonjour tout le monde! Comment allez-vous?', createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: 12, senderId: 9, senderName: 'Marie L.', content: 'Bonjour Jean! Je vais bien, merci. Et toi?', createdAt: new Date(Date.now() - 1700000).toISOString() },
    { id: 13, senderId: 10, senderName: 'Sophie D.', content: 'Can someone explain the difference between "passé composé" and "imparfait"?', createdAt: new Date(Date.now() - 1600000).toISOString() },
    { id: 14, senderId: 8, senderName: 'Jean P.', content: 'Passé composé is for completed actions, imparfait is for ongoing/description in the past.', createdAt: new Date(Date.now() - 1500000).toISOString() },
  ],
  8: [
    { id: 15, senderId: 11, senderName: 'TechTeacher', content: 'What AI tools are you all using in your classrooms?', createdAt: new Date(Date.now() - 2400000).toISOString() },
    { id: 16, senderId: 12, senderName: 'AIStudent', content: 'I have been using ChatGPT for lesson planning. Saves me hours!', createdAt: new Date(Date.now() - 2300000).toISOString() },
    { id: 17, senderId: 13, senderName: 'DataAnalyst', content: 'Claude is great for data analysis tasks. Highly recommend it.', createdAt: new Date(Date.now() - 2200000).toISOString() },
    { id: 18, senderId: 11, senderName: 'TechTeacher', content: 'Has anyone tried the new AI for Teachers course here? It is excellent!', createdAt: new Date(Date.now() - 2100000).toISOString() },
  ],
}

export default function Chat() {
  const { user } = useAuth()
  const [activeRoom, setActiveRoom] = useState<number>(1)
  const [message, setMessage] = useState('')
  const { data: rooms } = trpc.message.rooms.useQuery()

  const activeRoomData = rooms?.find(r => r.id === activeRoom)
  const messages = mockMessages[activeRoom] ?? []
  const Icon = activeRoomData ? (roomIcons[activeRoomData.category ?? ''] ?? MessageSquare) : MessageSquare

  const handleSend = () => {
    if (!message.trim()) return
    toast.success('Message sent!')
    setMessage('')
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Community Chat</h2>
            <p className="text-slate-500 mb-6">Login to join the conversation with fellow learners.</p>
            <Link to="/login">
              <Button className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white">Login to Chat</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex max-w-7xl mx-auto">
      {/* Room List */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Chat Rooms
          </h2>
        </div>
        <ScrollArea className="h-[calc(100%-60px)]">
          <div className="p-2 space-y-1">
            {rooms?.map(room => {
              const RoomIcon = roomIcons[room.category ?? ''] ?? Hash
              const isActive = activeRoom === room.id
              return (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <RoomIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{room.name}</span>
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeRoomData && (
          <>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Icon className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">{activeRoomData.name}</h3>
                <p className="text-xs text-slate-500">{activeRoomData.description}</p>
              </div>
              <div className="ml-auto flex items-center gap-1 text-xs text-slate-500">
                <Users className="h-3 w-3" />
                <span>{messages.length + 5} online</span>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map(msg => {
                  const isMe = msg.senderId === user?.id
                  return (
                    <div key={msg.id} className={`flex items-start gap-2 ${isMe ? 'justify-end' : ''}`}>
                      {!isMe && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                            {msg.senderName?.charAt(0) ?? 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[70%] rounded-2xl px-3 py-2 ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-slate-100 dark:bg-slate-800 rounded-bl-md'
                      }`}>
                        {!isMe && <div className="text-xs font-medium mb-0.5 opacity-70">{msg.senderName}</div>}
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex gap-2">
                <Input
                  placeholder={`Message #${activeRoomData.name}...`}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="flex-1"
                />
                <Button onClick={handleSend} className="bg-blue-600 text-white">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
