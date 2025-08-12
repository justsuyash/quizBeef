/**
 * Recent Quiz Attempts Component
 * Shows user's recent quiz sessions and performance
 */

import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'

export function RecentQuizzes() {
  const recentQuizzes = [
    {
      id: 1,
      document: "Machine Learning Basics",
      score: 95,
      questionsAnswered: 20,
      timeAgo: "2 hours ago",
      mode: "Practice",
      avatar: "/avatars/01.png"
    },
    {
      id: 2,
      document: "React Hooks Deep Dive",
      score: 87,
      questionsAnswered: 15,
      timeAgo: "Yesterday",
      mode: "New Questions",
      avatar: "/avatars/02.png"
    },
    {
      id: 3,
      document: "Database Design Principles",
      score: 78,
      questionsAnswered: 25,
      timeAgo: "2 days ago",
      mode: "Beef Challenge",
      avatar: "/avatars/03.png"
    },
    {
      id: 4,
      document: "JavaScript ES6 Features",
      score: 92,
      questionsAnswered: 18,
      timeAgo: "3 days ago",
      mode: "Speed Round",
      avatar: "/avatars/04.png"
    },
    {
      id: 5,
      document: "Python Data Science",
      score: 84,
      questionsAnswered: 22,
      timeAgo: "1 week ago",
      mode: "Practice",
      avatar: "/avatars/05.png"
    }
  ]

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "Beef Challenge": return "text-red-600 font-semibold"
      case "Speed Round": return "text-orange-600 font-semibold"
      case "New Questions": return "text-blue-600 font-semibold"
      default: return "text-green-600"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 font-bold"
    if (score >= 80) return "text-blue-600 font-semibold"
    if (score >= 70) return "text-orange-600"
    return "text-red-600"
  }

  return (
    <div className='space-y-8'>
      {recentQuizzes.map((quiz) => (
        <div key={quiz.id} className='flex items-center'>
          <Avatar className='h-9 w-9'>
            <AvatarImage src={quiz.avatar} alt={`Quiz ${quiz.id}`} />
            <AvatarFallback>Q{quiz.id}</AvatarFallback>
          </Avatar>
          <div className='ml-4 space-y-1'>
            <p className='text-sm font-medium leading-none'>{quiz.document}</p>
            <p className='text-xs text-muted-foreground'>
              {quiz.questionsAnswered} questions • {quiz.timeAgo}
            </p>
            <p className={`text-xs ${getModeColor(quiz.mode)}`}>
              {quiz.mode}
            </p>
          </div>
          <div className='ml-auto font-medium'>
            <div className={`text-right ${getScoreColor(quiz.score)}`}>
              {quiz.score}%
            </div>
            <p className='text-xs text-muted-foreground text-right'>
              Score
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
