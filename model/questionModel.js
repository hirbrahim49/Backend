import mongoose from "mongoose";

const examSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    unique: true
  },
  subjects: [
    {
      subjectName: {
        type: String,
    required: true,
      },
      actualName: {
        type: String,
    required: true,
      },
      arrayOfQuestions: [
        {
          month: String,
          topicName: String,
          actualQuestion: [
            {
              id: {
                type: Number,
                required: true
              },
              easy: {
                type: String,
                required: true
              },
              type: {
                type: String,
                required: true
              },
              year: {
                type: String,
                required: true
              },
              exambody: {
                type: String,
                required: true
              },
              subtopic: {
                type: String,
                required: true
              },
              content: [
                {
                  type: {
                    type: String, // 'text' or 'image'
                    required: true
                  },
                  value: {
                    type: String, // Text content or image URL
                    required: true
                  }
                }
              ],
              options: [
                {
                  id: {
                    type: Number,
                    required: true
                  },
                  text: {
                    type: String,
                    required: true
                  },
                  isCorrect: {
                    type: Boolean,
                    required: true
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
});

// Create the model
const Exam = mongoose.model('Exam', examSchema);

export default Exam;
