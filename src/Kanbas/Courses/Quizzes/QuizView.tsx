import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaPencil } from "react-icons/fa6";
import { PiWarningCircleBold } from "react-icons/pi";
import * as quizClient from "./client";
import { setResponses } from "./responseReducer";
import * as userClient from "../../Account/client";

export default function QuizView() {
  const { cid, qid } = useParams();
  const { currentUser } = useSelector((state: any) => state.accountReducer);
  const location = useLocation();
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const { quizzes } = useSelector((state: any) => state.quizReducer);
  const quizFromRedux = quizzes.find((quiz: any) => quiz._id === qid);

  const [quiz, setQuiz] = useState<any>(
    quizFromRedux || { title: "", questions: [] }
  );
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(!quizFromRedux);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);

  const { responses } = useSelector((state: any) => state.responsesReducer);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const questions = await quizClient.findQuestionsForQuiz(qid);

        setQuiz((prevQuiz: any) => ({
          ...prevQuiz,
          title: prevQuiz.title || quizFromRedux?.title || "Untitled Quiz",
          questions,
        }));
      } catch (err) {
        console.error("Failed to fetch questions:", err);
        setError("Failed to load quiz data.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuizData();
  }, [qid, quizFromRedux]);

  useEffect(() => {
    const currentTime = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
    setStartTime(currentTime);
  }, [answers]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prevAnswers) => {
      const updatedAnswers = { ...prevAnswers, [questionId]: answer };
      return updatedAnswers;
    });
  };

  const handleSubmitQuiz = async () => {
    const quizResponses = quiz.questions.map((question: any) => {
      const userAnswer = answers[question._id] || "";
      const correctAnswer = question.answers.find(
        (answer: any) => answer.correct
      );
      const isCorrect = correctAnswer && userAnswer === correctAnswer.text;

      return {
        questionId: question._id,
        answer: userAnswer,
        isCorrect: isCorrect,
      };
    });

    const quizData = {
      grade: 10,
      responses: quizResponses,
    };

    await userClient.createQuizResponse(
      currentUser._id,
      qid as string,
      quizData
    );
    dispatch(setResponses(quizData));
  };

  const handleEditQuiz = () => {
    navigate(`/Kanbas/Courses/${cid}/Quizzes/${qid}/editor`);
  };

  if (loading) return <p>Loading quiz...</p>;
  if (error) return <p>{error}</p>;
  if (!quiz) return <p>Quiz not found.</p>;

  return (
    <div className="container">
      <h1>{quiz.title}</h1>
      {location.pathname.includes("Preview") && (
        <div className="card mt-2 mb-2 bg-danger-subtle text-danger border-0">
          <div className="card-body">
            <span className="d-flex align-items-center">
              <PiWarningCircleBold className="me-1" /> This is a preview of the
              published version of the quiz
            </span>
          </div>
        </div>
      )}
      <span>Started: {startTime || "Loading..."}</span>
      <p>
        <b>Quiz Instructions:</b> Answer all questions below. Submit when done.
      </p>
      <hr className="mb-4" />
      {quiz.questions?.length > 0 ? (
        quiz.questions.map((question: any, index: number) => (
          <div key={index} className="card mb-3">
            <div className="card-header d-flex justify-content-between">
              <h4>{question.title}</h4>
              <span>{question.points} pts</span>
            </div>
            <div className="card-body">
              <p>{question.questionText}</p>
              {question.type === "Multiple Choice" && (
                <div className="list-group">
                  {question.answers.map((answer: any, idx: number) => (
                    <label
                      key={idx}
                      className="list-group-item d-flex align-items-center"
                    >
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={answer.text}
                        checked={answers[question._id] === answer.text}
                        onChange={() =>
                          handleAnswerChange(question._id, answer.text)
                        }
                        className="me-2"
                      />
                      {answer.text}
                    </label>
                  ))}
                </div>
              )}
              {question.type === "True/False" && (
                <div className="list-group">
                  {["True", "False"].map((option) => (
                    <label
                      key={option}
                      className="list-group-item d-flex align-items-center"
                    >
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={option}
                        checked={answers[question._id] === option}
                        onChange={() =>
                          handleAnswerChange(question._id, option)
                        }
                        className="me-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}
              {question.type === "Fill in the Blank" && (
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    style={{ height: "80px" }}
                    value={answers[question._id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question._id, e.target.value)
                    }
                  />
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <p>No questions available for this quiz.</p>
      )}
      <ul id="wd-assignments" className="list-group rounded-0 mt-4">
        <li className="list-group-item p-2 ps-1 d-flex justify-content-end align-items-center">
          <div className="me-2">Quiz saved at {startTime || "Loading..."}</div>
          <button className="btn btn-secondary" onClick={handleSubmitQuiz}>
            Submit Quiz
          </button>
        </li>
      </ul>
      {location.pathname.includes("Preview") && (
        <div className="d-flex mt-4">
          <button
            className="btn btn-secondary"
            onClick={handleEditQuiz}
            style={{ width: "100%" }}
          >
            <span className="d-flex align-items-center">
              <FaPencil className="me-1" />
              Keep Editing This Quiz
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
