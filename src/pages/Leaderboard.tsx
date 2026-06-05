import { useState } from 'react'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Trophy, Flame, Target, Clock, Zap, Crown, Medal, Award,
} from 'lucide-react'

export default function Leaderboard() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'allTime'>('allTime')
  const { data: entries } = trpc.leaderboard.list.useQuery({ period, limit: 50 })
  const { data: myRank } = trpc.leaderboard.getUserRank.useQuery({ period }, { enabled: !!user })

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-amber-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />
    if (rank === 3) return <Award className="h-5 w-5 text-orange-400" />
    return <span className="w-5 text-center text-sm font-bold text-slate-400">#{rank}</span>
  }

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 border-amber-200'
    if (rank === 2) return 'bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 border-slate-200'
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 border-orange-200'
    return 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <Trophy className="h-12 w-12 text-amber-500 mx-auto mb-3" />
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Compete with fellow learners and climb the ranks</p>
      </div>

      {/* My Rank Card */}
      {user && myRank && (
        <Card className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  #{myRank.rank ?? '?'}
                </div>
                <div>
                  <div className="font-semibold text-lg">Your Ranking</div>
                  <div className="text-blue-200 text-sm">Keep learning to climb higher!</div>
                </div>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold">{myRank.totalPoints}</div>
                  <div className="text-xs text-blue-200">Points</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{myRank.exercisesCompleted}</div>
                  <div className="text-xs text-blue-200">Exercises</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{myRank.studyHours}h</div>
                  <div className="text-xs text-blue-200">Study Time</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period Tabs */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="mb-6">
        <TabsList className="w-full">
          <TabsTrigger value="weekly" className="flex-1">This Week</TabsTrigger>
          <TabsTrigger value="monthly" className="flex-1">This Month</TabsTrigger>
          <TabsTrigger value="allTime" className="flex-1">All Time</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Top 3 Podium */}
      {entries && entries.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-8">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {entries[1].userName?.charAt(0) ?? 'U'}
            </div>
            <div className="mt-2 text-center">
              <div className="font-medium text-sm">{entries[1].userName ?? 'User'}</div>
              <div className="text-xs text-slate-500">{entries[1].totalPoints} pts</div>
            </div>
            <div className="w-24 h-24 bg-slate-200 dark:bg-slate-700 rounded-t-lg mt-3 flex items-center justify-center">
              <Medal className="h-8 w-8 text-slate-400" />
            </div>
          </div>
          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <Crown className="h-6 w-6 text-amber-500 mb-1" />
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-amber-200 dark:ring-amber-900/30">
              {entries[0].userName?.charAt(0) ?? 'U'}
            </div>
            <div className="mt-2 text-center">
              <div className="font-semibold">{entries[0].userName ?? 'User'}</div>
              <div className="text-xs text-slate-500">{entries[0].totalPoints} pts</div>
            </div>
            <div className="w-28 h-32 bg-gradient-to-t from-amber-200 to-amber-100 dark:from-amber-900/40 dark:to-amber-900/20 rounded-t-lg mt-3 flex items-center justify-center">
              <Trophy className="h-10 w-10 text-amber-500" />
            </div>
          </div>
          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {entries[2].userName?.charAt(0) ?? 'U'}
            </div>
            <div className="mt-2 text-center">
              <div className="font-medium text-sm">{entries[2].userName ?? 'User'}</div>
              <div className="text-xs text-slate-500">{entries[2].totalPoints} pts</div>
            </div>
            <div className="w-24 h-16 bg-orange-200 dark:bg-orange-900/30 rounded-t-lg mt-3 flex items-center justify-center">
              <Award className="h-8 w-8 text-orange-400" />
            </div>
          </div>
        </div>
      )}

      {/* Full Rankings */}
      <div className="space-y-2">
        {entries?.map((entry, i) => (
          <div key={entry.id} className={`flex items-center gap-4 p-4 rounded-xl border ${getRankBg(i + 1)} transition-colors hover:shadow-md`}>
            <div className="w-8 flex justify-center">
              {getRankIcon(i + 1)}
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
              {entry.userName?.charAt(0) ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{entry.userName ?? 'Anonymous'}</div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {entry.exercisesCompleted} exercises</span>
                <span className="flex items-center gap-1"><Flame className="h-3 w-3" /> {entry.currentStreak}d streak</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {entry.studyHours}h</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-blue-600 flex items-center gap-1">
                <Zap className="h-4 w-4 text-amber-500" /> {entry.totalPoints}
              </div>
              <div className="text-xs text-slate-500">points</div>
            </div>
          </div>
        ))}
      </div>

      {(!entries || entries.length === 0) && (
        <div className="text-center py-16">
          <Trophy className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No entries yet</h3>
          <p className="text-slate-500">Be the first to complete exercises and appear on the leaderboard!</p>
        </div>
      )}
    </div>
  )
}
