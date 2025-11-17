
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import HomePage from '../pages/HomePage';
import AboutPage from '../pages/AboutPage';
import ContactPage from '../pages/ContactPage';
import StudyGuidePage from '../pages/StudyGuidePage';
import TutorPage from '../pages/TutorPage';
import BookmarksPage from '../pages/BookmarksPage';

const PageRenderer: React.FC = () => {
    const { currentPage } = useContext(AppContext);

    switch (currentPage) {
        case 'home':
            return <HomePage />;
        case 'guides':
            return <StudyGuidePage />;
        case 'tutor':
            return <TutorPage />;
        case 'bookmarks':
            return <BookmarksPage />;
        case 'about':
            return <AboutPage />;
        case 'contact':
            return <ContactPage />;
        default:
            return <HomePage />;
    }
};

export default PageRenderer;