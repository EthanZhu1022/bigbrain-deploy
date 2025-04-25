import { useParams, Link, useNavigate } from "react-router-dom";
import { Container, Button, ListGroup, Form } from "react-bootstrap";
import { useEffect, useState } from "react";
import axios from "axios";

function EditGame({ token, showToast }) {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [games, setGames] = useState([]);
  const [game, setGame] = useState(null);
  const [name, setName] = useState("");
  const [thumbnail, setThumbnail] = useState("");

  useEffect(() => {
    axios
      .get("https://bigbrain-backend-qff3.onrender.com/admin/games", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setGames(res.data.games);
        const target = res.data.games.find((g) => g.id.toString() === gameId);
        if (target) {
          setGame(target);
          setName(target.name);
          setThumbnail(target.thumbnail || "");
        }
      });
  }, [gameId, token]);

  const updateGames = (newGameData) => {
    const updatedGames = games.map((g) =>
      String(g.id) === gameId ? newGameData : g
    );
    axios
      .put(
        "https://bigbrain-backend-qff3.onrender.com/admin/games",
        { games: updatedGames },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then(() => {
        setGames(updatedGames);
        setGame(newGameData);
        showToast && showToast("Game info saved successfully!", "success");
      });
  };

  const deleteQuestion = (index) => {
    const updated = { ...game };
    updated.questions.splice(index, 1);
    updateGames(updated);
  };

  const saveMetadata = () => {
    const updated = { ...game, name, thumbnail };
    updateGames(updated);
  };

  if (!game) return <Container className="mt-4">Loading game...</Container>;

  return (
    <Container className="mt-4">
      <h2>Edit Game: {game.name}</h2>

      <Form className="mb-4">
        <Form.Group className="mb-3">
          <Form.Label>Game Name</Form.Label>
          <Form.Control
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Thumbnail</Form.Label>
          <Form.Control
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
          />
        </Form.Group>
        <Button onClick={saveMetadata}>Save Game Info</Button>&nbsp;
        <Button variant="secondary" onClick={() => navigate("/dashboard")}>
          Back
        </Button>
      </Form>

      <h4>Questions</h4>
      <ListGroup className="mb-3">
        {game.questions.map((q, index) => (
          <ListGroup.Item
            key={index}
            className="d-flex justify-content-between align-items-center"
          >
            <div>
              #{index + 1}: {q.question}
            </div>
            <div>
              <Button
                size="sm"
                variant="info"
                as={Link}
                to={`/game/${gameId}/question/${index}`}
                className="me-2"
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => deleteQuestion(index)}
              >
                Delete
              </Button>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>

      <Button as={Link} to={`/game/${gameId}/question/new`} variant="success">
        Add New Question
      </Button>
    </Container>
  );
}

export default EditGame;
