import React from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import {AuthProvider} from './contexts/AuthContext';
import {ProtectedRoute} from './components/ProtectedRoute';
import AdminRoute from './components/admin/AdminRoute';
import Navigation from './components/HomeNavigation';
import LogoutHandler from './components/LogoutHandler';
import AlertHandler from './components/AlertHandler';

// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AnimePage from './pages/AnimePage';
import CharacterPage from './pages/CharacterPage';
import VAPage from './pages/VAPage';
import GenrePage from './pages/GenrePage';
import CompanyPage from './pages/CompanyPage';
import Home from './pages/Home';
import SearchResultsPage from './pages/SearchResultsPage';
import NotFound from './pages/NotFound';
import MyLists from './pages/MyLists';
import ListDetail from './pages/ListDetail';
import ListSearch from './pages/ListSearch';
import AdminDashboard from './pages/AdminDashboard';

// Import CSS
import './styles/App.css';
import './styles/Auth.css';
import './styles/Profile.css';
import './styles/styles.css';
import './styles/Navigation.css';
import './styles/Home.css';
import './styles/NotFound.css';
import './styles/MyLists.css';
import './styles/ListDetail.css';

function App() {
    return (<AuthProvider>
        <AlertHandler />
        <Router>
            <LogoutHandler />
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
                        <Route path="/search-results" element={<SearchResultsPage/>}/>
                        <Route path="/login" element={<Login/>}/>
                        <Route path="/register" element={<Register/>}/>
                        <Route
                            path="/admin"
                            element={
                                <AdminRoute>
                                    <AdminDashboard/>
                                </AdminRoute>
                            }
                        />
                        <Route path="/anime/:animeId" element={<AnimePage/>}/>
                        <Route path="/character/:charId" element={<CharacterPage/>}/>
                        <Route path="/va/:vaId" element={<VAPage/>}/>
                        <Route path="/genre/:genreId" element={<GenrePage/>}/>
                        <Route path="/company/:companyId" element={<CompanyPage/>}/>
                        <Route
                            path="/my-lists"
                            element={<ProtectedRoute>
                                <MyLists/>
                            </ProtectedRoute>}
                        />

                        <Route
                            path="/my-lists/:id"
                            element={<ProtectedRoute>
                                <ListDetail/>
                            </ProtectedRoute>}
                        />
                        {/* Profile Routes - Both use the same Profile component */}
                        <Route
                            path="/profile"
                            element={<ProtectedRoute>
                                <Profile/>
                            </ProtectedRoute>}
                        />
                        <Route
                            path="/profile/:userId"
                            element={<ProtectedRoute>
                                <Profile/>
                            </ProtectedRoute>}
                        />

                        <Route
                            path="/search-lists"
                            element={
                                <ProtectedRoute>
                                    <ListSearch/>
                                </ProtectedRoute>
                            }
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