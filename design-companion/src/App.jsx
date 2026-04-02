import { Routes, Route } from 'react-router-dom'
import GetStarted from './pages/GetStarted'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import Privacy from './pages/Privacy'

function App() {
  return (
    <Routes>
      <Route path="/" element={<GetStarted />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/privacy" element={<Privacy />} />
    </Routes>
  )
}

export default App
