import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Trophy, Flame, Target, Clock, Zap, Crown, Medal, Award,
} from 'lucide-react'
import { BackButton } from '@/components/BackButton'

export default function Leaderboard() {
  const { user } = useAuth()
  const { t } = useTranslation()
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
    if (rank === 1) return 'bg-amber-50 border-amber-200'
    if (rank === 2) return 'bg-slate-50 border-slate-200'
    if (rank === 3) return 'bg-orange-50 border-orange-200'
    return 'bg-white border-slate-200/80'
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <BackButton />
      <div className="text-center mb-6 md:mb-8">
        <div className="w-12 md:w-14 h-12 md:h-14 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3 md:mb-4">
          <Trophy className="h-6 md:h-7 w-6 md:w-7 text-amber-500" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-brand-950 mb-2">{t('leaderboard.title')}</h1>
        <p className="text-sm md:text-base text-slate-500">{t('leaderboard.description')}</p>
      </div>

      {/* My Rank Card */}
      {user && myRank && (
        <Card className="mb-6 bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0 shadow-elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  #{myRank.rank ?? '?'}
                </div>
                <div>
                  <div className="font-semibold text-lg">{t('leaderboard.yourRanking')}</div>
                  <div className="text-blue-200 text-sm">{t('leaderboard.keepLearning')}</div>
                </div>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold">{myRank.totalPoints}</div>
                  <div className="text-xs text-blue-200">{t('leaderboard.points')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{myRank.exercisesCompleted}</div>
                  <div className="text-xs text-blue-200">{t('leaderboard.exercises')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{myRank.studyHours}{t('leaderboard.h')}</div>
                  <div className="text-xs text-blue-200">{t('leaderboard.studyTime')}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period Tabs */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="mb-6">
        <TabsList className="w-full bg-slate-100/80">
          <TabsTrigger value="weekly" className="flex-1 text-xs data-[state=active]:bg-white data-[state=active]:shadow-xs">{t('leaderboard.thisWeek')}</TabsTrigger>
          <TabsTrigger value="monthly" className="flex-1 text-xs data-[state=active]:bg-white data-[state=active]:shadow-xs">{t('leaderboard.thisMonth')}</TabsTrigger>
          <TabsTrigger value="allTime" className="flex-1 text-xs data-[state=active]:bg-white data-[state=active]:shadow-xs">{t('leaderboard.allTime')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Top 3 Podium */}
      {entries && entries.length >= 3 && (
        <div className="flex items-end justify-center gap-2 md:gap-4 mb-6 md:mb-8">
          <div className="flex flex-col items-center">
            <div className="w-12 md:w-16 h-12 md:h-16 rounded-full bg-slate-400 flex items-center justify-center text-white text-sm md:text-xl font-bold shadow-sm">
              {entries[1].userName?.charAt(0) ?? 'U'}
            </div>
            <div className="mt-1 md:mt-2 text-center">
              <div className="font-medium text-xs md:text-sm text-brand-950 truncate max-w-[72px] md:max-w-none">{entries[1].userName ?? 'User'}</div>
              <div className="text-[10px] md:text-xs text-slate-500">{entries[1].totalPoints} {t('leaderboard.pts')}</div>
            </div>
            <div className="w-16 md:w-24 h-16 md:h-24 bg-slate-200 rounded-t-lg mt-2 md:mt-3 flex items-center justify-center">
              <Medal className="h-5 md:h-8 w-5 md:w-8 text-slate-400" />
            </div>
          </div>
          <div className="flex flex-col items-center">
            <Crown className="h-5 md:h-6 w-5 md:w-6 text-amber-500 mb-1" />
            <div className="w-14 md:w-20 h-14 md:h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white text-lg md:text-2xl font-bold shadow-sm ring-2 md:ring-4 ring-amber-200">
              {entries[0].userName?.charAt(0) ?? 'U'}
            </div>
            <div className="mt-1 md:mt-2 text-center">
              <div className="font-semibold text-xs md:text-base text-brand-950 truncate max-w-[80px] md:max-w-none">{entries[0].userName ?? 'User'}</div>
              <div className="text-[10px] md:text-xs text-slate-500">{entries[0].totalPoints} {t('leaderboard.pts')}</div>
            </div>
            <div className="w-20 md:w-28 h-24 md:h-32 bg-gradient-to-t from-amber-200 to-amber-100 rounded-t-lg mt-2 md:mt-3 flex items-center justify-center">
              <Trophy className="h-7 md:h-10 w-7 md:w-10 text-amber-500" />
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 md:w-16 h-12 md:h-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white text-sm md:text-xl font-bold shadow-sm">
              {entries[2].userName?.charAt(0) ?? 'U'}
            </div>
            <div className="mt-1 md:mt-2 text-center">
              <div className="font-medium text-xs md:text-sm text-brand-950 truncate max-w-[72px] md:max-w-none">{entries[2].userName ?? 'User'}</div>
              <div className="text-[10px] md:text-xs text-slate-500">{entries[2].totalPoints} {t('leaderboard.pts')}</div>
            </div>
            <div className="w-16 md:w-24 h-12 md:h-16 bg-orange-200 rounded-t-lg mt-2 md:mt-3 flex items-center justify-center">
              <Award className="h-5 md:h-8 w-5 md:w-8 text-orange-400" />
            </div>
          </div>
        </div>
      )}

      {/* Full Rankings */}
      <div className="space-y-2">
        {entries?.map((entry: any, i: number) => (
          <div key={entry.id} className={`flex items-center gap-4 p-4 rounded-xl border ${getRankBg(i + 1)} card-hover`}>
            <div className="w-8 flex justify-center">
              {getRankIcon(i + 1)}
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
              {entry.userName?.charAt(0) ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-brand-950 truncate text-sm">{entry.userName ?? 'Anonymous'}</div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {entry.exercisesCompleted}</span>
                <span className="flex items-center gap-1"><Flame className="h-3 w-3" /> {entry.currentStreak}{t('leaderboard.d')}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {entry.studyHours}{t('leaderboard.h')}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-blue-600 flex items-center gap-1 text-sm">
                <Zap className="h-4 w-4 text-amber-500" /> {entry.totalPoints}
              </div>
              <div className="text-xs text-slate-500">{t('leaderboard.points')}</div>
            </div>
          </div>
        ))}
      </div>

      {(!entries || entries.length === 0) && (
        <div className="text-center py-10 md:py-16">
          <Trophy className="h-12 md:h-16 w-12 md:w-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-brand-950 mb-2">{t('leaderboard.noEntries')}</h3>
          <p className="text-slate-500 text-sm">{t('leaderboard.noEntriesDesc')}</p>
        </div>
      )}
    </div>
  )
}
