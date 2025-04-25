import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Spinner, Alert, Row, Col, Modal } from 'react-bootstrap';
import axios from 'axios';

function GameScreen({ showToast }) {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [lastStartedTime, setLastStartedTime] = useState('');
  const [performance, setPerformance] = useState([]);
  const [gameEnded, setGameEnded] = useState(false);

  useEffect(() => {
    if (gameEnded) return;
    const poll = async () => {
      try {
        const res = await axios.get(`https://bigbrain-backend-qff3.onrender.com/play/${playerId}/question`);
        
        if (res.data.question === null) {
          clearInterval(intervalRef.current);
          setGameEnded(true);
          return;
        }

        const question = res.data.question;
        const startTime = new Date(question.isoTimeLastQuestionStarted).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = Math.max(0, question.time - elapsed);

        setCurrentQuestion(question);
        setTimeLeft(remaining);
        setShowResults(remaining <= 0);

        if (question.isoTimeLastQuestionStarted !== lastStartedTime) {
          setAnswerSubmitted(false);
          setSelectedAnswers([]);
          setLastStartedTime(question.isoTimeLastQuestionStarted);
        }
      } catch (err) {
        if (err.response?.status === 400) {
          console.warn('Game has ended (400 from server).');
          clearInterval(intervalRef.current);
          setGameEnded(true);
        } else {
          console.error('Polling failed:', err);
          setError('Failed to fetch game question');
        }
      }      
    };

    poll();
    intervalRef.current = setInterval(poll, 1000);
    return () => clearInterval(intervalRef.current);
  }, [playerId, lastStartedTime]);

  const handleAnswerClick = (index) => {
    if (!currentQuestion || showResults || timeLeft <= 0) return;

    const questionId = currentQuestion.id;
    let updated = [...selectedAnswers];
    const existingIndex = updated.findIndex(a => a.questionId === questionId);

    if (currentQuestion.type === 'single' || currentQuestion.type === 'judgement') {
      const newAnswer = { questionId, answerIds: [index] };
      if (existingIndex !== -1) {
        updated[existingIndex] = newAnswer;
      } else {
        updated.push(newAnswer);
      }
    } else {
      if (existingIndex !== -1) {
        const existing = updated[existingIndex];
        const idx = existing.answerIds.indexOf(index);
        if (idx > -1) {
          existing.answerIds.splice(idx, 1);
        } else {
          existing.answerIds.push(index);
        }
        updated[existingIndex] = { ...existing };
      } else {
        updated.push({ questionId, answerIds: [index] });
      }
    }

    setSelectedAnswers(updated);
    setAnswerSubmitted(false);
  };

  const handleSubmitAnswer = async () => {
    const questionId = currentQuestion.id;
    const answerData = selectedAnswers.find(a => a.questionId === questionId);
    const answerIds = answerData?.answerIds ?? [];
  
    if (answerIds.length === 0) {
      showToast('You must choose!', 'danger');
      return;
    }
  
    try {
      const res = await axios.put(`https://bigbrain-backend-qff3.onrender.com/play/${playerId}/answer`, {
        answerIds
      });
  
      if (res.status === 200) {
        const timeSpent = currentQuestion.time - timeLeft;
        const correctAnswerIds = currentQuestion.answers
          .map((a, i) => a.correct ? i : null)
          .filter(i => i !== null);
  
        setPerformance(prev => [...prev, {
          question: currentQuestion.question,
          correctAnswerIds,
          selected: answerIds,
          timeSpent,
          totalTime: currentQuestion.time,
          points: currentQuestion.points
        }]);
  
        setAnswerSubmitted(true);
      } else {
        showToast('Submission failed. Try again.', 'danger');
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
      showToast('Failed to submit answer.', 'danger');
    }
  };  

  if (error) {
    return <Alert variant="danger" className="m-4">{error}</Alert>;
  }

  if (!currentQuestion && !gameEnded) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p>Loading question...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Time Remaining: {timeLeft}s</Card.Title>
          <Card.Subtitle className="mb-3 text-muted">{currentQuestion?.type?.toUpperCase()} Question</Card.Subtitle>
          <Card.Text style={{ fontSize: '1.25rem' }}>{currentQuestion.question}</Card.Text>
          {currentQuestion.media && currentQuestion.media.startsWith('http') && (
            currentQuestion.media.endsWith('.mp4') ? (
              <video src={currentQuestion.media} controls className="w-100 my-3" />
            ) : (
              <img src={currentQuestion.media} alt="question" className="img-fluid my-3" />
            )
          )}
        </Card.Body>
      </Card>

      <Row>
        {currentQuestion.answers.map((ans, idx) => {
          const selected = selectedAnswers.find(a => a.questionId === currentQuestion.id);
          const isSelected = selected?.answerIds.includes(idx);

          return (
            <Col md={6} className="mb-3" key={idx}>
              <Button
                variant={isSelected ? 'primary' : 'outline-secondary'}
                className="w-100"
                disabled={showResults}
                onClick={() => handleAnswerClick(idx)}
              >
                {ans.text}
              </Button>
            </Col>
          );
        })}
      </Row>

      {!showResults && timeLeft > 0 && !answerSubmitted && (
        <div className="text-center">
          <Button variant="success" size="lg" onClick={handleSubmitAnswer} disabled={answerSubmitted} >
            Submit Answer
          </Button>
        </div>
      )}

      {showResults && (
        <Card className="mt-4">
          <Card.Body>
            <Card.Title>Correct Answers</Card.Title>
            <ul>
              {currentQuestion.answers.map((ans, idx) =>
                ans.correct ? <li key={idx}>{ans.text}</li> : null
              )}
            </ul>
          </Card.Body>
        </Card>
      )}

      {gameEnded && (
        <Modal show onHide={() => navigate('/')}>
          <Modal.Header closeButton>
            <Modal.Title>Your Quiz Results</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p><strong>Scoring System Explanation:</strong></p>
            <ul>
              <li>Each question's score = Question points × Speed factor</li>
              <li>Speed factor = Remaining time / Total time, minimum is 0.1</li>
              <li>Incorrect or unanswered questions score 0</li>
            </ul>
            <hr />
            <h5>Performance Details:</h5>
            <hr />
            <h5>Total Score: {
              performance.reduce((acc, entry) => {
                const correct = entry.correctAnswerIds.every(id => entry.selected.includes(id));
                const speedFactor = Math.max(0.1, (entry.totalTime - entry.timeSpent) / entry.totalTime);
                const score = correct ? Math.round(entry.points * speedFactor) : 0;
                return acc + score;
              }, 0)
            } points</h5>

            <ul>
              {performance.map((entry, i) => {
                const correct = entry.correctAnswerIds.every(id => entry.selected.includes(id));
                const speedFactor = Math.max(0.1, (entry.totalTime - entry.timeSpent) / entry.totalTime);
                const score = correct ? Math.round(entry.points * speedFactor) : 0;
                return (
                  <li key={i}>
                    <strong>Question {i + 1}:</strong> {entry.question}<br />
                    Time spent: {entry.timeSpent}s, Score: {score} points
                  </li>
                );
              })}
            </ul>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => navigate('/')}>Return to Login Page</Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
}

export default GameScreen;
