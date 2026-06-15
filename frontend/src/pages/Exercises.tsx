import { useState } from 'react'
import { Link } from 'react-router'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Target, Zap, Flame, Clock, CheckCircle, XCircle,
  ArrowRight, GraduationCap, TrendingUp, Sparkles, Trophy,
} from 'lucide-react'
import { BackButton } from '@/components/BackButton'

export default function Exercises() {
  const { user } = useAuth()
  const utils = trpc.useUtils()
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [fillAnswer, setFillAnswer] = useState('')
  const [openAnswer, setOpenAnswer] = useState('')
  const [result, setResult] = useState<any>(null)
  const [currentExercise, setCurrentExercise] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today')

  const { data: exercises } = trpc.exercise.list.useQuery()
  const { data: stats } = trpc.exercise.stats.useQuery(undefined, { enabled: !!user })
  const { data: aiExercises, isLoading: aiLoading } = trpc.exercise.getPersonalizedDaily.useQuery(undefined, { enabled: !!user })
  const { data: history } = trpc.exercise.history.useQuery({ days: 7 }, { enabled: !!user })

  const submit = trpc.exercise.submit.useMutation({
    onSuccess: (data) => {
      setResult(data)
      utils.exercise.stats.invalidate()
      utils.exercise.getPersonalizedDaily.invalidate()
      utils.exercise.history.invalidate()
      utils.leaderboard.list.invalidate()
      utils.leaderboard.getUserRank.invalidate()
      utils.dashboard.stats.invalidate()

      if (data.alreadyAttempted) {
        toast.info('You already completed this exercise!')
        return
      }

      if (data.isCorrect) {
        toast.success(`+${data.pointsEarned} points!`, { icon: <Zap className="h-4 w-4 text-amber-500" /> })
        if (data.userStats?.streak && data.userStats.streak > 1) {
          toast.success(`🔥 ${data.userStats.streak}-day streak!`, { duration: 3000 })
        }
      } else {
        toast.info('Keep practicing! Review the explanation below.')
      }
    },
  })

  const handleSubmit = () => {
    if (!currentExercise || !user) return
    let answer = ''
    if (currentExercise.type === 'multiple_choice' || currentExercise.type === 'true_false') answer = selectedAnswer
    else if (currentExercise.type === 'fill_blank') answer = fillAnswer
    else answer = openAnswer

    if (!answer.trim()) {
      toast.error('Please provide an answer before submitting.')
      return
    }
    submit.mutate({ exerciseId: currentExercise.id, answer, timeSpent: 30 })
  }

  const handleNext = () => {
    setResult(null)
    setSelectedAnswer('')
    setFillAnswer('')
    setOpenAnswer('')
    const available = allExercises.filter((e: any) => e.id !== currentExercise?.id)
    if (available.length > 0) {
      setCurrentExercise(available[Math.floor(Math.random() * available.length)])
    } else {
      setCurrentExercise(null)
    }
  }

  const startExercise = (exercise: any) => {
    setCurrentExercise(exercise)
    setResult(null)
    setSelectedAnswer('')
    setFillAnswer('')
    setOpenAnswer('')
  }

  const allExercises = [...(aiExercises ?? []), ...(exercises ?? [])]

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="absolute top-20 left-4"><BackButton /></div>
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Daily Practice</h2>
            <p className="text-slate-500 mb-6">Login to access your personalized daily exercises.</p>
            <Link to="/login">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Login to Start</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentExercise) {
    const options = (currentExercise.options as any[] | null) ?? []
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <BackButton />
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start justify-between mb-4 md:mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="text-xs capitalize">{currentExercise.type.replace(/_/g, ' ')}</Badge>
                  {currentExercise.aiGenerated && (
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                      <Sparkles className="h-3 w-3 mr-1" /> AI
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs capitalize">{currentExercise.difficulty}</Badge>
                </div>
                <h2 className="text-base md:text-xl font-bold">{currentExercise.title}</h2>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-amber-600 font-bold text-sm md:text-base">
                  <Zap className="h-3 md:h-4 w-3 md:w-4" /> +{currentExercise.points} pts
                </div>
                {currentExercise.timeLimitMinutes && (
                  <div className="text-xs text-slate-500 mt-1">
                    <Clock className="h-3 w-3 inline mr-1" />{currentExercise.timeLimitMinutes} min
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 md:p-6 mb-4 md:mb-6">
              <p className="text-sm md:text-lg font-medium mb-4">{currentExercise.question}</p>

              {(currentExercise.type === 'multiple_choice' || currentExercise.type === 'true_false') && (
                <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} disabled={!!result}>
                  <div className="space-y-3">
                    {options.map((opt: any, i: number) => (
                      <div key={i} className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                        result
                          ? opt.isCorrect
                            ? 'border-emerald-500 bg-emerald-50'
                            : selectedAnswer === opt.text
                              ? 'border-red-500 bg-red-50'
                              : 'border-slate-200'
                          : 'border-slate-200 hover:bg-slate-100'
                      }`}>
                        <RadioGroupItem value={opt.text} id={`opt-${i}`} />
                        <Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer text-sm">{opt.text}</Label>
                        {result && opt.isCorrect && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                        {result && selectedAnswer === opt.text && !opt.isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {currentExercise.type === 'fill_blank' && (
                <div className="space-y-4">
                  <Input
                    placeholder="Type your answer..."
                    value={fillAnswer}
                    onChange={(e) => setFillAnswer(e.target.value)}
                    disabled={!!result}
                    className={result ? result.isCorrect ? 'border-emerald-500' : 'border-red-500' : ''}
                  />
                </div>
              )}

              {(currentExercise.type === 'open_ended' || currentExercise.type === 'code_challenge') && (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Type your detailed answer..."
                    value={openAnswer}
                    onChange={(e) => setOpenAnswer(e.target.value)}
                    disabled={!!result}
                    rows={5}
                    className={result ? 'border-emerald-500' : ''}
                  />
                </div>
              )}

              {result && !result.alreadyAttempted && result.aiEvaluation && result.aiEvaluation.feedback && (
                <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    {result.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-semibold text-sm">{result.isCorrect ? 'Correct!' : 'Incorrect'}</span>
                    <Badge className={`ml-auto text-xs ${result.isCorrect ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                      {result.pointsEarned}/{currentExercise.points} pts
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-700">{result.aiEvaluation.feedback}</p>
                  {result.aiEvaluation.strengths?.length > 0 && (
                    <div className="mt-3">
                      <span className="text-xs font-semibold text-emerald-700">Strengths:</span>
                      <ul className="list-disc list-inside text-xs text-slate-600 mt-1">
                        {result.aiEvaluation.strengths.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.aiEvaluation.improvements?.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-semibold text-amber-700">To Improve:</span>
                      <ul className="list-disc list-inside text-xs text-slate-600 mt-1">
                        {result.aiEvaluation.improvements.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {result && result.explanation && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-800 mb-1 text-sm">Explanation</h4>
                <p className="text-sm text-blue-700">{result.explanation}</p>
              </div>
            )}

            {result && result.userStats && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center p-2 rounded-lg bg-amber-50">
                  <div className="text-lg font-bold text-amber-600">{result.userStats.totalPoints}</div>
                  <div className="text-xs text-slate-500">Total Points</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-emerald-50">
                  <div className="text-lg font-bold text-emerald-600">{result.userStats.accuracy}%</div>
                  <div className="text-xs text-slate-500">Accuracy</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-red-50">
                  <div className="text-lg font-bold text-red-600">{result.userStats.streak}d</div>
                  <div className="text-xs text-slate-500">Streak</div>
                </div>
              </div>
            )}

            {result && result.alreadyAttempted && (
              <div className="bg-slate-50 rounded-lg p-4 mb-6 text-center">
                <p className="text-slate-500 text-sm">You've already completed this exercise.</p>
                <p className="text-xs text-slate-400 mt-1">Score: {result.pointsEarned}/{currentExercise.points} pts</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              {!result ? (
                <Button onClick={handleSubmit} disabled={submit.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {submit.isPending ? 'Grading...' : 'Submit Answer'}
                </Button>
              ) : (
                <Button onClick={handleNext} variant="outline">
                  Next Exercise <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const doneCount = aiExercises?.filter((e: any) => e.done).length ?? 0
  const totalCount = aiExercises?.length ?? 0

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <BackButton />
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-950 mb-2">Daily Practice</h1>
        <p className="text-sm md:text-base text-slate-500">Sharpen your skills with AI-powered daily exercises</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
            <div className="w-8 md:w-10 h-8 md:h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Target className="h-4 md:h-5 w-4 md:w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-base md:text-2xl font-bold">{stats?.total ?? 0}</div>
              <div className="text-[10px] md:text-xs text-slate-500">Completed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
            <div className="w-8 md:w-10 h-8 md:h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 md:h-5 w-4 md:w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-base md:text-2xl font-bold">{stats?.accuracy ?? 0}%</div>
              <div className="text-[10px] md:text-xs text-slate-500">Accuracy</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
            <div className="w-8 md:w-10 h-8 md:h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Zap className="h-4 md:h-5 w-4 md:w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-base md:text-2xl font-bold">{stats?.totalPoints ?? 0}</div>
              <div className="text-[10px] md:text-xs text-slate-500">Points</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
            <div className="w-8 md:w-10 h-8 md:h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <Flame className="h-4 md:h-5 w-4 md:w-5 text-red-600" />
            </div>
            <div>
              <div className="text-base md:text-2xl font-bold">{stats?.streak ?? 0}</div>
              <div className="text-[10px] md:text-xs text-slate-500">Streak</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
            <div className="w-8 md:w-10 h-8 md:h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Trophy className="h-4 md:h-5 w-4 md:w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-base md:text-2xl font-bold">{stats?.rankTier ?? 'Bronze'}</div>
              <div className="text-[10px] md:text-xs text-slate-500">Rank Tier</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Generation Status & Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-slate-100/80">
            <TabsTrigger value="today" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-xs">
              Today's Exercises {totalCount > 0 && `(${doneCount}/${totalCount})`}
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-xs">
              All Exercises
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            {aiLoading ? (
              <span className="text-xs text-slate-400 animate-pulse">Generating AI exercises...</span>
            ) : totalCount > 0 ? (
              <span className="text-xs text-emerald-600 font-medium">{totalCount} AI exercises ready</span>
            ) : null}
          </div>
        </div>

        {activeTab === 'today' ? (
          <div>
            {aiExercises && aiExercises.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiExercises.map((ex: any) => {
                  const opts = (ex.options as any[] | null) ?? []
                  return (
                    <Card key={ex.id} className={`hover:shadow-lg transition-all cursor-pointer border-purple-200/80 ring-1 ring-purple-200/50 ${ex.done ? 'opacity-75' : ''}`} onClick={() => startExercise(ex)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                            <Sparkles className="h-3 w-3 mr-1" /> AI
                          </Badge>
                          <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
                            <Zap className="h-3 w-3" /> {ex.points} pts
                          </span>
                        </div>
                        <h3 className="font-semibold mb-2 text-sm">{ex.title}</h3>
                        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{ex.question}</p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {opts.length > 0 ? `${opts.length} options` : 'open'}</span>
                          {ex.done ? (
                            <Badge className="bg-emerald-500 text-white text-xs border-0">Completed</Badge>
                          ) : (
                            <span className="text-blue-600 font-medium">Start →</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : !aiLoading ? (
              <Card className="border-purple-100 bg-purple-50/30">
                <CardContent className="p-8 text-center">
                  <Sparkles className="h-10 w-10 text-purple-300 mx-auto mb-3" />
                  <h3 className="font-semibold text-brand-950 mb-2">No Exercises Yet</h3>
                  <p className="text-sm text-slate-500 mb-4">Enroll in courses to get AI-generated daily exercises tailored to your learning.</p>
                  <Link to="/courses">
                    <Button size="sm" className="btn-primary">Browse Courses</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : null}
          </div>
        ) : (
          <div>
            {/* Recent History */}
            {history && history.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-brand-950 mb-3">Recent Activity (7 days)</h3>
                <div className="space-y-2">
                  {history.slice(0, 5).map((h: any) => (
                    <div key={h.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                      {h.isCorrect ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{h.exerciseTitle}</div>
                        <div className="text-xs text-slate-500">
                          {h.aiCorrectnessPercent != null ? `${h.aiCorrectnessPercent}%` : h.isCorrect ? '100%' : '0%'} · {new Date(h.attemptedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-amber-600">+{h.pointsEarned}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Exercises Grid */}
            <h3 className="text-sm font-semibold text-brand-950 mb-3">All Available Exercises</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {exercises?.map((ex: any) => {
                const opts = (ex.options as any[] | null) ?? []
                return (
                  <Card key={ex.id} className="hover:shadow-lg transition-all cursor-pointer" onClick={() => startExercise(ex)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-xs capitalize">{ex.difficulty}</Badge>
                        <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
                          <Zap className="h-3 w-3" /> {ex.points} pts
                        </span>
                      </div>
                      <h3 className="font-semibold mb-2 text-sm">{ex.title}</h3>
                      <p className="text-sm text-slate-500 mb-3 line-clamp-2">{ex.question}</p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {opts.length} options</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> est. 2min</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {(!exercises || exercises.length === 0) && (
              <div className="text-center py-10 md:py-16">
                <Target className="h-12 md:h-16 w-12 md:w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No exercises available</h3>
                <p className="text-slate-500 text-sm">Check back later for new exercises.</p>
              </div>
            )}
          </div>
        )}
      </Tabs>
    </div>
  )
}
