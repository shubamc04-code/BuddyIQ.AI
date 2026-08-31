import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from "../services/openRouter.services.js";
import User from "../models/user.model.js";
import Interview from "../models/interview.model.js";


// ======================================================
// ANALYZE RESUME
// ======================================================

export const analyzeResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Resume required"
            });
        }

        const filepath = req.file.path;

        const fileBuffer = await fs.promises.readFile(filepath);
        const uint8Array = new Uint8Array(fileBuffer);

        const pdf = await pdfjsLib.getDocument({
            data: uint8Array
        }).promise;

        let resumeText = "";

        // Extract text from all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();

            const pageText = content.items
                .map(item => item.str)
                .join(" ");

            resumeText += pageText + "\n";
        }

        resumeText = resumeText
            .replace(/\s+/g, " ")
            .trim();

        const messages = [
            {
                role: "system",
                content: `
Extract structured data from resume.

Return ONLY valid JSON.
Do NOT use markdown.
Do NOT use \`\`\`json.
Do NOT add any explanation.

Return exactly this format:

{
    "role": "string",
    "experience": "string",
    "projects": ["project1", "project2"],
    "skills": ["skill1", "skill2"]
}
`
            },
            {
                role: "user",
                content: resumeText
            }
        ];

        const aiResponse = await askAi(messages);

        //console.log("AI RESPONSE:", aiResponse);

        const cleanResponse = aiResponse
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        const parsed = JSON.parse(cleanResponse);

        fs.unlinkSync(filepath);

        return res.json({
            role: parsed.role,
            experience: parsed.experience,
            projects: parsed.projects,
            skills: parsed.skills,
            resumeText
        });

    } catch (error) {
        console.error("Resume Analysis Error:", error);

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        return res.status(500).json({
            message: error.message
        });
    }
};


// ======================================================
// GENERATE INTERVIEW QUESTIONS
// ======================================================

export const generateQuestion = async (req, res) => {

    try {

        let {
            role,
            experience,
            mode,
            resumeText,
            projects,
            skills
        } = req.body;

        // Remove extra spaces
        role = role?.trim();
        experience = experience?.trim();
        mode = mode?.trim();

        // Validate required fields
        if (!role || !experience || !mode) {
            return res.status(400).json({
                message: "Role, Experience and Mode are required."
            });
        }

        // Validate mode
        if (!["HR", "Technical"].includes(mode)) {
            return res.status(400).json({
                message: "Invalid interview mode."
            });
        }

        // Find user
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        // Check credits
        if (user.credits < 25) {
            return res.status(400).json({
                message: "Not enough credits, minimum 25 required."
            });
        }

        // Projects
        const projectText =
            Array.isArray(projects) && projects.length
                ? projects.join(", ")
                : "None";

        // Skills
        const skillsText =
            Array.isArray(skills) && skills.length
                ? skills.join(", ")
                : "None";

        // Resume
        const safeResume =
            resumeText?.trim() || "None";


        // ==================================================
        // AI PROMPT
        // ==================================================

        const userPrompt = `
Role: ${role}
Experience: ${experience}
InterviewMode: ${mode}
Projects: ${projectText}
Skills: ${skillsText}
Resume: ${safeResume}
`;

        const messages = [
            {
                role: "system",
                content: `
You are a real human interviewer conducting a professional interview.

Speak in simple, natural English as if you are directly talking to the candidate.

Generate exactly 10 interview questions.

Strict Rules:

- Each question must contain between 15 and 25 words.
- Each question must be a single complete sentence.
- Do NOT number them.
- Do NOT add explanations.
- Do NOT add extra text before or after.
- One question per line only.
- Keep language simple and conversational.
- Questions must feel practical and realistic.

Difficulty progression:

Question 1 → easy
Question 2 → easy
Question 3 → medium
Question 4 → medium
Question 5 → medium
Question 6 → medium
Question 7 → hard
Question 8 → hard
Question 9 → hard
Question 10 → easy

Make questions based on the candidate's role, experience,
interview mode, projects, skills, and resume details.
`
            },
            {
                role: "user",
                content: userPrompt
            }
        ];


        // ==================================================
        // ASK AI
        // ==================================================

        const aiResponse = await askAi(messages);

        if (!aiResponse || !aiResponse.trim()) {
            return res.status(500).json({
                message: "AI returned empty response."
            });
        }


        // ==================================================
        // CONVERT AI RESPONSE INTO ARRAY
        // ==================================================

        const questionsArray = aiResponse
            .split("\n")
            .map(q => q.trim())
            .filter(q => q.length > 0)
            .slice(0, 10);


        if (questionsArray.length === 0) {
            return res.status(500).json({
                message: "AI failed to generate questions."
            });
        }


        // ==================================================
        // DEDUCT CREDITS
        // ==================================================

        user.credits -= 25;

        await user.save();


        // ==================================================
        // CREATE INTERVIEW
        // ==================================================

        const interview = await Interview.create({

            userId: user._id,

            role,

            experience,

            mode,

            resumeText: safeResume,

            questions: questionsArray.map((q, index) => ({

                question: q,

                difficulty: [
                    "easy",
                    "easy",
                    "medium",
                    "medium",
                    "medium",
                    "medium",
                    "hard",
                    "hard",
                    "hard",
                    "easy"
                ][index],

                timeLimit: [
                    60,
                    60,
                    70,
                    70,
                    70,
                    70,
                    90,
                    90,
                    90,
                    60
                ][index]

            }))
        });


        // ==================================================
        // RESPONSE
        // ==================================================

        return res.status(200).json({

            interviewId: interview._id,

            creditsLeft: user.credits,

            userName: user.name,

            questions: interview.questions

        });

    } catch (error) {

        console.error("Generate Question Error:", error);

        return res.status(500).json({
            message: `Failed to create interview: ${error.message}`
        });
    }
};


// ======================================================
// SUBMIT ANSWER
// ======================================================

export const submitAnswer = async (req, res) => {

    try {

        const {
            interviewId,
            questionIndex,
            answer,
            timeTaken
        } = req.body;


        const interview = await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({
                message: "Interview not found."
            });
        }


        const question =
            interview.questions[questionIndex];


        if (!question) {
            return res.status(404).json({
                message: "Question not found."
            });
        }


        // ==================================================
        // NO ANSWER
        // ==================================================

        if (!answer) {

            question.score = 0;

            question.feedback =
                "You did not submit an answer";

            question.answer = "";

            await interview.save();

            return res.status(200).json({
                feedback: question.feedback
            });
        }


        // ==================================================
        // TIME EXCEEDED
        // ==================================================

        if (timeTaken > question.timeLimit) {

            question.score = 0;

            question.feedback =
                "Time limit exceeded. Answer not evaluated.";

            question.answer = answer;

            await interview.save();

            return res.status(200).json({
                feedback: question.feedback
            });
        }


        // ==================================================
        // AI EVALUATION
        // ==================================================

        const messages = [

            {
                role: "system",

                content: `
You are a professional human interviewer evaluating a candidate's answer in a real interview.

Evaluate naturally and fairly.

Score the answer in these areas from 0 to 10:

1. Confidence
2. Communication
3. Correctness

Rules:

- Be realistic and unbiased.
- Do not give random high scores.
- If the answer is weak, score low.
- If the answer is strong and detailed, score high.
- Consider clarity, structure, and relevance.

Calculate:

finalScore = average of confidence, communication, and correctness,
rounded to the nearest whole number.

Feedback Rules:

- Write natural human feedback.
- 10 to 15 words only.
- Sound like real interview feedback.
- Can suggest improvement if needed.
- Do NOT repeat the question.
- Do NOT explain scoring.
- Keep tone professional and honest.

Return ONLY valid JSON:

{
    "confidence": number,
    "communication": number,
    "correctness": number,
    "finalScore": number,
    "feedback": "short human feedback"
}
`
            },

            {
                role: "user",

                content: `
Question: ${question.question}

Answer: ${answer}
`
            }

        ];


        const aiResponse = await askAi(messages);


        const cleanResponse = aiResponse
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();


        const parsed = JSON.parse(cleanResponse);


        // ==================================================
        // SAVE ANSWER
        // ==================================================

        question.answer = answer;

        question.confidence = parsed.confidence;

        question.communication =
            parsed.communication;

        question.correctness =
            parsed.correctness;

        question.score =
            parsed.finalScore;

        question.feedback =
            parsed.feedback;


        await interview.save();


        return res.status(200).json({
            feedback: parsed.feedback
        });

    } catch (error) {

        console.error("Submit Answer Error:", error);

        return res.status(500).json({
            message: `Failed to submit answer: ${error.message}`
        });
    }
};


// ======================================================
// FINISH INTERVIEW
// ======================================================

export const finishInterview = async (req, res) => {

    try {

        const { interviewId } = req.body;


        const interview =
            await Interview.findById(interviewId);


        if (!interview) {

            return res.status(404).json({
                message: "Failed to find interview."
            });
        }


        // ==================================================
        // TOTAL QUESTIONS
        // ==================================================

        const totalQuestions =
            interview.questions.length;


        let totalScore = 0;

        let totalConfidence = 0;

        let totalCommunication = 0;

        let totalCorrectness = 0;


        // ==================================================
        // CALCULATE TOTALS
        // ==================================================

        interview.questions.forEach((q) => {

            totalScore += q.score || 0;

            totalConfidence +=
                q.confidence || 0;

            totalCommunication +=
                q.communication || 0;

            totalCorrectness +=
                q.correctness || 0;

        });


        // ==================================================
        // AVERAGES
        // ==================================================

        const finalScore =
            totalQuestions
                ? totalScore / totalQuestions
                : 0;


        const avgConfidence =
            totalQuestions
                ? totalConfidence / totalQuestions
                : 0;


        const avgCommunication =
            totalQuestions
                ? totalCommunication / totalQuestions
                : 0;


        const avgCorrectness =
            totalQuestions
                ? totalCorrectness / totalQuestions
                : 0;


        // ==================================================
        // SAVE RESULT
        // ==================================================

        interview.finalScore = finalScore;

        interview.status = "completed";


        await interview.save();


        // ==================================================
        // RESPONSE
        // ==================================================

        return res.status(200).json({

            finalScore:
                Number(finalScore.toFixed(1)),

            confidence:
                Number(avgConfidence.toFixed(1)),

            communication:
                Number(avgCommunication.toFixed(1)),

            correctness:
                Number(avgCorrectness.toFixed(1)),

            questionWiseScore:
                interview.questions.map((q) => ({

                    question: q.question,

                    score: q.score || 0,

                    feedback: q.feedback || "",

                    confidence: q.confidence || 0,

                    communication:
                        q.communication || 0,

                    correctness:
                        q.correctness || 0

                }))

        });

    } catch (error) {

        console.error("Finish Interview Error:", error);

        return res.status(500).json({
            message: `Failed to finish interview: ${error.message}`
        });
    }
};


export const getMyInterviews = async (req, res )=>{
    try {
        const interviews = await Interview.find({userId:req.userId})
        .sort({createdAt:  -1})
        .select('role experience mode finalSocre status createdAt');
        return res.status(200).json(interviews)
    } catch (error) {
        return res.status(500).json({message:`failed to find currentUser Interview ${error}`})
    }
}

export const getInterviewReport = async (req,res)=>{
    try {
        const interview = await Interview.findById(req.param.Id)
        if(!interview){
            return res.status(404).json({message:"Interview not found"})
        }
           

           const totalQuestions =
            interview.questions.length;

        let totalConfidence = 0;

        let totalCommunication = 0;

        let totalCorrectness = 0;


        // ==================================================
        // CALCULATE TOTALS
        // ==================================================

        interview.questions.forEach((q) => {

          

            totalConfidence +=
                q.confidence || 0;

            totalCommunication +=
                q.communication || 0;

            totalCorrectness +=
                q.correctness || 0;

        });


        // ==================================================
        // AVERAGES
        // ==================================================

       


        const avgConfidence =
            totalQuestions
                ? totalConfidence / totalQuestions
                : 0;


        const avgCommunication =
            totalQuestions
                ? totalCommunication / totalQuestions
                : 0;


        const avgCorrectness =
            totalQuestions
                ? totalCorrectness / totalQuestions
                : 0;

                  return res.status(200).json({
                    finalScore : interview.finalScore,
                    confidence:Number(avgConfidence.toFixed(1)),
                    communication: Number(avgCommunication.toFixed(1)),
                    correctness: Number(avgCorrectness.toFixed(1)),
                    questionWiseScore:interview.questions
                  });

    } catch (error) {
        return res.status(500).json({message:`failed to find currentUser Interview Report ${error}`})
    }
}
