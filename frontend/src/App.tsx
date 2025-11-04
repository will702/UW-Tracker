import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import RecordDetail from './pages/RecordDetail';
import Brokers from './pages/Brokers';
import UnderwriterPerformance from './pages/UnderwriterPerformance';
import Admin from './pages/Admin';
import AuthGuard from './components/AuthGuard';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/records" element={<Records />} />
          <Route path="/records/:id" element={<RecordDetail />} />
          <Route path="/brokers" element={<Brokers />} />
          <Route path="/performance" element={<UnderwriterPerformance />} />
          <Route path="/admin" element={
            <AuthGuard>
              <Admin />
            </AuthGuard>
          } />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

