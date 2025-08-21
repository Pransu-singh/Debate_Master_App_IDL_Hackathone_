import { Module } from '../types';

export const modules: Module[] = [
  {
    id: 'intro-to-debate',
    title: 'Introduction to Debate',
    description: 'Learn the fundamentals of debate structure and basic techniques',
    difficulty: 'beginner',
    xpReward: 100,
    estimatedTime: 15,
    content: {
      sections: [
        {
          id: 'what-is-debate',
          title: 'What is Debate?',
          content: 'Debate is a structured discussion where participants present opposing viewpoints on a topic, using evidence and logical reasoning to support their position.',
          examples: [
            'School uniforms should be mandatory',
            'Social media does more harm than good',
            'Homework should be banned'
          ],
          keyPoints: [
            'Structured format with rules',
            'Evidence-based arguments',
            'Respectful disagreement',
            'Critical thinking skills'
          ]
        },
        {
          id: 'debate-structure',
          title: 'Basic Debate Structure',
          content: 'Most debates follow a specific structure: Opening statements, arguments, rebuttals, and closing statements.',
          examples: [
            'Opening: State your position clearly',
            'Arguments: Present evidence and reasoning',
            'Rebuttals: Address opposing arguments',
            'Closing: Summarize key points'
          ],
          keyPoints: [
            'Clear position statement',
            'Logical flow of ideas',
            'Time management',
            'Strong conclusion'
          ]
        }
      ],
      quiz: {
        questions: [
          {
            id: 'q1',
            question: 'What is the primary purpose of debate?',
            options: [
              'To win at all costs',
              'To present and defend viewpoints using evidence and logic',
              'To prove others wrong',
              'To show off knowledge'
            ],
            correctAnswer: 1,
            explanation: 'Debate is about presenting well-reasoned arguments supported by evidence, not just winning or proving others wrong.'
          },
          {
            id: 'q2',
            question: 'Which comes first in a typical debate structure?',
            options: [
              'Rebuttals',
              'Closing statements',
              'Opening statements',
              'Cross-examination'
            ],
            correctAnswer: 2,
            explanation: 'Opening statements come first to establish each side\'s position and preview their main arguments.'
          }
        ]
      }
    }
  },
  {
    id: 'logical-fallacies',
    title: 'Logical Fallacies',
    description: 'Identify and avoid common logical fallacies in arguments',
    difficulty: 'intermediate',
    xpReward: 150,
    estimatedTime: 20,
    prerequisite: 'intro-to-debate',
    content: {
      sections: [
        {
          id: 'what-are-fallacies',
          title: 'What are Logical Fallacies?',
          content: 'Logical fallacies are errors in reasoning that undermine the logic of an argument. They can be intentional or unintentional.',
          examples: [
            'Ad hominem: Attacking the person instead of their argument',
            'Straw man: Misrepresenting someone\'s argument',
            'False dilemma: Presenting only two options when more exist'
          ],
          keyPoints: [
            'Weaken argument credibility',
            'Can be subtle or obvious',
            'Important to recognize and avoid',
            'Help evaluate argument quality'
          ]
        }
      ],
      quiz: {
        questions: [
          {
            id: 'fallacy1',
            question: 'Which statement contains an ad hominem fallacy?',
            options: [
              'Your argument is flawed because you provided no evidence',
              'You can\'t trust John\'s opinion on climate change because he\'s not a scientist',
              'Your statistics are outdated and therefore unreliable',
              'That conclusion doesn\'t follow from your premises'
            ],
            correctAnswer: 1,
            explanation: 'This attacks John\'s credentials rather than addressing the actual argument about climate change.',
            fallacyType: 'ad hominem'
          }
        ]
      }
    }
  },
  {
    id: 'advanced-techniques',
    title: 'Advanced Debate Techniques',
    description: 'Master sophisticated argumentation and rebuttal strategies',
    difficulty: 'advanced',
    xpReward: 200,
    estimatedTime: 30,
    prerequisite: 'logical-fallacies',
    content: {
      sections: [
        {
          id: 'strategic-thinking',
          title: 'Strategic Argumentation',
          content: 'Learn how to prioritize arguments, anticipate counterarguments, and build compelling cases.',
          examples: [
            'Hierarchy of arguments: strongest points first',
            'Preemptive rebuttals: address counterarguments early',
            'Evidence layering: multiple sources supporting one claim'
          ],
          keyPoints: [
            'Argument prioritization',
            'Strategic timing',
            'Evidence quality over quantity',
            'Anticipatory responses'
          ]
        }
      ],
      quiz: {
        questions: [
          {
            id: 'advanced1',
            question: 'What is the most effective way to structure your strongest arguments?',
            options: [
              'Save the best for last',
              'Present them first to establish credibility',
              'Scatter them throughout your speech',
              'Only use them in rebuttals'
            ],
            correctAnswer: 1,
            explanation: 'Leading with strong arguments establishes credibility and creates a solid foundation for your position.'
          }
        ]
      }
    }
  }
];