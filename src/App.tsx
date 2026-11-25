import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Welcome from './pages/Welcome';
import AnimalList from './pages/AnimalList';
import Schedule from './pages/Schedule';
import Feeding from './pages/Feeding';
import Food from './pages/Food';
import Analysis from './pages/Analysis';
import Alerts from './pages/Alerts';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-0 md:pt-16 pb-16 px-4">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/animals" element={<AnimalList />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/feeding" element={<Feeding />} />
              <Route path="/food" element={<Food />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/alerts" element={<Alerts />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;