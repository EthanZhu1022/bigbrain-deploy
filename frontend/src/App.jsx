import {
  BrowserRouter as Router,
} from "react-router-dom";
import Pages from './Pages.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#d0ebff' }}>
      <Router>
        <Pages />
      </Router>
    </div>
  );
}

export default App;
