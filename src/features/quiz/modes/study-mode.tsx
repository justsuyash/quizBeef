import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useAction } from 'wasp/client/operations'
import { getQuizAttempt, submitQuizAnswer, completeQuiz, generateStudentExplanation } from 'wasp/client/operations'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Progress } from '../../../components/ui/progress'
import { Badge } from '../../../components/ui/badge'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { Label } from '../../../components/ui/label'
import { Separator } from '../../../components/ui/separator'
import { toast } from '../../../hooks/use-toast'
import { 
  BookOpen, 
  Lightbulb, 
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Brain,
  Clock,
  Target,
  Sparkles
} from 'lucide-react'

interface QuizAnswer {
  questionId: number
  selectedAnswerId: number | null
  timeSpent: number
  isAnswered: boolean
  isCorrect?: boolean
}

interface StudyModeState {
  currentQuestionIndex: number
  answers: QuizAnswer[]
  startTime: number
  questionStartTime: number
  isCompleted: boolean
  revealed: { [key: number]: boolean } // Track which questions have been revealed
}

export default function StudyModePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const urlParams = new URLSearchParams(location.search)
  const attemptId = urlParams.get('attemptId')
  
  const [state, setState] = useState<StudyModeState>({
    currentQuestionIndex: 0,
    answers: [],
    startTime: Date.now(),
    questionStartTime: Date.now(),
    isCompleted: false,
    revealed: {}
  })

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false)

  // Fetch quiz data
  const { data: quizData, isLoading, error } = useQuery(
    getQuizAttempt,
    { quizAttemptId: parseInt(attemptId || '0') },
    { enabled: !!attemptId }
  )

  const submitAnswerAction = useAction(submitQuizAnswer)
  const completeQuizAction = useAction(completeQuiz)
  const generateExplanationAction = useAction(generateStudentExplanation)

  // Initialize answers array when quiz data loads
  useEffect(() => {
    if (quizData?.questions && state.answers.length === 0) {
      const initialAnswers: QuizAnswer[] = quizData.questions.map(q => ({
        questionId: q.id,
        selectedAnswerId: null,
        timeSpent: 0,
        isAnswered: false
      }))
      setState(prev => ({ ...prev, answers: initialAnswers }))
    }
  }, [quizData, state.answers.length])

  // Update question start time when question changes
  useEffect(() => {
    setState(prev => ({ ...prev, questionStartTime: Date.now() }))
    setSelectedAnswer(null)
    setAiExplanation(null)
  }, [state.currentQuestionIndex])

  // Load previously selected answer when navigating between questions
  useEffect(() => {
    if (state.answers.length > 0) {
      const currentAnswer = state.answers[state.currentQuestionIndex]
      setSelectedAnswer(currentAnswer?.selectedAnswerId || null)
    }
  }, [state.currentQuestionIndex, state.answers])

  const currentQuestion = quizData?.questions?.[state.currentQuestionIndex]
  const totalQuestions = quizData?.questions?.length || 0
  const progress = totalQuestions > 0 ? ((state.currentQuestionIndex + 1) / totalQuestions) * 100 : 0
  const isRevealed = state.revealed[state.currentQuestionIndex] || false

  const handleAnswerSelect = (answerId: number) => {
    setSelectedAnswer(answerId)
  }

  const handleRevealAnswer = async () => {
    if (!currentQuestion || selectedAnswer === null) return

    const timeSpent = Math.round((Date.now() - state.questionStartTime) / 1000)
    const correctAnswer = currentQuestion.answers.find(a => a.isCorrect)
    const selectedAnswerObj = currentQuestion.answers.find(a => a.id === selectedAnswer)
    const isCorrect = selectedAnswer === correctAnswer?.id

    try {
      setIsGeneratingExplanation(true)

      // Submit the answer to the server
      await submitAnswerAction({
        quizAttemptId: parseInt(attemptId || '0'),
        questionId: currentQuestion.id,
        selectedAnswerId: selectedAnswer,
        timeSpent
      })

      // Generate AI explanation
      const explanation = await generateExplanationAction({
        questionText: currentQuestion.questionText,
        correctAnswer: correctAnswer?.answerText || '',
        studentAnswer: selectedAnswerObj?.answerText || '',
        isCorrect,
        questionExplanation: currentQuestion.explanation
      })

      setAiExplanation(explanation)

      // Update local state
      const updatedAnswers = [...state.answers]
      updatedAnswers[state.currentQuestionIndex] = {
        questionId: currentQuestion.id,
        selectedAnswerId: selectedAnswer,
        timeSpent,
        isAnswered: true,
        isCorrect
      }

      setState(prev => ({ 
        ...prev, 
        answers: updatedAnswers,
        revealed: { ...prev.revealed, [state.currentQuestionIndex]: true }
      }))

    } catch (error) {
      console.error('Error submitting answer:', error)
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingExplanation(false)
    }
  }

  const handleNext = () => {
    if (state.currentQuestionIndex < totalQuestions - 1) {
      setState(prev => ({ 
        ...prev, 
        currentQuestionIndex: prev.currentQuestionIndex + 1 
      }))
    } else {
      handleCompleteQuiz()
    }
  }

  const handlePrevious = () => {
    if (state.currentQuestionIndex > 0) {
      setState(prev => ({ 
        ...prev, 
        currentQuestionIndex: prev.currentQuestionIndex - 1 
      }))
    }
  }

  const handleCompleteQuiz = async () => {
    try {
      const totalTimeSpent = Math.round((Date.now() - state.startTime) / 1000)
      const answeredQuestions = state.answers.filter(a => a.isAnswered).length
      const correctAnswers = state.answers.filter(a => a.isCorrect).length
      
      await completeQuizAction({
        quizAttemptId: parseInt(attemptId || '0'),
        totalTimeSpent: totalTimeSpent,
        gameplayStats: {
          studyMode: true,
          questionsAnswered: answeredQuestions,
          totalQuestions: totalQuestions,
          correctAnswers: correctAnswers,
          accuracy: answeredQuestions > 0 ? (correctAnswers / answeredQuestions) * 100 : 0,
          averageTimePerQuestion: answeredQuestions > 0 ? totalTimeSpent / answeredQuestions : 0
        }
      })

      // Navigate to summary page
      navigate(`/quiz/${attemptId}/summary`)

    } catch (error) {
      console.error('Error completing quiz:', error)
      toast({
        title: "Error",
        description: "Failed to complete quiz. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h2 className="text-xl font-semibold">Loading Study Session...</h2>
        </div>
      </div>
    )
  }

  if (error || !quizData || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-destructive">Error Loading Study Session</h2>
          <p className="text-muted-foreground">Unable to load study questions. Please try again.</p>
          <Button onClick={() => navigate('/play')}>Back to Play</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-500" />
            <h1 className="text-2xl font-bold">Study Mode</h1>
          </div>
          <p className="text-muted-foreground">{quizData.document?.title}</p>
          <Badge variant="secondary">
            Question {state.currentQuestionIndex + 1} of {totalQuestions}
          </Badge>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{currentQuestion.questionText}</span>
              {currentQuestion.difficulty && (
                <Badge variant="outline" className="w-fit">
                  {currentQuestion.difficulty}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Answer Options */}
            <div className="space-y-4">
              <RadioGroup 
                value={selectedAnswer?.toString() || ''} 
                onValueChange={(value) => handleAnswerSelect(parseInt(value))}
                disabled={isRevealed}
              >
                {currentQuestion.answers.map((answer) => {
                  const isSelected = selectedAnswer === answer.id
                  const isCorrect = answer.isCorrect
                  
                  return (
                    <div 
                      key={answer.id} 
                      className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
                        isRevealed 
                          ? isCorrect 
                            ? 'bg-green-50 border-green-200' 
                            : isSelected 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-gray-50 border-gray-200'
                          : isSelected 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted/50 border-gray-200'
                      }`}
                    >
                      <RadioGroupItem 
                        value={answer.id.toString()} 
                        id={answer.id.toString()}
                        disabled={isRevealed}
                      />
                      <Label 
                        htmlFor={answer.id.toString()} 
                        className="flex-1 cursor-pointer text-sm leading-relaxed"
                      >
                        {answer.answerText}
                      </Label>
                      {isRevealed && (
                        <div className="flex items-center gap-2">
                          {isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : isSelected ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : null}
                          {isCorrect && <Badge variant="secondary" className="text-xs">Correct</Badge>}
                          {isSelected && !isCorrect && <Badge variant="destructive" className="text-xs">Your Answer</Badge>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </RadioGroup>
            </div>

            {/* Reveal Button */}
            {!isRevealed && (
              <div className="text-center">
                <Button 
                  onClick={handleRevealAnswer}
                  disabled={selectedAnswer === null || isGeneratingExplanation}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isGeneratingExplanation ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Explanation...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Reveal Answer & Explanation
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Explanation Section */}
            {isRevealed && (
              <>
                <Separator />
                <div className="space-y-4">
                  {/* Result */}
                  <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-muted/30">
                    {state.answers[state.currentQuestionIndex]?.isCorrect ? (
                      <>
                        <CheckCircle className="h-6 w-6 text-green-500" />
                        <span className="font-medium text-green-700">Correct! Well done!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-6 w-6 text-red-500" />
                        <span className="font-medium text-red-700">Not quite right. Let's learn!</span>
                      </>
                    )}
                  </div>

                  {/* Explanation */}
                  {currentQuestion.explanation && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium text-blue-800">Explanation:</h4>
                      </div>
                      <p className="text-blue-700 leading-relaxed">{currentQuestion.explanation}</p>
                    </div>
                  )}

                  {/* AI-Generated Learning Tips */}
                  {aiExplanation && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <h4 className="font-medium text-purple-800">AI Tutor:</h4>
                      </div>
                      <p className="text-purple-700 text-sm leading-relaxed">
                        {aiExplanation}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={state.currentQuestionIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="text-center">
            <Badge variant="outline" className="text-sm">
              Study Mode: Learn at your own pace
            </Badge>
          </div>

          {isRevealed && (
            state.currentQuestionIndex === totalQuestions - 1 ? (
              <Button 
                onClick={handleCompleteQuiz}
                className="bg-green-600 hover:bg-green-700"
              >
                <Target className="h-4 w-4 mr-2" />
                Complete Study Session
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next Question
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )
          )}

          {!isRevealed && (
            <Button disabled variant="outline">
              {state.currentQuestionIndex === totalQuestions - 1 ? 'Complete Study Session' : 'Next Question'}
            </Button>
          )}
        </div>

        {/* Study Mode Info */}
        <div className="text-center text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
          <p>📚 <strong>Study Mode:</strong> Take your time to learn! Answer each question, then reveal the explanation.</p>
          <p>Focus on understanding the concepts rather than speed. Every mistake is a learning opportunity!</p>
        </div>
      </div>
    </div>
  )
}
