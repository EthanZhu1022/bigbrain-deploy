import React, { useEffect, useState } from 'react';
import { Container, Table, Card } from 'react-bootstrap';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function SessionResults({ token }) {
  const { sessionId  } = useParams();
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.get(`http://localhost:5005/admin/session/${sessionId}/results`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
  
        console.log("Fetched results:", res.data.results);
        setResults(res.data.results || []);
      } catch (err) {
        console.error('Failed to fetch results', err);
        setResults([]);
      }
    };
  
    fetchResults();
  }, [sessionId, token]);
  

  const calculatePlayerScore = (player) => {
    let totalScore = 0;
    for (const ans of player.answers) {
      if (!ans.correct) continue;

      const questionDuration = ans.questionDuration || 30;
      const timeTaken =
        (new Date(ans.answeredAt).getTime() - new Date(ans.questionStartedAt).getTime()) / 1000;
      const speedFactor = Math.max(0.1, (questionDuration - timeTaken) / questionDuration);
      const basePoints = 100;

      totalScore += speedFactor * basePoints;
    }
    return Math.round(totalScore);
  };

  const getCorrectnessData = () => {
    const questionIds = results.flatMap(p =>
      Array.isArray(p.answers)
        ? p.answers
            .map(a => typeof a.questionId === 'number' ? a.questionId : -1)
        : []
    ).filter(id => id >= 0);
  
    if (questionIds.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: '% Correct',
          data: [],
        }]
      };
    }
  
    const questionCount = Math.max(...questionIds) + 1;
    const correctPerQuestion = Array(questionCount).fill(0);
    const totalPerQuestion = Array(questionCount).fill(0);
  
    results.forEach(player => {
      if (!Array.isArray(player.answers)) return;
      player.answers.forEach(ans => {
        if (typeof ans.questionId !== 'number') return;
        totalPerQuestion[ans.questionId]++;
        if (ans.correct) correctPerQuestion[ans.questionId]++;
      });
    });
  
    return {
      labels: correctPerQuestion.map((_, i) => `Q${i + 1}`),
      datasets: [{
        label: '% Correct',
        data: correctPerQuestion.map((c, i) =>
          totalPerQuestion[i] > 0
            ? Math.round((c / totalPerQuestion[i]) * 100)
            : 0
        ),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      }]
    };
  };

 

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Game Session Results</h2>

      <Card className="mb-4">
        <Card.Header>Top 5 Players</Card.Header>
        <Card.Body>
          <Table striped bordered>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {[...results]
                .map(p => ({ ...p, totalScore: calculatePlayerScore(p) }))
                .sort((a, b) => b.totalScore - a.totalScore)
                .slice(0, 5)
                .map((player, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{player.name}</td>
                    <td>{player.totalScore}</td>
                  </tr>
                ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>Correctness Per Question</Card.Header>
        <Card.Body>
          <Bar data={getCorrectnessData()} />
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>Average Response Time</Card.Header>
        <Card.Body>
          <Line data={getResponseTimeData()} />
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>Scoring System Explanation</Card.Header>
        <Card.Body>
          <p><strong>Final Score = Sum of (Question Points × Speed Factor)</strong></p>
          <ul>
            <li><strong>Speed Factor</strong> = (Remaining Time / Total Time), minimum 0.1</li>
            <li>Each question is worth <strong>100 points</strong> if answered correctly</li>
            <li>Incorrect or unanswered questions yield 0 points</li>
            <li>This scoring rewards both <strong>accuracy and speed</strong></li>
          </ul>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default SessionResults;
