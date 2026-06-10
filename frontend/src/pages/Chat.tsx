import { useState } from 'react'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  MessageSquare, Send, Hash, Languages,
  Wrench, Cake, Scissors, Brain, GraduationCap,
  Search, MoreVertical, Camera,
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

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function formatLastSeen(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diffMin < 1) return 'last seen just now'
  if (diffMin < 60) return `last seen ${diffMin}m ago`
  if (diffMin < 1440) return `last seen ${Math.floor(diffMin / 60)}h ago`
  return `last seen on ${d.toLocaleDateString()}`
}

export default function Chat() {
  const { user } = useAuth()
  const [activeRoom, setActiveRoom] = useState<number>(1)
  const [message, setMessage] = useState('')
  const { data: rooms } = trpc.message.rooms.useQuery()

  const activeRoomData = rooms?.find((r: any) => r.id === activeRoom)
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
        <div className="max-w-md w-full mx-4 text-center">
          <MessageSquare className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Community Chat</h2>
          <p className="text-slate-500 mb-6 text-sm">Login to join the conversation with fellow learners.</p>
          <Link to="/login">
            <Button className="bg-[#075e54] hover:bg-[#054d44] text-white">Login to Chat</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* === Sidebar — WhatsApp-style chat list === */}
      <div className="w-80 border-r border-gray-200 bg-white flex-shrink-0 flex flex-col">
        {/* Sidebar Header */}
        <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-base">Chats</h2>
          <div className="flex items-center gap-3">
            <Camera className="h-5 w-5" />
            <Search className="h-5 w-5" />
            <MoreVertical className="h-5 w-5" />
          </div>
        </div>

        {/* Search bar */}
        <div className="px-3 py-2 bg-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search or start new chat"
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-white text-sm border-0 outline-none"
            />
          </div>
        </div>

        {/* Room List */}
        <ScrollArea className="flex-1">
          {rooms?.map((room: any) => {
            const RoomIcon = roomIcons[room.category ?? ''] ?? Hash
            const roomMsgs = mockMessages[room.id] ?? []
            const lastMsg = roomMsgs[roomMsgs.length - 1]
            const isActive = activeRoom === room.id
            return (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-100 transition-colors ${
                  isActive ? 'bg-[#e8f4f0]' : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[#075e54] flex items-center justify-center flex-shrink-0">
                  <RoomIcon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'} text-gray-900 truncate`}>
                      {room.name}
                    </span>
                    {lastMsg && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatTime(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-gray-500 truncate">
                      {lastMsg ? lastMsg.content : room.description}
                    </span>
                    {roomMsgs.length > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#25d366] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 ml-2">
                        {roomMsgs.length}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </ScrollArea>
      </div>

      {/* === Chat Area — WhatsApp-style === */}
      <div className="flex-1 flex flex-col bg-[#e5ddd5]">
        {activeRoomData ? (
          <>
            {/* Chat Header */}
            <div className="bg-[#075e54] text-white px-4 py-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm">{activeRoomData.name}</h3>
                <p className="text-[11px] text-white/70 truncate">
                  {formatLastSeen(messages[messages.length - 1]?.createdAt ?? new Date().toISOString())}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Search className="h-5 w-5" />
                <MoreVertical className="h-5 w-5" />
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-3" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4d9d0\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
              <div className="space-y-1">
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.id
                  const showName = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId)
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[65%]">
                        {showName && (
                          <p className="text-[11px] text-emerald-700 font-medium ml-1 mb-0.5">{msg.senderName}</p>
                        )}
                        <div className={`px-3 py-1.5 text-sm shadow-sm ${
                          isMe
                            ? 'bg-[#dcf8c6] rounded-lg rounded-br-sm'
                            : 'bg-white rounded-lg rounded-bl-sm'
                        }`}>
                          <p className="text-gray-800">{msg.content}</p>
                          <p className={`text-[10px] text-right mt-0.5 ${isMe ? 'text-[#6b8a5e]' : 'text-gray-400'}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="bg-gray-100 px-4 py-2 flex items-center gap-3">
              <div className="text-gray-500 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
              </div>
              <input
                placeholder="Type a message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                className="flex-1 h-10 rounded-lg border-0 px-3 text-sm outline-none bg-white"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="text-[#075e54] disabled:text-gray-300"
              >
                <Send className="h-6 w-6" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#f0f2f5]">
            <div className="text-center">
              <MessageSquare className="h-20 w-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
