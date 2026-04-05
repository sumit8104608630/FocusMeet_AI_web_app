import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Landing from './pages/Landing.jsx';
import { BrowserRouter, createBrowserRouter, RouterProvider } from 'react-router-dom';
import About from './pages/About.jsx';
import Layout from './pages/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';

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
          path:'/about',
          element:<About/>
        }
      ]

  
}]);
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}>
      <Layout></Layout>
    </RouterProvider>
  </StrictMode>,
)
