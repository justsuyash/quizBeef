import { HttpError } from 'wasp/server'
import type { SeedQuizData } from 'wasp/server/operations'

export const seedQuizData: SeedQuizData<void, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  try {
    // Check if we already have a demo document
    const existingDoc = await context.entities.Document.findFirst({
      where: { 
        title: 'Demo Quiz Content',
        userId: context.user.id 
      }
    })

    if (existingDoc) {
      return {
        success: true,
        message: 'Demo data already exists',
        documentId: existingDoc.id
      }
    }

    // Create a demo document
    const demoDocument = await context.entities.Document.create({
      data: {
        title: 'Demo Quiz Content',
        contentJson: {
          sections: [
            {
              title: 'General Knowledge',
              content: 'A collection of general knowledge questions for testing different quiz modes.'
            }
          ]
        },
        sourceType: 'TEXT_INPUT',
        wordCount: 500,
        estimatedReadTime: 5,
        userId: context.user.id
      }
    })

    // Create sample questions
    const sampleQuestions = [
      {
        questionText: 'What is the capital of France?',
        difficulty: 'EASY' as const,
        explanation: 'Paris has been the capital of France since the 12th century.',
        answers: [
          { answerText: 'Paris', isCorrect: true, orderIndex: 0 },
          { answerText: 'London', isCorrect: false, orderIndex: 1 },
          { answerText: 'Berlin', isCorrect: false, orderIndex: 2 },
          { answerText: 'Madrid', isCorrect: false, orderIndex: 3 }
        ]
      },
      {
        questionText: 'Which planet is known as the Red Planet?',
        difficulty: 'EASY' as const,
        explanation: 'Mars appears red due to iron oxide (rust) on its surface.',
        answers: [
          { answerText: 'Venus', isCorrect: false, orderIndex: 0 },
          { answerText: 'Mars', isCorrect: true, orderIndex: 1 },
          { answerText: 'Jupiter', isCorrect: false, orderIndex: 2 },
          { answerText: 'Saturn', isCorrect: false, orderIndex: 3 }
        ]
      },
      {
        questionText: 'What is the largest mammal in the world?',
        difficulty: 'MEDIUM' as const,
        explanation: 'Blue whales can reach lengths of up to 100 feet and weigh up to 200 tons.',
        answers: [
          { answerText: 'African Elephant', isCorrect: false, orderIndex: 0 },
          { answerText: 'Blue Whale', isCorrect: true, orderIndex: 1 },
          { answerText: 'Giraffe', isCorrect: false, orderIndex: 2 },
          { answerText: 'Polar Bear', isCorrect: false, orderIndex: 3 }
        ]
      },
      {
        questionText: 'In which year did World War II end?',
        difficulty: 'MEDIUM' as const,
        explanation: 'World War II ended in 1945 with the surrender of Japan after the atomic bombings.',
        answers: [
          { answerText: '1944', isCorrect: false, orderIndex: 0 },
          { answerText: '1945', isCorrect: true, orderIndex: 1 },
          { answerText: '1946', isCorrect: false, orderIndex: 2 },
          { answerText: '1947', isCorrect: false, orderIndex: 3 }
        ]
      },
      {
        questionText: 'What is the chemical symbol for gold?',
        difficulty: 'MEDIUM' as const,
        explanation: 'Au comes from the Latin word "aurum" meaning gold.',
        answers: [
          { answerText: 'Go', isCorrect: false, orderIndex: 0 },
          { answerText: 'Gd', isCorrect: false, orderIndex: 1 },
          { answerText: 'Au', isCorrect: true, orderIndex: 2 },
          { answerText: 'Ag', isCorrect: false, orderIndex: 3 }
        ]
      },
      {
        questionText: 'Who wrote the novel "1984"?',
        difficulty: 'HARD' as const,
        explanation: 'George Orwell published "1984" in 1949 as a dystopian social science fiction novel.',
        answers: [
          { answerText: 'Aldous Huxley', isCorrect: false, orderIndex: 0 },
          { answerText: 'George Orwell', isCorrect: true, orderIndex: 1 },
          { answerText: 'Ray Bradbury', isCorrect: false, orderIndex: 2 },
          { answerText: 'Philip K. Dick', isCorrect: false, orderIndex: 3 }
        ]
      },
      {
        questionText: 'What is the square root of 144?',
        difficulty: 'EASY' as const,
        explanation: '12 × 12 = 144, so the square root of 144 is 12.',
        answers: [
          { answerText: '10', isCorrect: false, orderIndex: 0 },
          { answerText: '11', isCorrect: false, orderIndex: 1 },
          { answerText: '12', isCorrect: true, orderIndex: 2 },
          { answerText: '13', isCorrect: false, orderIndex: 3 }
        ]
      },
      {
        questionText: 'Which element has the highest melting point?',
        difficulty: 'HARD' as const,
        explanation: 'Tungsten has the highest melting point of all elements at 3,695°C (6,683°F).',
        answers: [
          { answerText: 'Carbon', isCorrect: false, orderIndex: 0 },
          { answerText: 'Tungsten', isCorrect: true, orderIndex: 1 },
          { answerText: 'Iron', isCorrect: false, orderIndex: 2 },
          { answerText: 'Titanium', isCorrect: false, orderIndex: 3 }
        ]
      },
      {
        questionText: 'What is the fastest land animal?',
        difficulty: 'EASY' as const,
        explanation: 'Cheetahs can reach speeds of up to 70 mph (112 km/h).',
        answers: [
          { answerText: 'Lion', isCorrect: false, orderIndex: 0 },
          { answerText: 'Cheetah', isCorrect: true, orderIndex: 1 },
          { answerText: 'Leopard', isCorrect: false, orderIndex: 2 },
          { answerText: 'Tiger', isCorrect: false, orderIndex: 3 }
        ]
      },
      {
        questionText: 'In which year was the first iPhone released?',
        difficulty: 'MEDIUM' as const,
        explanation: 'Apple released the first iPhone on June 29, 2007.',
        answers: [
          { answerText: '2006', isCorrect: false, orderIndex: 0 },
          { answerText: '2007', isCorrect: true, orderIndex: 1 },
          { answerText: '2008', isCorrect: false, orderIndex: 2 },
          { answerText: '2009', isCorrect: false, orderIndex: 3 }
        ]
      },
      {
        questionText: 'What is the smallest prime number?',
        difficulty: 'MEDIUM' as const,
        explanation: '2 is the smallest and only even prime number.',
        answers: [
          { answerText: '1', isCorrect: false, orderIndex: 0 },
          { answerText: '2', isCorrect: true, orderIndex: 1 },
          { answerText: '3', isCorrect: false, orderIndex: 2 },
          { answerText: '5', isCorrect: false, orderIndex: 3 }
        ]
      },
      {
        questionText: 'Which gas makes up about 78% of Earth\'s atmosphere?',
        difficulty: 'MEDIUM' as const,
        explanation: 'Nitrogen makes up about 78% of Earth\'s atmosphere, with oxygen making up about 21%.',
        answers: [
          { answerText: 'Oxygen', isCorrect: false, orderIndex: 0 },
          { answerText: 'Carbon Dioxide', isCorrect: false, orderIndex: 1 },
          { answerText: 'Nitrogen', isCorrect: true, orderIndex: 2 },
          { answerText: 'Argon', isCorrect: false, orderIndex: 3 }
        ]
      }
    ]

    // Create questions and answers
    for (const q of sampleQuestions) {
      const question = await context.entities.Question.create({
        data: {
          questionText: q.questionText,
          difficulty: q.difficulty,
          explanation: q.explanation,
          documentId: demoDocument.id
        }
      })

      for (const answer of q.answers) {
        await context.entities.Answer.create({
          data: {
            ...answer,
            questionId: question.id
          }
        })
      }
    }

    return {
      success: true,
      message: 'Demo data created successfully',
      documentId: demoDocument.id,
      questionCount: sampleQuestions.length
    }

  } catch (error) {
    console.error('Error seeding quiz data:', error)
    throw new HttpError(500, 'Failed to seed quiz data')
  }
}
