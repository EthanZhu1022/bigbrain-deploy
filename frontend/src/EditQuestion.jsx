import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Row, Col } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import axios from 'axios';

function EditQuestion({ token, showToast }) {
  const { gameId, questionId } = useParams();
  const navigate = useNavigate();

  const [questionData, setQuestionData] = useState({
    question: '',
    time: 30,
    points: 10,
    type: 'single',
    media: '',
    answers: [
      { text: '', correct: false },
      { text: '', correct: false }
    ]
  });

  useEffect(() => {
    axios.get('https://bigbrain-backend-qff3.onrender.com/admin/games', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const game = res.data.games.find(g => g.id === Number(gameId));
      if (!game) throw new Error('Game not found');

      if (questionId === 'new') {
        setQuestionData({
          question: '',
          time: 30,
          points: 10,
          type: 'single',
          media: '',
          answers: [
            { text: '', correct: false },
            { text: '', correct: false }
          ]
        });
      } else {
        const question = game.questions[Number(questionId)];
        if (!question) throw new Error('Question not found');
        setQuestionData(question);
      }
    }).catch(err => {
      console.error('Failed to load question:', err);
    });
  }, [gameId, questionId, token]);

  useEffect(() => {
    if (questionData.type === 'judgement') {
      setQuestionData(prev => ({
        ...prev,
        answers: [
          { text: 'True', correct: prev.answers[0]?.correct || false },
          { text: 'False', correct: prev.answers[1]?.correct || false },
        ]
      }));
    }
  }, [questionData.type]);

  const updateGame = (updatedQuestion) => {
    if (!updatedQuestion.question.trim()) {
      showToast && showToast('Question text cannot be empty', 'danger');
      return;
    }

    const correctCount = updatedQuestion.answers.filter(a => a.correct).length;
    if (updatedQuestion.type === 'single' && correctCount !== 1) {
      showToast && showToast('Single choice question must have exactly one correct answer!', 'danger');
      return;
    }
    if (updatedQuestion.type === 'multiple' && correctCount < 2) {
      showToast && showToast('Multiple choice question must have at least two correct answers!', 'danger');
      return;
    }
    if ((updatedQuestion.type === 'single' || updatedQuestion.type === 'multiple') && updatedQuestion.answers.some(a => !a.text.trim())) {
      showToast && showToast('Answer text cannot be empty for single or multiple choice questions!', 'danger');
      return;
    }

    axios.get('https://bigbrain-backend-qff3.onrender.com/admin/games', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const games = res.data.games.map(game => {
        if (game.id === Number(gameId)) {
          const newQuestions = [...game.questions];
          if (questionId === 'new') {
            newQuestions.push(updatedQuestion);
          } else {
            newQuestions[Number(questionId)] = updatedQuestion;
          }
          return { ...game, questions: newQuestions };
        }
        return game;
      });

      return axios.put('https://bigbrain-backend-qff3.onrender.com/admin/games', { games }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }).then(() => {
      showToast && showToast('Question saved successfully!', 'success');
      navigate(`/game/${gameId}`);
    }).catch(err => {
      console.error('Failed to update game:', err);
    });
  };

  const handleAnswerChange = (index, key, value) => {
    const newAnswers = [...questionData.answers];

    if (key === 'correct' && value === true && questionData.type === 'single') {
      const alreadyCorrect = newAnswers.filter(a => a.correct).length;
      if (alreadyCorrect >= 1) {
        showToast && showToast('This is a single question,only have one correct answer!', 'danger');
        return;
      }
    }

    if (key === 'correct' && value === true && questionData.type === 'judgement') {
      const alreadyCorrect = newAnswers.filter(a => a.correct).length;
      if (alreadyCorrect >= 1) {
        showToast && showToast('This is a judgement question,only have one correct answer!', 'danger');
        return;
      }
    }

    if (questionData.type === 'single' && key === 'correct') {
      newAnswers.forEach((a, i) => {
        if (i !== index) a.correct = false;
      });
    }

    newAnswers[index][key] = key === 'correct' ? value : value;
    setQuestionData({ ...questionData, answers: newAnswers });
  };

  const addAnswer = () => {
    if (questionData.answers.length < 6) {
      setQuestionData({
        ...questionData,
        answers: [...questionData.answers, { text: '', correct: false }]
      });
    }
  };

  const removeAnswer = (index) => {
    if (questionData.answers.length > 2) {
      const newAnswers = [...questionData.answers];
      newAnswers.splice(index, 1);
      setQuestionData({ ...questionData, answers: newAnswers });
    }
  };

  return (
    <Container className="mt-4">
      <h2>{questionId === 'new' ? 'Create New Question' : `Edit Question #${Number(questionId) + 1}`}</h2>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Question Text</Form.Label>
          <Form.Control
            type="text"
            value={questionData.question}
            onChange={e => setQuestionData({ ...questionData, question: e.target.value })}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Type</Form.Label>
          <Form.Select
            value={questionData.type}
            onChange={e => setQuestionData({ ...questionData, type: e.target.value })}
          >
            <option value="single">Single Choice</option>
            <option value="multiple">Multiple Choice</option>
            <option value="judgement">Judgement</option>
          </Form.Select>
        </Form.Group>

        <Row className="mb-3">
          <Col>
            <Form.Label>Time (seconds)</Form.Label>
            <Form.Control type="number" value={questionData.time} onChange={e => setQuestionData({ ...questionData, time: Number(e.target.value) })} />
          </Col>
          <Col>
            <Form.Label>Points</Form.Label>
            <Form.Control type="number" value={questionData.points} onChange={e => setQuestionData({ ...questionData, points: Number(e.target.value) })} />
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Media URL (YouTube or Image)</Form.Label>
          <Form.Control type="text" value={questionData.media} onChange={e => setQuestionData({ ...questionData, media: e.target.value })} />
        </Form.Group>

        <h5>Answers</h5>
        {questionData.answers.map((answer, index) => (
          <Row key={index} className="mb-2">
            <Col xs={8}>
              <Form.Control
                type="text"
                value={answer.text}
                readOnly={questionData.type === 'judgement'}
                placeholder={`Answer ${index + 1}`}
                onChange={e => handleAnswerChange(index, 'text', e.target.value)}
              />
            </Col>
            <Col xs={2}>
              <Form.Check
                type="checkbox"
                label="Correct"
                checked={answer.correct}
                onChange={e => handleAnswerChange(index, 'correct', e.target.checked)}
              />
            </Col>
            {questionData.type !== 'judgement' && (
              <Col xs={2}>
                <Button
                  variant="danger"
                  onClick={() => removeAnswer(index)}
                  disabled={questionData.answers.length <= 2}
                >
                  Delete
                </Button>
              </Col>
            )}
          </Row>
        ))}

        {questionData.type !== 'judgement' && (
          <Button className="mb-3" onClick={addAnswer} disabled={questionData.answers.length >= 6}>Add Answer</Button>
        )}
        <br />
        <Button variant="primary" onClick={() => updateGame(questionData)}>
          {questionId === 'new' ? 'Create Question' : 'Save Changes'}
        </Button>
        <br />
        <div className="mt-3">
          <Button variant="secondary" onClick={() => navigate(`/game/${gameId}`)}>Back to Edit Game</Button>
        </div>
      </Form>
    </Container>
  );
}

export default EditQuestion;
