import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { HomeLanding } from './pages/HomeLanding.tsx'
import { AppHome } from './pages/AppHome.tsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeLanding />} />
        <Route path="/app" element={<AppHome />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
