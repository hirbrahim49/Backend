import fs from "fs"
import mongoose from "mongoose"
import { config } from "dotenv"
config({ path: './utilites/.env' });
import Exam from "../../model/questionModel.js"
import app from "../../app.js"

const DB = process.env.DATABASE;
console.log('Database URL:', DB);
// Connect to the database
mongoose.connect(DB, {
}).then(() => {
  console.log('DB is successfully connected');
}).catch((err) => {
  console.error('Error connecting to DB:', err);
});
// Start the server


const questions= JSON.parse(fs.readFileSync("./school/dev-data/question.json","utf-8"));
const importSchoolData= async () => {
    try {
        await Exam.create(questions)
        console.log("schoolData is sucessfully loaded into mongoDB database")
        process.exit()
    } catch (error) {
       console.log(error) 
    }
}
const deleteSchoolData =async () => {
    try {
        await Exam.deleteMany()
        console.log("schoolData is sucessfully deleted into mongoDB database")
        process.exit()
    } catch (error) {
       console.log(error) 
    }
}
if(process.argv[2] === "--import"){
  importSchoolData();

}
else if (process.argv[2] === "--delete"){
  deleteSchoolData();
}



console.log(process.argv)