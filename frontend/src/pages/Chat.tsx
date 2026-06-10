import { useState, useRef, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { BackButton } from '@/components/BackButton'
import {
  MessageSquare, Send, Languages,
  Wrench, Cake, Scissors, Brain, GraduationCap,
  Search, MoreVertical, Phone,
  Pin, Reply, Trash2, Smile, Paperclip,
  Image, FileText, User, X, ArrowDown, Check,
  CheckCheck, Info,
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

const roomColors: Record<string, string> = {
  general: '#075e54',
  languages: '#1a73e8',
  'exam-prep': '#7c3aed',
  mechanics: '#78716c',
  bakery: '#d97706',
  salon: '#db2777',
  'ai-skills': '#6366f1',
}

function RoomIcon({ category, className = 'h-5 w-5' }: { category: string; className?: string }) {
  const Icon = roomIcons[category] ?? MessageSquare
  return <Icon className={className} />
}

const mockUsers = [
  { id: 1, name: 'You', avatar: null, online: true },
  { id: 2, name: 'Alice M.', avatar: null, online: true },
  { id: 3, name: 'Bob K.', avatar: null, online: true },
  { id: 4, name: 'Carla N.', avatar: null, online: false },
  { id: 5, name: 'David O.', avatar: null, online: true },
  { id: 6, name: 'Emma P.', avatar: null, online: false },
  { id: 7, name: 'Frank R.', avatar: null, online: true },
  { id: 8, name: 'Jean P.', avatar: null, online: true },
  { id: 9, name: 'Marie L.', avatar: null, online: false },
  { id: 10, name: 'Sophie D.', avatar: null, online: true },
  { id: 11, name: 'TechTeacher', avatar: null, online: true },
  { id: 12, name: 'AIStudent', avatar: null, online: false },
  { id: 13, name: 'DataAnalyst', avatar: null, online: true },
  { id: 14, name: 'Instructor Paul', avatar: null, online: true },
  { id: 15, name: 'Mentor Sarah', avatar: null, online: true },
]

const mockRooms = [
  { id: 1, name: 'General', category: 'general', description: 'Welcome to the Pacemaker community! Chat about anything.', memberCount: 156, pinned: true },
  { id: 2, name: 'Languages', category: 'languages', description: 'Practice languages together — English, French, German, Kiswahili & more', memberCount: 89, pinned: true },
  { id: 3, name: 'Exam Prep', category: 'exam-prep', description: 'TOEFL, IELTS, DELF, SAT — prep tips and study groups', memberCount: 67, pinned: false },
  { id: 4, name: 'Mechanics', category: 'mechanics', description: 'Auto mechanics, engine diagnostics & automotive tech', memberCount: 34, pinned: false },
  { id: 5, name: 'Bakery', category: 'bakery', description: 'Sourdough, pastry, artisan bread — share recipes & tips', memberCount: 28, pinned: false },
  { id: 6, name: 'Salon & Beauty', category: 'salon', description: 'Hair, makeup, nails & beauty business', memberCount: 42, pinned: false },
  { id: 7, name: 'AI Skills', category: 'ai-skills', description: 'AI tools, prompt engineering, and tech discussions', memberCount: 73, pinned: false },
  { id: 8, name: 'Instructors Lounge', category: 'general', description: 'Private space for instructors and mentors', memberCount: 15, pinned: false },
]

function genMsg(id: number, senderId: number, content: string, minutesAgo: number, read: boolean = true, reactions: string[] = []) {
  return { id, senderId, senderName: mockUsers.find(u => u.id === senderId)?.name ?? 'Unknown', content, createdAt: new Date(Date.now() - minutesAgo * 60000).toISOString(), read, reactions }
}

const mockMessages: Record<number, any[]> = {
  1: [
    genMsg(1, 2, 'Hello everyone! How is your learning going today?', 60),
    genMsg(2, 3, 'Great! Just finished a French exercise. The AI tutor is really helpful.', 58),
    genMsg(3, 4, 'Has anyone tried the new bakery course? Thinking of enrolling.', 56),
    genMsg(4, 2, 'Yes! The sourdough module is amazing. Highly recommend it.', 54),
    genMsg(5, 5, 'Just passed my DELF B1! Thanks to this platform!', 52, true, ['🎉', '👏']),
    genMsg(6, 3, 'Congratulations David! That is awesome!', 50),
    genMsg(7, 6, 'Anyone want to practice German together? I am at A2 level.', 48),
    genMsg(8, 7, 'Emma, I would love to! I am also A2 in German.', 46),
    genMsg(9, 2, 'The leaderboard is getting competitive! I need to do more exercises.', 44),
    genMsg(10, 4, 'Same here! The daily streak feature is really motivating.', 42),
    genMsg(11, 14, 'Great to see everyone engaging! Remember to check the new AI tutor feature — it can help with any subject.', 30, true, ['👍']),
    genMsg(12, 15, 'I will be hosting a live Q&A session this Friday at 3 PM. Topic: Effective study techniques. See you there!', 25),
    genMsg(1, 1, 'That sounds great, Sarah! I will definitely join.', 20),
    genMsg(13, 11, 'Just discovered the AI tutor can generate practice quizzes. Game changer!', 15, true, ['🔥', '💯']),
    genMsg(14, 12, 'Yes! I used it to prepare for my TOEFL reading section. Highly recommend.', 10),
    genMsg(15, 13, 'The platform keeps getting better. Love the new dashboard layout too.', 5, false),
  ],
  2: [
    genMsg(16, 8, 'Bonjour tout le monde! Comment allez-vous?', 120),
    genMsg(17, 9, 'Bonjour Jean! Je vais bien, merci. Et toi?', 118),
    genMsg(18, 10, 'Can someone explain the difference between "passé composé" and "imparfait"?', 115),
    genMsg(19, 8, 'Passé composé is for completed actions, imparfait is for ongoing/description in the past.', 113, true, ['📚']),
    genMsg(20, 1, 'Great question! In short: "J\'ai mangé" (I ate — completed) vs "Je mangeais" (I was eating — ongoing).', 110),
    genMsg(21, 3, 'I am learning German. Anyone else?', 90),
    genMsg(22, 7, 'Ich lerne auch Deutsch! Wir können zusammen üben.', 88),
    genMsg(23, 5, 'Need help with English phrasal verbs. They are so confusing!', 60),
    genMsg(24, 14, 'Hi David! Think of them as verb + preposition combinations. "Give up" = stop trying, "Look after" = take care of.', 55, true, ['👍', '❤️']),
    genMsg(25, 1, 'Thanks for the tip, Instructor Paul! That really helps.', 50),
  ],
  3: [
    genMsg(26, 5, 'TOEFL reading section is tough. Any tips?', 180),
    genMsg(27, 11, 'Practice skimming and scanning. Read the questions first, then find answers in the text.', 175),
    genMsg(28, 3, 'I used the platform\'s TOEFL prep course. Scored 102!', 170, true, ['🏆']),
    genMsg(29, 12, 'The mock tests here are very similar to the real exam.', 165),
    genMsg(30, 1, 'How long did you study before taking the test?', 160),
    genMsg(31, 3, 'About 3 months, 2 hours daily. Consistency is key!', 155),
    genMsg(32, 15, 'Great advice Bob! I recommend doing at least one full practice test per week.', 150),
  ],
  4: [
    genMsg(33, 1, 'Anyone know how to diagnose a knocking engine?', 300),
    genMsg(34, 5, 'Could be low oil, worn bearings, or fuel issues. Start with checking oil level.', 295),
    genMsg(35, 7, 'I had a similar issue. Turned out to be a bad spark plug.', 290),
    genMsg(36, 4, 'The mechanics course here has a great module on engine diagnostics.', 285, true, ['🔧']),
  ],
  5: [
    genMsg(37, 4, 'Just baked my first sourdough! It turned out amazing!', 240),
    genMsg(38, 2, 'Carla, that looks incredible! What recipe did you use?', 238),
    genMsg(39, 4, 'I followed the bakery course recipe. The step-by-step video was so helpful.', 235, true, ['🥖', '🔥']),
    genMsg(40, 6, 'I am having trouble with my croissant layers. Any tips?', 200),
    genMsg(41, 14, 'Keep the butter cold and do not overwork the dough. Resting is crucial!', 195),
  ],
  6: [
    genMsg(42, 6, 'New hair coloring technique just dropped — balayage is trending!', 400),
    genMsg(43, 2, 'I have been practicing balayage. The salon course has excellent tutorials.', 395),
    genMsg(44, 7, 'Anyone know good products for curly hair?', 350),
    genMsg(45, 15, 'Try sulfate-free products and deep conditioning once a week.', 345),
  ],
  7: [
    genMsg(46, 11, 'What AI tools are you all using in your classrooms?', 240),
    genMsg(47, 12, 'ChatGPT for lesson planning. Saves me hours!', 235),
    genMsg(48, 13, 'Claude is great for data analysis tasks. Highly recommend it.', 230),
    genMsg(49, 11, 'Has anyone tried the AI for Teachers course? It is excellent!', 225, true, ['🤖']),
    genMsg(50, 1, 'Just finished the AI course. Learned so much about prompt engineering!', 180),
    genMsg(51, 14, 'The AI assistant on this platform is built with 3 models — really powerful.', 120),
  ],
  8: [
    genMsg(52, 14, 'Reminder: Grade submissions are due by Friday.', 180),
    genMsg(53, 15, 'Thanks Paul! Also, the new curriculum materials are now available.', 175),
    genMsg(54, 11, 'The analytics dashboard is great for tracking student progress.', 170),
    genMsg(55, 8, 'Has anyone used the bulk messaging feature for announcements?', 120),
    genMsg(56, 14, 'Yes, works well! Send from the admin panel.', 115),
  ],
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const thisYear = d.getFullYear() === now.getFullYear()
  if (thisYear) return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateHeader(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (dDate.getTime() === today.getTime()) return 'Today'
  if (dDate.getTime() === yesterday.getTime()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

const emojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '💯', '😍', '🙌', '👏', '😢', '😡', '🤔', '💪', '🥺', '😎', '✨', '💡', '📚', '🏆']

function getInitials(name: string) {
  return name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
}

const senderColors = [
  '#075e54', '#1a73e8', '#7c3aed', '#d97706', '#db2777',
  '#78716c', '#059669', '#0d9488', '#4f46e5', '#ea580c',
  '#16a34a', '#9333ea', '#0ea5e9', '#e11d48', '#65a30d',
]

function getSenderColor(id: number) {
  return senderColors[id % senderColors.length]
}

export default function Chat() {
  const { user } = useAuth()
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [activeRoom, setActiveRoom] = useState<number>(1)
  const [message, setMessage] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [showAttach, setShowAttach] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [replyTo, setReplyTo] = useState<any>(null)
  const [selectedMsgId, setSelectedMsgId] = useState<number | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeRoomData = mockRooms.find(r => r.id === activeRoom)
  const messages = mockMessages[activeRoom] ?? []

  const filteredRooms = useMemo(() => {
    if (!sidebarSearch.trim()) return mockRooms
    const q = sidebarSearch.toLowerCase()
    return mockRooms.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    )
  }, [sidebarSearch])

  const pinnedRooms = useMemo(() => filteredRooms.filter(r => r.pinned), [filteredRooms])
  const unpinnedRooms = useMemo(() => filteredRooms.filter(r => !r.pinned), [filteredRooms])

  const groupedRooms = useMemo(() => {
    const groups: { label: string; rooms: typeof mockRooms }[] = []
    if (pinnedRooms.length) groups.push({ label: 'Pinned', rooms: pinnedRooms })
    if (unpinnedRooms.length) groups.push({ label: 'All Chats', rooms: unpinnedRooms })
    return groups
  }, [pinnedRooms, unpinnedRooms])

  const scrollToBottom = (smooth = true) => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
      }
    }, 50)
  }

  useEffect(() => {
    scrollToBottom(false)
    setShowScrollBtn(false)
  }, [activeRoom])

  useEffect(() => {
    scrollToBottom(true)
  }, [messages.length])

  const handleScroll = () => {
    if (!chatScrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300)
  }

  const handleSend = () => {
    if (!message.trim()) return
    toast.success('Message sent!')
    setMessage('')
    setReplyTo(null)
    setShowEmoji(false)
    setShowAttach(false)
    setTimeout(scrollToBottom, 100)
  }

  const handleReply = (msg: any) => {
    setReplyTo(msg)
    setSelectedMsgId(null)
    inputRef.current?.focus()
  }

  const handleDeleteMsg = (e: React.MouseEvent, _msgId: number) => {
    e.stopPropagation()
    toast.success('Message deleted for you')
    setSelectedMsgId(null)
  }

  const handleReact = (_msgId: number, emoji: string) => {
    toast.success(`Reacted with ${emoji}`)
    setSelectedMsgId(null)
  }

  const unreadCount = (roomId: number) => {
    return (mockMessages[roomId] ?? []).filter((m: any) => !m.read).length
  }

  const isUserOnline = (userId: number) => {
    return mockUsers.find(u => u.id === userId)?.online ?? false
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="absolute top-20 left-4">
          <BackButton />
        </div>
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
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-gray-200 bg-white flex-shrink-0 flex items-center justify-between">
        <BackButton />
        <span className="text-xs text-gray-400">Pacemaker Community</span>
      </div>
      <div className="flex flex-1 min-h-0">
        {/* === Sidebar — WhatsApp-style chat list === */}
        <div className={`${showInfo ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 border-r border-gray-200 bg-white flex-shrink-0 flex-col`}>
          {/* Sidebar Header */}
          <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <h2 className="font-semibold text-base">Pacemaker Community</h2>
            <div className="flex items-center gap-3">
              <button className="hover:opacity-80 transition-opacity">
                <MessageSquare className="h-5 w-5" />
              </button>
              <button className="hover:opacity-80 transition-opacity">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="px-3 py-2 bg-gray-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                placeholder="Search or start new chat"
                value={sidebarSearch}
                onChange={e => setSidebarSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-white text-sm border-0 outline-none transition-shadow focus:shadow-md"
              />
            </div>
          </div>

          {/* Room List */}
          <ScrollArea className="flex-1">
            {groupedRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm px-6 text-center">
                <Search className="h-8 w-8 mb-2 opacity-50" />
                <p>No chats found</p>
              </div>
            ) : (
              groupedRooms.map(group => (
                <div key={group.label}>
                  <div className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    {group.label}
                  </div>
                  {group.rooms.map(room => {
                    const isActive = activeRoom === room.id
                    const unread = unreadCount(room.id)
                    const lastMsg = mockMessages[room.id]?.[mockMessages[room.id].length - 1]
                    return (
                      <button
                        key={room.id}
                        onClick={() => { setActiveRoom(room.id); setShowInfo(false) }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-100 transition-all duration-150 ${
                          isActive ? 'bg-[#e8f4f0]' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: roomColors[room.category] ?? '#075e54' }}>
                            <RoomIcon category={room.category} />
                          </div>
                          {isUserOnline(room.id) && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center">
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'} text-gray-900 truncate flex items-center gap-1.5`}>
                              {room.pinned && <Pin className="h-3 w-3 text-gray-400" />}
                              {room.name}
                            </span>
                            {lastMsg && (
                              <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2 whitespace-nowrap">
                                {formatTime(lastMsg.createdAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className={`text-xs truncate ${unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                              {lastMsg ? (
                                <>
                                  {lastMsg.senderId === 1 && <span className="text-[#075e54]">You: </span>}
                                  {lastMsg.senderId !== 1 && <span className="text-gray-400">{lastMsg.senderName.split(' ')[0]}: </span>}
                                  {lastMsg.content}
                                </>
                              ) : room.description}
                            </span>
                            {unread > 0 && (
                              <span className="w-5 h-5 rounded-full bg-[#25d366] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 ml-2 shadow-sm">
                                {unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </ScrollArea>
        </div>

        {/* === Chat Area — WhatsApp-style === */}
        <div className={`${showInfo ? 'hidden lg:flex' : 'flex'} flex-1 flex-col bg-[#efeae2] min-w-0`}>
          {activeRoomData ? (
            <>
              {/* Chat Header */}
              <div className="bg-[#075e54] text-white px-4 py-2 flex items-center gap-3 flex-shrink-0 shadow-sm">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: roomColors[activeRoomData.category] ?? '#075e54' }}>
                    <RoomIcon category={activeRoomData.category} />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm flex items-center gap-1.5">
                    {activeRoomData.name}
                    {activeRoomData.pinned && <Pin className="h-3 w-3 text-white/70" />}
                  </h3>
                  <p className="text-[11px] text-white/70 truncate">
                    {activeRoomData.memberCount} members · {activeRoomData.description.slice(0, 40)}...
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 cursor-pointer hover:opacity-80" />
                  <Phone className="h-5 w-5 cursor-pointer hover:opacity-80" />
                  <button onClick={() => setShowInfo(!showInfo)} className="hover:opacity-80 transition-opacity">
                    <Info className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={chatScrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto relative"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4d9d0' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundColor: '#efeae2'
                }}
              >
                <div className="px-4 py-3 space-y-1 max-w-4xl mx-auto">
                  {(() => {
                    let lastDate = ''
                    const renderedMsgs: any[] = []
                    messages.forEach((msg: any, idx: number) => {
                      const msgDate = formatDateHeader(msg.createdAt)
                      if (msgDate !== lastDate) {
                        renderedMsgs.push({ type: 'date', content: msgDate })
                        lastDate = msgDate
                      }
                      renderedMsgs.push({ type: 'msg', data: msg, idx })
                    })
                    return renderedMsgs.map((item, i) => {
                      if (item.type === 'date') {
                        return (
                          <div key={`d-${i}`} className="flex justify-center my-3">
                            <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1 shadow-sm">
                              <span className="text-[11px] text-gray-500 font-medium">{item.content}</span>
                            </div>
                          </div>
                        )
                      }
                      const msg = item.data
                      const idx = item.idx
                      const isMe = msg.senderId === 1
                      const showName = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId)
                      const showActions = selectedMsgId === msg.id
                      return (
                        <div
                          key={msg.id}
                          className={`group relative flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}
                          style={{ animationDuration: `${100 + idx * 30}ms` }}
                        >
                          <div className={`max-w-[70%] md:max-w-[55%] ${isMe ? 'order-1' : 'order-0'}`}>
                            {showName && (
                              <p className="text-[11px] font-semibold ml-1 mb-0.5" style={{ color: getSenderColor(msg.senderId) }}>
                                {msg.senderName}
                              </p>
                            )}
                            <div
                              className={`relative px-3 py-1.5 text-sm shadow-sm transition-shadow hover:shadow-md ${
                                isMe
                                  ? 'bg-[#dcf8c6] rounded-lg rounded-br-sm'
                                  : 'bg-white rounded-lg rounded-bl-sm'
                              }`}
                              onClick={() => setSelectedMsgId(showActions ? null : msg.id)}
                            >
                              {/* Reply quote */}
                              {replyTo && replyTo.id === msg.id && (
                                <div className="text-[10px] text-emerald-600 mb-1 flex items-center gap-1">
                                  <Reply className="h-3 w-3" /> Replying
                                </div>
                              )}
                              <p className="text-gray-800 leading-relaxed">{msg.content}</p>
                              <div className="flex items-center justify-end gap-1 mt-0.5">
                                <span className={`text-[10px] ${isMe ? 'text-[#6b8a5e]' : 'text-gray-400'}`}>
                                  {formatTime(msg.createdAt)}
                                </span>
                                {isMe && (
                                  <span className="flex-shrink-0">
                                    {msg.read ? (
                                      <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5 text-gray-400" />
                                    )}
                                  </span>
                                )}
                              </div>
                              {/* Reactions */}
                              {msg.reactions?.length > 0 && (
                                <div className="absolute -bottom-2 right-2 flex -space-x-1">
                                  {msg.reactions.slice(0, 4).map((emoji: string, ri: number) => (
                                    <span key={ri} className="text-xs bg-white rounded-full px-0.5 shadow-sm border border-gray-100">{emoji}</span>
                                  ))}
                                </div>
                              )}
                              {/* Message actions on hover */}
                              {showActions && (
                                <div className={`absolute ${isMe ? 'left-0 -translate-x-full pl-1' : 'right-0 translate-x-full pr-1'} top-1/2 -translate-y-1/2 flex flex-col gap-0.5`}>
                                  <button
                                    onClick={() => handleReply(msg)}
                                    className="p-1.5 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
                                    title="Reply"
                                  >
                                    <Reply className="h-3.5 w-3.5 text-gray-500" />
                                  </button>
                                  <div className="relative">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setSelectedMsgId(selectedMsgId === msg.id ? -msg.id : -999) }}
                                      className="p-1.5 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
                                      title="React"
                                    >
                                      <Smile className="h-3.5 w-3.5 text-gray-500" />
                                    </button>
                                    {selectedMsgId === -msg.id && (
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-white rounded-xl shadow-xl border border-gray-200 p-1.5 flex gap-0.5 z-50">
                                        {['👍', '❤️', '😂', '🎉', '🔥', '😍', '💯', '👏'].map(e => (
                                          <button
                                            key={e}
                                            onClick={() => handleReact(msg.id, e)}
                                            className="text-lg hover:scale-125 transition-transform p-0.5"
                                          >
                                            {e}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={(e) => handleDeleteMsg(e, msg.id)}
                                    className="p-1.5 bg-white rounded-full shadow-md border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  })()}
                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-lg rounded-bl-sm px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Scroll to bottom button */}
              {showScrollBtn && (
                <button
                  onClick={() => scrollToBottom(true)}
                  className="fixed bottom-24 right-8 lg:right-12 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all animate-in slide-in-from-bottom-2"
                >
                  <ArrowDown className="h-5 w-5 text-gray-500" />
                </button>
              )}

              {/* Reply preview */}
              {replyTo && (
                <div className="bg-[#e8f4f0] px-4 py-2 flex items-center gap-3 border-t border-[#c8e6c9] flex-shrink-0">
                  <div className="w-0.5 h-8 bg-[#075e54] rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#075e54]">{replyTo.senderName}</p>
                    <p className="text-xs text-gray-500 truncate">{replyTo.content}</p>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Input */}
              <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 flex-shrink-0" onClick={() => setSelectedMsgId(null)}>
                {/* Emoji button */}
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowEmoji(!showEmoji); setShowAttach(false) }}
                    className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                  >
                    <Smile className="h-6 w-6" />
                  </button>
                  {showEmoji && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 grid grid-cols-8 gap-1 z-50">
                      {emojis.map(e => (
                        <button
                          key={e}
                          onClick={() => { setMessage(prev => prev + e); setShowEmoji(false); inputRef.current?.focus() }}
                          className="text-xl hover:scale-125 transition-transform p-0.5"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Attach button */}
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowAttach(!showAttach); setShowEmoji(false) }}
                    className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                  >
                    <Paperclip className="h-6 w-6 rotate-45" />
                  </button>
                  {showAttach && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 min-w-[160px]">
                      {[
                        { icon: Image, label: 'Photos & Videos', color: 'text-pink-500' },
                        { icon: FileText, label: 'Document', color: 'text-blue-500' },
                        { icon: User, label: 'Contact', color: 'text-emerald-500' },
                      ].map((item, i) => (
                        <button
                          key={i}
                          onClick={() => { toast.success(`${item.label} (simulated)`); setShowAttach(false) }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <item.icon className={`h-5 w-5 ${item.color}`} />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  ref={inputRef}
                  placeholder="Type a message"
                  value={message}
                  onChange={e => {
                    setMessage(e.target.value)
                    if (!isTyping && e.target.value) {
                      setIsTyping(true)
                      setTimeout(() => setIsTyping(false), 3000)
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  className="flex-1 h-10 rounded-lg border-0 px-3 text-sm outline-none bg-white transition-shadow focus:shadow-md"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="text-[#075e54] disabled:text-gray-300 hover:text-[#054d44] transition-colors p-1"
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

        {/* === Group Info Panel === */}
        {showInfo && activeRoomData && (
          <div className="w-80 border-l border-gray-200 bg-white flex-shrink-0 flex flex-col animate-in slide-in-from-right">
            {/* Info Header */}
            <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
              <h2 className="font-semibold text-sm">Group Info</h2>
              <button onClick={() => setShowInfo(false)} className="hover:opacity-80">
                <X className="h-5 w-5" />
              </button>
            </div>

            <ScrollArea className="flex-1">
              {/* Group Avatar */}
              <div className="flex flex-col items-center py-8 px-4 border-b border-gray-100">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-3" style={{ backgroundColor: roomColors[activeRoomData.category] ?? '#075e54' }}>
                  <RoomIcon category={activeRoomData.category} className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{activeRoomData.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{activeRoomData.memberCount} members</p>
                <p className="text-xs text-gray-400 text-center mt-2 max-w-xs">{activeRoomData.description}</p>
              </div>

              {/* Media */}
              <div className="px-4 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Shared Media</h4>
                  <span className="text-xs text-[#075e54] font-medium cursor-pointer hover:underline">See all</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=150',
                    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=150',
                    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=150',
                    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150',
                    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150',
                    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150',
                  ].map((url, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Members */}
              <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">{activeRoomData.memberCount} Members</h4>
                  <span className="text-xs text-[#075e54] font-medium cursor-pointer hover:underline">View all</span>
                </div>
                <div className="space-y-0.5">
                  {mockUsers.slice(0, 8).map(u => (
                    <div key={u.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: u.id === 1 ? '#075e54' : getSenderColor(u.id) }}
                        >
                          {getInitials(u.name)}
                        </div>
                        {u.online && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{u.name}</span>
                          {u.id === 1 && <span className="text-[10px] text-gray-400">(You)</span>}
                          {u.id === 14 && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">Instructor</span>}
                        </div>
                        <span className="text-xs text-gray-400">
                          {u.online ? 'online' : 'last seen offline'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {mockUsers.length > 8 && (
                    <button className="w-full text-center text-xs text-[#075e54] font-medium py-2 hover:underline">
                      +{mockUsers.length - 8} more members
                    </button>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}
