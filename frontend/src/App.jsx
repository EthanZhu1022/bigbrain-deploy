import {
  BrowserRouter as Router,
} from "react-router-dom";
import Pages from './Pages.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return(
    <Router>
      <Pages />
    </Router>
  )
}

export default App;
