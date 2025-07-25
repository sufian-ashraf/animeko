import React from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import {AuthProvider} from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AlertProvider } from './contexts/AlertContext';
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
import StreamingPage from './pages/StreamingPage';
import NotFound from './pages/NotFound';
import MyLists from './pages/MyLists';
import AnimeLibrary from './pages/AnimeLibrary';
import ListDetail from './pages/ListDetail';

import AdminDashboard from './pages/AdminDashboard';
import SubscriptionPage from './pages/SubscriptionPage';
import PaymentConfirmationPage from './pages/PaymentConfirmationPage';
import MyFriends from './pages/MyFriends';

// Import CSS
import './styles/App.css';
import './styles/Auth.css';
import './styles/SubscriptionPage.css';
import './styles/PaymentConfirmationPage.css';
import './styles/Profile.css';
import './styles/styles.css';
import './styles/Navigation.css';
import './styles/Home.css';
import './styles/NotFound.css';
import './styles/MyLists.css';
import './styles/AnimeLibrary.css';
import './styles/ListDetail.css';
import './styles/dark-mode.css';

function App() {
    return (<AuthProvider>
        <ThemeProvider>
        <AlertProvider>
        <Router>
            <AlertHandler />
            <LogoutHandler />
            <div className="App">
                <header className="App-header">
                    <div className="header-content">
                        <Navigation/>
                    </div>
                </header>
                <main className="main-content">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Home/>}/>
                        <Route path="/streaming" element={<StreamingPage/>}/>
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
                            path="/anime-library"
                            element={<ProtectedRoute>
                                <AnimeLibrary/>
                            </ProtectedRoute>}
                        />
                        <Route
                            path="/anime-library/:userId"
                            element={<AnimeLibrary/>}
                        />

                        <Route
                            path="/lists/:id"
                            element={<ListDetail/>}
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
                            element={<Profile/>}
                        />

                        

                        {/* 404 Route */}
                        <Route path="*" element={<NotFound/>}/>
                        <Route
                            path="/subscription"
                            element={
                                <ProtectedRoute>
                                    <SubscriptionPage/>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/payment-confirmation"
                            element={
                                <ProtectedRoute>
                                    <PaymentConfirmationPage/>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/my-friends"
                            element={
                                <ProtectedRoute>
                                    <MyFriends/>
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </main>
            </div>
        </Router>
        </AlertProvider>
        </ThemeProvider>
    </AuthProvider>);
}

export default App;