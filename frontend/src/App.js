import React from 'react';
import {BrowserRouter as Router, Link, Route, Routes} from 'react-router-dom';
import {AuthProvider} from './contexts/AuthContext';
import {ProtectedRoute} from './components/ProtectedRoute';
import Navigation from './components/HomeNavigation';

// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AnimePage from './pages/AnimePage';
import CharacterPage from './pages/CharacterPage';
import VAPage from './pages/VAPage';
import GenrePage from './pages/GenrePage';
import CompanyPage from './pages/CompanyPage';
// import Friends from './pages/Friends';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

// Import CSS
import './styles/App.css';
import './styles/Auth.css';
import './styles/Profile.css';

import './styles/styles.css';
import './styles/Home.css';
import './styles/NotFound.css';


function App() {
    return (<AuthProvider>
        <Router>
            <div className="App">
                <header className="App-header">
                    <div className="header-content">
                        <Navigation/>
                    </div>
                </header>
                <main>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Home/>}/>
                        <Route path="/login" element={<Login/>}/>
                        <Route path="/register" element={<Register/>}/>
                        <Route path="/anime/:animeId" element={<AnimePage/>}/>
                        <Route path="/character/:charId" element={<CharacterPage/>}/>
                        <Route path="/va/:vaId" element={<VAPage/>}/>
                        <Route path="/genre/:genreId" element={<GenrePage/>}/>
                        <Route path="/company/:companyId" element={<CompanyPage/>}/>

                        {/* Protected Routes */}
                        <Route
                            path="/profile"
                            element={<ProtectedRoute>
                                <Profile/>
                            </ProtectedRoute>}
                        />

                        {/* 404 Route */}
                        <Route path="*" element={<NotFound/>}/>
                    </Routes>
                </main>
            </div>
        </Router>
    </AuthProvider>);
}


export default App;