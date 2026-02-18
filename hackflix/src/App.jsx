import { Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { Player } from "./pages/Player";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/browse" element={<Home />} />
      <Route path="/watch/:id" element={<Player />} />
    </Routes>
  );
}

export default App;
