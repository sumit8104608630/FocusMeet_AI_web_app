import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Landing from './pages/Landing.jsx';
import { BrowserRouter, createBrowserRouter, RouterProvider } from 'react-router-dom';
import About from './pages/About.jsx';
import Layout from './pages/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Meeting from './pages/Meeting.jsx';

import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { PeerProvider } from './context/PeerContext.jsx';

const router=createBrowserRouter([{
    
      path:'/',
      element:<Layout/>,
      children:[
        {
          path:'/',
          element:<Landing/>
        },

        {
          path:'/dashboard',
          element:<Dashboard/>
        },
        {
          path:'/meeting/:meetingId',
          element:<Meeting/>
        },
        {
          path:'/about',
          element:<About/>
        }
      ]

  
}]);
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <SocketProvider>
        <PeerProvider>
          <RouterProvider router={router} />
        </PeerProvider>
      </SocketProvider>
    </AuthProvider>
  </StrictMode>,
)
