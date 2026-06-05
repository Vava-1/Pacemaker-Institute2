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
import { toast } from 'sonner'
import {
  Target, Zap, Flame, Clock, CheckCircle, XCircle,
  ArrowRight, GraduationCap, TrendingUp,
} from 'lucide-react'

export default function Exercises() {
  const { user } = useAuth()
  const utils = trpc.useUtils()
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [fillAnswer, setFillAnswer] = useState('')
  const [result, setResult] = useState<any>(null)
  const [currentExercise, setCurrentExercise] = useState<any>(null)

  const { data: exercises } = trpc.exercise.list.useQuery()
  const { data: stats } = trpc.exercise.stats.useQuery(undefined, { enabled: !!user })
  const submit = trpc.exercise.submit.useMutation({
    onSuccess: (data) => {
      setResult(data)
      utils.exercise.stats.invalidate()
      utils.leaderboard.list.invalidate()
      if (data.isCorrect) {
        toast.success(`+${data.pointsEarned} points!`, { icon: <Zap className="h-4 w-4 text-amber-500" /> })
      } else {
        toast.info('Keep practicing!')
      }
    },
  })

  const handleSubmit = () => {
    if (!currentExercise || !user) return
    const answer = currentExercise.type === 'fill_blank' ? fillAnswer : selectedAnswer
    if (!answer.trim()) {
      toast.error('Please provide an answer')
      return
    }
    submit.mutate({ exerciseId: currentExercise.id, answer, timeSpent: 30 })
  }

  const handleNext = () => {
    setResult(null)
    setSelectedAnswer('')
    setFillAnswer('')
    const available = exercises?.filter((e: any) => e.id !== currentExercise?.id) ?? []
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
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Daily Exercises</h2>
            <p className="text-slate-500 mb-6">Login to access daily exercises, track your progress, and compete on the leaderboard.</p>
            <Link to="/login">
              <Button className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white">Login to Start</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentExercise) {
    const options = (currentExercise.options as any[] | null) ?? []
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Badge className="mb-2">{currentExercise.type === 'multiple_choice' ? 'Multiple Choice' : 'Fill in the Blank'}</Badge>
                <h2 className="text-xl font-bold">{currentExercise.title}</h2>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-amber-600 font-bold">
                  <Zap className="h-4 w-4" /> +{currentExercise.points} pts
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <Flame className="h-3 w-3" /> Keep your streak!
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 mb-6">
              <p className="text-lg font-medium mb-4">{currentExercise.question}</p>

              {currentExercise.type === 'multiple_choice' && (
                <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} disabled={!!result}>
                  <div className="space-y-3">
                    {options.map((opt: any, i: number) => (
                      <div key={i} className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                        result ? opt.isCorrect ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : selectedAnswer === opt.text ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-slate-200'
                          : 'border-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}>
                        <RadioGroupItem value={opt.text} id={`opt-${i}`} />
                        <Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer">{opt.text}</Label>
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
                    placeholder="Type your answer here..."
                    value={fillAnswer}
                    onChange={e => setFillAnswer(e.target.value)}
                    disabled={!!result}
                    className={result ? result.isCorrect ? 'border-emerald-500' : 'border-red-500' : ''}
                  />
                  {result && (
                    <div className={`p-3 rounded-lg ${result.isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700' : 'bg-red-50 dark:bg-red-900/20 text-red-700'}`}>
                      {result.isCorrect ? (
                        <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Correct!</div>
                      ) : (
                        <div className="flex items-center gap-2"><XCircle className="h-4 w-4" /> The correct answer is: <strong>{result.correctAnswer}</strong></div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {result && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Explanation</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">{result.explanation}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              {!result ? (
                <Button onClick={handleSubmit} disabled={submit.isPending} className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white">
                  {submit.isPending ? 'Submitting...' : 'Submit Answer'}
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Daily Exercises</h1>
        <p className="text-slate-500 dark:text-slate-400">Practice daily, earn points, and climb the leaderboard</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
              <div className="text-xs text-slate-500">Completed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.accuracy ?? 0}%</div>
              <div className="text-xs text-slate-500">Accuracy</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.totalPoints ?? 0}</div>
              <div className="text-xs text-slate-500">Points</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <Flame className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{user?.studyStreak ?? 0}</div>
              <div className="text-xs text-slate-500">Day Streak</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exercise Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises?.map((ex: any) => {
          const opts = (ex.options as any[] | null) ?? []
          return (
            <Card key={ex.id} className="hover:shadow-lg transition-all cursor-pointer" onClick={() => startExercise(ex)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline">{ex.difficulty}</Badge>
                  <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> {ex.points} pts
                  </span>
                </div>
                <h3 className="font-semibold mb-2">{ex.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{ex.question}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {opts.length} options</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> ~2 min</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {(!exercises || exercises.length === 0) && (
        <div className="text-center py-16">
          <Target className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No exercises available</h3>
          <p className="text-slate-500">Check back later for new exercises</p>
        </div>
      )}
    </div>
  )
}
