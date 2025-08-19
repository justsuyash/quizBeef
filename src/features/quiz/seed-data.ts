import { HttpError } from 'wasp/server'
import type { SeedQuizData } from 'wasp/server/operations'

export const seedQuizData: SeedQuizData<void, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  try {
    // Check if we already have both documents
    const existingDemoDoc = await context.entities.Document.findFirst({
      where: { 
        title: 'Demo Quiz Content',
        userId: context.user.id 
      }
    })

    const existingPhysicsDoc = await context.entities.Document.findFirst({
      where: { 
        title: 'Middle School Physics Concepts',
        userId: context.user.id 
      }
    })

    if (existingDemoDoc && existingPhysicsDoc) {
      return {
        success: true,
        message: 'Demo data and physics questions already exist',
        documentId: existingDemoDoc.id,
        physicsDocumentId: existingPhysicsDoc.id,
        questionCount: 0,
        physicsQuestionCount: 0
      }
    }

    // Create demo document if it doesn't exist
    const demoDocument = existingDemoDoc || await context.entities.Document.create({
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

    // Create physics document if it doesn't exist
    const physicsDocument = existingPhysicsDoc || await context.entities.Document.create({
      data: {
        title: 'Middle School Physics Concepts',
        contentJson: {
          sections: [
            {
              title: 'Physics Fundamentals',
              content: 'Conceptual physics questions designed for middle school students to understand basic physics principles through explanations and real-world examples.'
            }
          ]
        },
        sourceType: 'TEXT_INPUT',
        wordCount: 800,
        estimatedReadTime: 8,
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

    // Middle school physics questions with detailed explanations
    const physicsQuestions = [
      {
        questionText: 'Why do objects fall to the ground when you drop them?',
        difficulty: 'EASY' as const,
        explanation: 'Objects fall because of gravity, a force that pulls everything toward the center of the Earth. Gravity is what keeps us on the ground and makes things fall down instead of floating away. The bigger an object is, the stronger its gravitational pull, and Earth is much bigger than us!',
        answers: [
          { answerText: 'Because they are heavy', isCorrect: false, orderIndex: 0 },
          { answerText: 'Because of gravity', isCorrect: true, orderIndex: 1 },
          { answerText: 'Because of air pressure', isCorrect: false, orderIndex: 2 },
          { answerText: 'Because they want to fall', isCorrect: false, orderIndex: 3 }
        ]
      },
      {
        questionText: 'What happens to the speed of sound in warmer air compared to cooler air?',
        difficulty: 'MEDIUM' as const,
        explanation: 'Sound travels faster in warmer air because the molecules are moving more quickly and can pass the sound vibrations along faster. Think of it like a relay race - if the runners (molecules) are more energetic, they can pass the baton (sound) more quickly!',
        answers: [
          { answerText: 'Sound travels slower in warmer air', isCorrect: false, orderIndex: 0 },
          { answerText: 'Sound travels faster in warmer air', isCorrect: true, orderIndex: 1 },
          { answerText: 'Temperature does not affect sound speed', isCorrect: false, orderIndex: 2 },
          { answerText: 'Sound cannot travel in warm air', isCorrect: false, orderIndex: 3 }
        ]
      },
      {
        questionText: 'If you push a shopping cart with more force, what happens to its motion?',
        difficulty: 'EASY' as const,
        explanation: 'When you apply more force to an object, it accelerates more - meaning it speeds up faster or moves faster. This is Newton\'s Second Law of Motion: Force = Mass × Acceleration. More force means more acceleration, so the cart will move faster or speed up more quickly.',
        answers: [
          { answerText: 'It moves slower', isCorrect: false, orderIndex: 0 },
          { answerText: 'It moves faster', isCorrect: true, orderIndex: 1 },
          { answerText: 'It stops moving', isCorrect: false, orderIndex: 2 },
          { answerText: 'Nothing changes', isCorrect: false, orderIndex: 3 }
        ]
      },
      {
        questionText: 'Why does a balloon filled with helium float in the air?',
        difficulty: 'MEDIUM' as const,
        explanation: 'A helium balloon floats because helium gas is less dense (lighter) than the air around it. This creates buoyancy - the same force that makes a cork float on water. The denser air pushes up on the less dense helium balloon, making it rise. It\'s like how oil floats on water because oil is less dense.',
        answers: [
          { answerText: 'Helium is magical', isCorrect: false, orderIndex: 0 },
          { answerText: 'Helium is less dense than air', isCorrect: true, orderIndex: 1 },
          { answerText: 'Helium is attracted to the sky', isCorrect: false, orderIndex: 2 },
          { answerText: 'Helium has no weight', isCorrect: false, orderIndex: 3 }
        ]
      },
      {
        questionText: 'What type of energy does a stretched rubber band have?',
        difficulty: 'MEDIUM' as const,
        explanation: 'A stretched rubber band has potential energy, specifically elastic potential energy. When you stretch the rubber band, you\'re storing energy in it by changing its shape. This stored energy can be released when you let go, converting into kinetic energy (motion) as the rubber band snaps back to its original shape.',
        answers: [
          { answerText: 'Kinetic energy', isCorrect: false, orderIndex: 0 },
          { answerText: 'Potential energy', isCorrect: true, orderIndex: 1 },
          { answerText: 'Heat energy', isCorrect: false, orderIndex: 2 },
          { answerText: 'Light energy', isCorrect: false, orderIndex: 3 }
        ]
      },
      {
        questionText: 'Why do you see lightning before you hear thunder during a storm?',
        difficulty: 'MEDIUM' as const,
        explanation: 'You see lightning before hearing thunder because light travels much faster than sound. Light travels at about 300,000 kilometers per second, while sound only travels at about 343 meters per second in air. It\'s like watching someone hammer a nail from far away - you see the hammer hit before you hear the sound!',
        answers: [
          { answerText: 'Lightning is closer than thunder', isCorrect: false, orderIndex: 0 },
          { answerText: 'Light travels faster than sound', isCorrect: true, orderIndex: 1 },
          { answerText: 'Thunder is quieter than lightning', isCorrect: false, orderIndex: 2 },
          { answerText: 'Your eyes work faster than your ears', isCorrect: false, orderIndex: 3 }
        ]
      },
      {
        questionText: 'What happens to the particles in water when it freezes into ice?',
        difficulty: 'HARD' as const,
        explanation: 'When water freezes, the water molecules slow down and arrange themselves into a rigid, organized pattern called a crystal lattice. The molecules get locked into fixed positions and can only vibrate in place, which is why ice is solid. Interestingly, this organized arrangement actually takes up more space than liquid water, which is why ice floats and why water pipes can burst when they freeze.',
        answers: [
          { answerText: 'They disappear', isCorrect: false, orderIndex: 0 },
          { answerText: 'They move faster', isCorrect: false, orderIndex: 1 },
          { answerText: 'They slow down and arrange in a pattern', isCorrect: true, orderIndex: 2 },
          { answerText: 'They turn into different particles', isCorrect: false, orderIndex: 3 }
        ]
      },
      {
        questionText: 'Why does rubbing your hands together make them warm?',
        difficulty: 'EASY' as const,
        explanation: 'Rubbing your hands together creates friction, which converts the kinetic energy (motion) of your hands into heat energy. The molecules in your skin move faster when they rub against each other, and faster-moving molecules mean higher temperature. This is the same reason why car brakes get hot when you stop quickly!',
        answers: [
          { answerText: 'Friction creates heat', isCorrect: true, orderIndex: 0 },
          { answerText: 'Your hands have electricity', isCorrect: false, orderIndex: 1 },
          { answerText: 'Air gets trapped between your hands', isCorrect: false, orderIndex: 2 },
          { answerText: 'Your blood flows faster', isCorrect: false, orderIndex: 3 }
        ]
      },
      {
        questionText: 'What makes a compass needle always point north?',
        difficulty: 'HARD' as const,
        explanation: 'A compass needle points north because it\'s a small magnet that aligns with Earth\'s magnetic field. Earth acts like a giant magnet with magnetic poles near (but not exactly at) the geographic North and South poles. The compass needle\'s north pole is attracted to Earth\'s magnetic south pole, which is located near the geographic North Pole. This invisible magnetic field surrounds our entire planet!',
        answers: [
          { answerText: 'It\'s programmed to point north', isCorrect: false, orderIndex: 0 },
          { answerText: 'Earth\'s magnetic field attracts it', isCorrect: true, orderIndex: 1 },
          { answerText: 'The North Star pulls it', isCorrect: false, orderIndex: 2 },
          { answerText: 'Cold air comes from the north', isCorrect: false, orderIndex: 3 }
        ]
      },
      {
        questionText: 'Why does your voice sound different when you breathe in helium from a balloon?',
        difficulty: 'HARD' as const,
        explanation: 'Your voice sounds higher and squeaky with helium because sound travels faster through helium than through regular air. Your vocal cords still vibrate at the same frequency, but the faster sound speed in helium changes the resonance in your throat and mouth, making the higher-pitched harmonics more prominent. It\'s like how the same musical note sounds different on different instruments due to their different shapes and materials.',
        answers: [
          { answerText: 'Helium makes your vocal cords tighter', isCorrect: false, orderIndex: 0 },
          { answerText: 'Sound travels faster in helium', isCorrect: true, orderIndex: 1 },
          { answerText: 'Helium is poisonous to your throat', isCorrect: false, orderIndex: 2 },
          { answerText: 'Helium makes you breathe differently', isCorrect: false, orderIndex: 3 }
        ]
      }
    ]

    // Create questions and answers for demo document (only if no questions exist)
    const demoQuestionCount = await context.entities.Question.count({
      where: { documentId: demoDocument.id }
    })
    
    let createdDemoQuestions = 0
    if (demoQuestionCount === 0) {
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
        createdDemoQuestions++
      }
    }

    // Create physics questions and answers (only if no questions exist)
    const physicsQuestionCount = await context.entities.Question.count({
      where: { documentId: physicsDocument.id }
    })
    
    let createdPhysicsQuestions = 0
    if (physicsQuestionCount === 0) {
      for (const q of physicsQuestions) {
        const question = await context.entities.Question.create({
          data: {
            questionText: q.questionText,
            difficulty: q.difficulty,
            explanation: q.explanation,
            documentId: physicsDocument.id
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
        createdPhysicsQuestions++
      }
    }

    return {
      success: true,
      message: `Demo data and physics questions processed successfully. Created ${createdDemoQuestions} demo questions and ${createdPhysicsQuestions} physics questions.`,
      documentId: demoDocument.id,
      physicsDocumentId: physicsDocument.id,
      questionCount: createdDemoQuestions,
      physicsQuestionCount: createdPhysicsQuestions
    }

  } catch (error) {
    console.error('Error seeding quiz data:', error)
    throw new HttpError(500, 'Failed to seed quiz data')
  }
}
