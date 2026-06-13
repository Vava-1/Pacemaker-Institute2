import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { BackButton } from '@/components/BackButton'
import { trpc } from '@/providers/trpc'
import {
  MessageSquare, Send, Languages,
  Wrench, Cake, Scissors, Brain, GraduationCap,
  Search, MoreVertical, Phone,
  Pin, Reply, Trash2, Smile, Paperclip,
  Image, FileText, User, X, ArrowDown, Check,
  CheckCheck, Info, Loader2,
} from 'lucide-react'
import type { TRPCClientErrorLike } from '@trpc/client'
import type { AppRouter } from '../../../backend/api/router'

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

const roleBadge: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  instructor: 'bg-emerald-100 text-emerald-700',
  user: 'bg-blue-100 text-blue-600',
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
  const [activeRoom, setActiveRoom] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [showAttach, setShowAttach] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [replyTo, setReplyTo] = useState<{ id: number; senderName: string; content: string } | null>(null)
  const [selectedMsgId, setSelectedMsgId] = useState<number | null>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // ── Queries ──────────────────────────────────────────────────────

  const { data: roomsData, isLoading: roomsLoading } = trpc.message.rooms.useQuery(undefined, {
    refetchInterval: 30_000,
  })

  const { data: messagesData, isLoading: msgsLoading, refetch: refetchMessages } = trpc.message.listByRoom.useQuery(
    { roomId: activeRoom ?? 0, limit: 50 },
    { enabled: !!activeRoom, refetchInterval: 10_000 },
  )

  const sendMutation = trpc.message.send.useMutation({
    onSuccess: () => {
      setMessage('')
      setReplyTo(null)
      setShowEmoji(false)
      setShowAttach(false)
      refetchMessages()
      setTimeout(scrollToBottom, 100)
    },
    onError: (err: TRPCClientErrorLike<AppRouter>) => {
      toast.error(err.message || 'Failed to send message')
    },
  })

  const reactMutation = trpc.message.react.useMutation({
    onSuccess: () => refetchMessages(),
    onError: (err: TRPCClientErrorLike<AppRouter>) => toast.error(err.message || 'Failed to react'),
  })

  const deleteMutation = trpc.message.delete.useMutation({
    onSuccess: () => refetchMessages(),
    onError: (err: TRPCClientErrorLike<AppRouter>) => toast.error(err.message || 'Failed to delete'),
  })

  const rooms: any[] = useMemo(() => (roomsData ?? []).map((r: any) => ({
    ...r,
    pinned: ['general', 'languages'].includes(r.slug),
  })), [roomsData])

  const messages: any[] = useMemo(() => messagesData?.messages ?? [], [messagesData])

  const activeRoomData = rooms.find((r: any) => r.id === activeRoom)

  const filteredRooms: any[] = useMemo(() => {
    if (!sidebarSearch.trim()) return rooms
    const q = sidebarSearch.toLowerCase()
    return rooms.filter((r: any) =>
      r.name.toLowerCase().includes(q) ||
      (r.description ?? '').toLowerCase().includes(q)
    )
  }, [sidebarSearch, rooms])

  const pinnedRooms = useMemo(() => filteredRooms.filter((r: any) => r.pinned), [filteredRooms])
  const unpinnedRooms = useMemo(() => filteredRooms.filter((r: any) => !r.pinned), [filteredRooms])

  const groupedRooms = useMemo(() => {
    const groups: { label: string; rooms: typeof filteredRooms }[] = []
    if (pinnedRooms.length) groups.push({ label: 'Pinned', rooms: pinnedRooms })
    if (unpinnedRooms.length) groups.push({ label: 'All Chats', rooms: unpinnedRooms })
    return groups
  }, [pinnedRooms, unpinnedRooms])

  const scrollToBottom = useCallback((smooth = true) => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
      }
    }, 50)
  }, [])

  useEffect(() => {
    scrollToBottom(false)
    setShowScrollBtn(false)
  }, [activeRoom, scrollToBottom])

  useEffect(() => {
    scrollToBottom(true)
  }, [messages.length, scrollToBottom])

  const handleScroll = useCallback(() => {
    if (!chatScrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300)
  }, [])

  const handleSend = useCallback(() => {
    if (!message.trim() || !activeRoom) return
    sendMutation.mutate({
      roomId: activeRoom,
      content: message.trim(),
      replyToId: replyTo?.id,
    })
  }, [message, activeRoom, replyTo, sendMutation])

  const handleReply = useCallback((msg: { id: number; senderName: string | null; content: string }) => {
    setReplyTo({ id: msg.id, senderName: msg.senderName ?? 'Unknown', content: msg.content })
    setSelectedMsgId(null)
    inputRef.current?.focus()
  }, [])

  const handleDeleteMsg = useCallback((e: React.MouseEvent, msgId: number) => {
    e.stopPropagation()
    deleteMutation.mutate({ messageId: msgId })
    setSelectedMsgId(null)
  }, [deleteMutation])

  const handleReact = useCallback((msgId: number, emoji: string) => {
    reactMutation.mutate({ messageId: msgId, emoji })
    setSelectedMsgId(null)
  }, [reactMutation])

  const unreadCount = useCallback((roomId: number) => {
    if (roomId !== activeRoom) return 0
    return messages.filter((m: any) => m.senderId !== user?.id && !m.isRead).length
  }, [messages, activeRoom, user?.id])

  // ── Keyboard shortcuts ───────────────────────────────────────────

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowInfo(false)
        setShowEmoji(false)
        setShowAttach(false)
        setSelectedMsgId(null)
        setReplyTo(null)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ── Render ───────────────────────────────────────────────────────

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
        {/* === Sidebar === */}
        <div className={`${showInfo ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 border-r border-gray-200 bg-white flex-shrink-0 flex-col`}>
          <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <h2 className="font-semibold text-base">Pacemaker Community</h2>
            <div className="flex items-center gap-3">
              <button className="hover:opacity-80 transition-opacity" aria-label="New chat">
                <MessageSquare className="h-5 w-5" />
              </button>
              <button className="hover:opacity-80 transition-opacity" aria-label="More options">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-3 py-2 bg-gray-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                placeholder="Search or start new chat  ⌘K"
                value={sidebarSearch}
                onChange={e => setSidebarSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-white text-sm border-0 outline-none transition-shadow focus:shadow-md focus-visible:ring-2 focus-visible:ring-[#075e54]"
                aria-label="Search chats"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {roomsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : groupedRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm px-6 text-center">
                <Search className="h-8 w-8 mb-2 opacity-50" />
                <p>No chats found</p>
              </div>
            ) : (
              groupedRooms.map(group => (
                <div key={group.label}>
                  <div className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider" role="presentation">
                    {group.label}
                  </div>
                  {group.rooms.map(room => {
                    const isActive = activeRoom === room.id
                    const unread = unreadCount(room.id)
                    const lastMsg = messagesData?.messages?.[0]
                    return (
                      <button
                        key={room.id}
                        onClick={() => { setActiveRoom(room.id); setShowInfo(false) }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-100 transition-all duration-150 ${
                          isActive ? 'bg-[#e8f4f0]' : 'hover:bg-gray-50'
                        }`}
                        aria-current={isActive ? 'true' : undefined}
                        aria-label={`${room.name} chat room`}
                      >
                        <div className="relative flex-shrink-0" aria-hidden="true">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: roomColors[room.category] ?? '#075e54' }}>
                            <RoomIcon category={room.category} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'} text-gray-900 truncate flex items-center gap-1.5`}>
                              {room.pinned && <Pin className="h-3 w-3 text-gray-400" aria-hidden="true" />}
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
                                  {lastMsg.senderId === user.id && <span className="text-[#075e54]">You: </span>}
                                  {lastMsg.senderId !== user.id && lastMsg.senderName && <span className="text-gray-400">{lastMsg.senderName.split(' ')[0]}: </span>}
                                  {lastMsg.content}
                                </>
                              ) : room.description}
                            </span>
                            {unread > 0 && (
                              <span className="w-5 h-5 rounded-full bg-[#25d366] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 ml-2 shadow-sm" aria-label={`${unread} unread messages`}>
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

        {/* === Chat Area === */}
        <div className={`${showInfo ? 'hidden lg:flex' : 'flex'} flex-1 flex-col bg-[#efeae2] min-w-0`}>
          {activeRoomData ? (
            <>
              <div className="bg-[#075e54] text-white px-4 py-2 flex items-center gap-3 flex-shrink-0 shadow-sm">
                <div className="relative" aria-hidden="true">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: roomColors[activeRoomData.category] ?? '#075e54' }}>
                    <RoomIcon category={activeRoomData.category} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm flex items-center gap-1.5">
                    {activeRoomData.name}
                    {activeRoomData.pinned && <Pin className="h-3 w-3 text-white/70" aria-hidden="true" />}
                  </h3>
                  <p className="text-[11px] text-white/70 truncate">
                    {activeRoomData.memberCount} members
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 cursor-pointer hover:opacity-80" aria-label="Search in chat" />
                  <Phone className="h-5 w-5 cursor-pointer hover:opacity-80" aria-label="Call" />
                  <button onClick={() => setShowInfo(!showInfo)} className="hover:opacity-80 transition-opacity" aria-label="Toggle group info">
                    <Info className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div
                ref={chatScrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto relative"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4d9d0' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundColor: '#efeae2'
                }}
                role="log"
                aria-label="Messages"
                aria-live="polite"
              >
                {msgsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                ) : (
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
                            <div key={`d-${i}`} className="flex justify-center my-3" role="separator" aria-label={item.content}>
                              <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1 shadow-sm">
                                <span className="text-[11px] text-gray-500 font-medium">{item.content}</span>
                              </div>
                            </div>
                          )
                        }
                        const msg = item.data
                        const idx = item.idx
                        const isMe = msg.senderId === user.id
                        const showName = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId)
                        const showActions = selectedMsgId === msg.id
                        const reactions = (msg.reactions ?? []) as { emoji: string; userId: number }[]
                        const reactionSummary = reactions
                          .reduce((acc: string[], r: { emoji: string; userId: number }) => {
                            if (!acc.includes(r.emoji)) acc.push(r.emoji)
                            return acc
                          }, [] as string[])
                        return (
                          <div
                            key={msg.id}
                            className={`group relative flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}
                            style={{ animationDuration: `${100 + idx * 30}ms` }}
                          >
                            <div className={`max-w-[70%] md:max-w-[55%] ${isMe ? 'order-1' : 'order-0'}`}>
                              {showName && (
                                <div className="flex items-center gap-1.5 ml-1 mb-0.5">
                                  <p className="text-[11px] font-semibold" style={{ color: getSenderColor(msg.senderId) }}>
                                    {msg.senderName}
                                  </p>
                                  {msg.senderRole && msg.senderRole !== 'user' && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleBadge[msg.senderRole] ?? ''}`}>
                                      {msg.senderRole === 'admin' ? 'Admin' : 'Instructor'}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div
                                className={`relative px-3 py-1.5 text-sm shadow-sm transition-shadow hover:shadow-md ${
                                  isMe
                                    ? 'bg-[#dcf8c6] rounded-lg rounded-br-sm'
                                    : 'bg-white rounded-lg rounded-bl-sm'
                                }`}
                                onClick={() => setSelectedMsgId(showActions ? null : msg.id)}
                                role="button"
                                tabIndex={0}
                                aria-label={`Message from ${msg.senderName ?? 'unknown'}`}
                                onKeyDown={(e) => { if (e.key === 'Enter') setSelectedMsgId(showActions ? null : msg.id) }}
                              >
                                {/* Reply quote */}
                                {msg.replyPreview && (
                                  <div className="border-l-2 border-[#075e54] pl-2 mb-1.5">
                                    <p className="text-[10px] font-semibold text-[#075e54]">{msg.replyPreview.senderName}</p>
                                    <p className="text-[11px] text-gray-500 truncate">{msg.replyPreview.content}</p>
                                  </div>
                                )}
                                <p className="text-gray-800 leading-relaxed">{msg.content}</p>
                                <div className="flex items-center justify-end gap-1 mt-0.5">
                                  <span className={`text-[10px] ${isMe ? 'text-[#6b8a5e]' : 'text-gray-400'}`}>
                                    {formatTime(msg.createdAt)}
                                  </span>
                                  {isMe && (
                                    <span className="flex-shrink-0" aria-label={msg.isRead ? 'Read' : 'Sent'}>
                                      {msg.isRead ? (
                                        <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                                      ) : (
                                        <Check className="h-3.5 w-3.5 text-gray-400" />
                                      )}
                                    </span>
                                  )}
                                </div>
                                {/* Reactions */}
                                {reactionSummary.length > 0 && (
                                  <div className="absolute -bottom-2 right-2 flex -space-x-1" aria-label={`Reactions: ${reactionSummary.join(', ')}`}>
                                    {reactionSummary.slice(0, 4).map((emoji: string, ri: number) => (
                                      <span key={ri} className="text-xs bg-white rounded-full px-0.5 shadow-sm border border-gray-100">{emoji}</span>
                                    ))}
                                  </div>
                                )}
                                {/* Message actions on click */}
                                {showActions && (
                                  <div className={`absolute ${isMe ? 'left-0 -translate-x-full pl-1' : 'right-0 translate-x-full pr-1'} top-1/2 -translate-y-1/2 flex flex-col gap-0.5`}>
                                    <button
                                      onClick={() => handleReply(msg)}
                                      className="p-1.5 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
                                      title="Reply"
                                      aria-label="Reply to message"
                                    >
                                      <Reply className="h-3.5 w-3.5 text-gray-500" />
                                    </button>
                                    <div className="relative">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedMsgId(selectedMsgId === msg.id ? -msg.id : -999) }}
                                        className="p-1.5 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
                                        title="React"
                                        aria-label="React to message"
                                      >
                                        <Smile className="h-3.5 w-3.5 text-gray-500" />
                                      </button>
                                      {selectedMsgId === -msg.id && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-white rounded-xl shadow-xl border border-gray-200 p-1.5 flex gap-0.5 z-50" role="toolbar" aria-label="Emoji reactions">
                                          {['👍', '❤️', '😂', '🎉', '🔥', '😍', '💯', '👏'].map(e => (
                                            <button
                                              key={e}
                                              onClick={() => handleReact(msg.id, e)}
                                              className="text-lg hover:scale-125 transition-transform p-0.5"
                                              aria-label={`React with ${e}`}
                                            >
                                              {e}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    {isMe && (
                                      <button
                                        onClick={(e) => handleDeleteMsg(e, msg.id)}
                                        className="p-1.5 bg-white rounded-full shadow-md border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors"
                                        title="Delete"
                                        aria-label="Delete message"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    })()}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {showScrollBtn && (
                <button
                  onClick={() => scrollToBottom(true)}
                  className="fixed bottom-24 right-8 lg:right-12 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all animate-in slide-in-from-bottom-2"
                  aria-label="Scroll to bottom"
                >
                  <ArrowDown className="h-5 w-5 text-gray-500" />
                </button>
              )}

              {replyTo && (
                <div className="bg-[#e8f4f0] px-4 py-2 flex items-center gap-3 border-t border-[#c8e6c9] flex-shrink-0">
                  <div className="w-0.5 h-8 bg-[#075e54] rounded-full flex-shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#075e54]">{replyTo.senderName}</p>
                    <p className="text-xs text-gray-500 truncate">{replyTo.content}</p>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0" aria-label="Cancel reply">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 flex-shrink-0" onClick={() => setSelectedMsgId(null)}>
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowEmoji(!showEmoji); setShowAttach(false) }}
                    className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                    aria-label="Open emoji picker"
                  >
                    <Smile className="h-6 w-6" />
                  </button>
                  {showEmoji && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 grid grid-cols-8 gap-1 z-50" role="toolbar" aria-label="Emoji picker">
                      {emojis.map(e => (
                        <button
                          key={e}
                          onClick={() => { setMessage(prev => prev + e); setShowEmoji(false); inputRef.current?.focus() }}
                          className="text-xl hover:scale-125 transition-transform p-0.5"
                          aria-label={`Emoji ${e}`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowAttach(!showAttach); setShowEmoji(false) }}
                    className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                    aria-label="Attach file"
                  >
                    <Paperclip className="h-6 w-6 rotate-45" />
                  </button>
                  {showAttach && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 min-w-[160px]" role="menu" aria-label="Attachment options">
                      {[
                        { icon: Image, label: 'Photos & Videos', color: 'text-pink-500' },
                        { icon: FileText, label: 'Document', color: 'text-blue-500' },
                        { icon: User, label: 'Contact', color: 'text-emerald-500' },
                      ].map((item, i) => (
                        <button
                          key={i}
                          onClick={() => { toast.success(`${item.label} (simulated)`); setShowAttach(false) }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                          role="menuitem"
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
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  disabled={sendMutation.isPending}
                  className="flex-1 h-10 rounded-lg border-0 px-3 text-sm outline-none bg-white transition-shadow focus:shadow-md focus-visible:ring-2 focus-visible:ring-[#075e54]"
                  aria-label="Message input"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || sendMutation.isPending}
                  className="text-[#075e54] disabled:text-gray-300 hover:text-[#054d44] transition-colors p-1"
                  aria-label="Send message"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Send className="h-6 w-6" />
                  )}
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
          <div className="w-80 border-l border-gray-200 bg-white flex-shrink-0 flex flex-col animate-in slide-in-from-right" role="complementary" aria-label="Group information">
            <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
              <h2 className="font-semibold text-sm">Group Info</h2>
              <button onClick={() => setShowInfo(false)} className="hover:opacity-80" aria-label="Close group info">
                <X className="h-5 w-5" />
              </button>
            </div>

            <ScrollArea className="flex-1">
              <div className="flex flex-col items-center py-8 px-4 border-b border-gray-100">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-3" style={{ backgroundColor: roomColors[activeRoomData.category] ?? '#075e54' }} aria-hidden="true">
                  <RoomIcon category={activeRoomData.category} className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{activeRoomData.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{activeRoomData.memberCount} members</p>
                <p className="text-xs text-gray-400 text-center mt-2 max-w-xs">{activeRoomData.description}</p>
              </div>

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

              <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">{activeRoomData.memberCount} Members</h4>
                  <span className="text-xs text-[#075e54] font-medium cursor-pointer hover:underline">View all</span>
                </div>
                <div className="space-y-0.5">
                  {/* Members would come from a separate endpoint */}
                  <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#075e54' }}>
                        {getInitials(user.name ?? 'You')}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                        <span className="text-[10px] text-gray-400">(You)</span>
                      </div>
                      <span className="text-xs text-gray-400">online</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}
