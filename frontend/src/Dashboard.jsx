import { useEffect, useState } from "react";
import {
  Container,
  Card,
  Button,
  Row,
  Col,
  Modal,
  Form,
} from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function getEmailFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.email;
  } catch {
    return "";
  }
}

/**
 * Dashboard Component
 *
 * Displays a list of games and provides functionality to:
 * - Create new games
 * - Delete games
 * - Start game sessions
 * - Stop game sessions
 * - View game results
 */
function Dashboard({ token }) {
  const [games, setGames] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [gameName, setGameName] = useState("");
  const [uploadedQuestions, setUploadedQuestions] = useState([]);
  const [thumbnail, setThumbnail] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinSessionId, setJoinSessionId] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const navigate = useNavigate();

  // Fetch games on component mount and when token changes
  useEffect(() => {
    fetchGames();
  }, [token]);

  const sortGames = (gamesList) => {
    return [...gamesList]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .sort((a, b) => {
        const aActive = a.active !== null;
        const bActive = b.active !== null;
        return bActive - aActive;
      });
  };

  /**
   * Fetches the list of games from the server
   */
  const fetchGames = async () => {
    try {
      const res = await axios.get(
        "https://bigbrain-backend-qff3.onrender.com/admin/games",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const sorted = sortGames(res.data.games || []);
      setGames(sorted);
    } catch (err) {
      console.error("Failed to load games:", err);
    }
  };

  /**
   * Creates a new game
   */
  const createGame = async () => {
    const newGame = {
      id: String(Date.now()),
      name: gameName,
      owner: getEmailFromToken(token),
      thumbnail: thumbnail,
      questions: uploadedQuestions,
      active: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      const updatedGames = [...games, newGame];
      await axios.put(
        "https://bigbrain-backend-qff3.onrender.com/admin/games",
        { games: updatedGames },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchGames();
      setShowModal(false);
      setGameName("");
      setUploadedQuestions([]);
      setThumbnail("");
    } catch (err) {
      console.error("Failed to create game:", err);
    }
  };

  const handleJoinGame = () => {
    if (!joinSessionId.trim()) return;
    navigate(`/play/${joinSessionId}`);
    setShowJoinModal(false);
    setJoinSessionId("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      if (!jsonData.name || !Array.isArray(jsonData.questions)) {
        alert(
          "Invalid JSON structure. File must contain 'name' and 'questions'."
        );
        return;
      }

      setGameName(jsonData.name);
      setUploadedQuestions(jsonData.questions);
      if (jsonData.thumbnail) {
        setThumbnail(jsonData.thumbnail);
      }
    } catch (err) {
      alert("Error parsing JSON file.",err);
    }
  };

  /**
   * Deletes a game
   */
  const confirmDeleteGame = () => {
    const updatedGames = games.filter((g) => g.id !== gameToDelete.id);
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
        setShowDeleteModal(false);
        setGameToDelete(null);
      })
      .catch((err) => {
        console.error("Failed to delete game:", err);
      });
  };

  /**
   * Starts a game session
   * @param {string} gameId - The ID of the game to start
   */
  const startGame = async (gameId) => {
    try {
      await axios.post(
        `https://bigbrain-backend-qff3.onrender.com/admin/game/${gameId}/mutate`,
        {
          mutationType: "START",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let sessionId = null;
      let updatedGames = [];

      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await axios.get(
          "https://bigbrain-backend-qff3.onrender.com/admin/games",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        updatedGames = res.data.games;
        const game = updatedGames.find((g) => g.id === gameId);
        sessionId = game?.active;

        if (sessionId) break;
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      if (!sessionId) {
        console.error("No session ID found in game data");
        return;
      }

      const finalGames = updatedGames.map((g) => {
        if (g.id === gameId) {
          return { ...g, active: sessionId };
        }
        return g;
      });

      await axios.put(
        "https://bigbrain-backend-qff3.onrender.com/admin/games",
        {
          games: finalGames,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setGames(sortGames(updatedGames));
      setActiveSession({ gameId, sessionId });
      setShowSessionModal(true);

      const sessionMap = JSON.parse(localStorage.getItem("sessionMap") || "{}");
      if (!sessionMap[gameId]) sessionMap[gameId] = [];
      if (!sessionMap[gameId].includes(sessionId)) {
        sessionMap[gameId].push(sessionId);
        localStorage.setItem("sessionMap", JSON.stringify(sessionMap));
      }
    } catch (err) {
      console.error("Failed to start game:", err);
    }
  };

  /**
   * Copies the session link to clipboard
   */
  const copySessionLink = () => {
    if (!activeSession?.sessionId) {
      console.error("No active session ID available");
      return;
    }
    const url = `${window.location.origin}/play/${activeSession.sessionId}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <Container className="mt-4">
      <h2>Dashboard</h2>
      <Button onClick={() => setShowModal(true)}>Create New Game</Button>
      &nbsp;
      <Button variant="secondary" onClick={() => setShowJoinModal(true)}>
        Join Game
      </Button>
      <Row className="mt-3">
        {games.map((game) => (
          <Col key={game.id} md={4} className="mb-4 d-flex">
            <Card
              className="w-100 h-100 d-flex flex-column justify-content-between"
              style={{ position: "relative" }}
            >
              <div
                onClick={() => navigate(`/game/${game.id}`)}
                style={{ cursor: "pointer" }}
              >
                <Card.Img
                  variant="top"
                  src={game.thumbnail || "placeholder.png"}
                  style={{
                    height: "180px",
                    width: "100%",
                    objectFit: "fill",
                    objectPosition: "center",
                  }}
                />
              </div>
              <Button
                variant="danger"
                size="sm"
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  zIndex: 1,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setGameToDelete(game);
                  setShowDeleteModal(true);
                }}
              >
                Del
              </Button>
              <Card.Body
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/game/${game.id}`)}
              >
                <Card.Title className="text-truncate">{game.name}</Card.Title>
                <Card.Text style={{ fontSize: "0.9rem", lineHeight: "1.2rem" }}>
                  Questions: {game.questions.length}
                  <br />
                  Duration:{" "}
                  {game.questions.reduce(
                    (acc, q) => acc + (q.time || 0),
                    0
                  )}{" "}
                  seconds
                </Card.Text>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <Button
                    variant={game.active ? "success" : "primary"}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!game.active) {
                        startGame(game.id);
                      } else {
                        navigate(`/gamecontrol/${game.id}/${game.active}`);
                      }
                    }}
                  >
                    {game.active ? "Control Game" : "Start Game"}
                  </Button>
                  {game.active && (
                    <span style={{ fontSize: "0.8rem" }}>
                      <strong>SessionId:</strong> {game.active}
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/history/${game.id}`);
                    }}
                  >
                    View Past Sessions
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
     