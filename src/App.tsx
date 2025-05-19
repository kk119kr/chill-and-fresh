// import React from 'react'; 이 줄 제거

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import RoomCreation from './pages/RoomCreation';
import Lobby from './pages/Lobby';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<RoomCreation />} />
        <Route path="/join" element={<Lobby />} />
      </Routes>
    </Router>
  );
}

export default App;