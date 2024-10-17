import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  subjectResults: [
    {
      subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
      score: { type: Number, required: true },
      grade: { type: String, required: true }
    }
  ],
  totalScore: { type: Number, required: true },
  grade: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const Result = mongoose.model('Result', resultSchema);

export default Result;


