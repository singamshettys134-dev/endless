import { Route, Routes } from 'react-router-dom';
import Shell from './components/layout/Shell.jsx';
import Home from './pages/Home.jsx';
import Watch from './pages/Watch.jsx';
import Trending from './pages/Trending.jsx';
import Explore from './pages/Explore.jsx';
import Category from './pages/Category.jsx';
import Search from './pages/Search.jsx';
import Lab from './pages/Lab.jsx';
import Architecture from './pages/Architecture.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="watch/:id" element={<Watch />} />
        <Route path="trending" element={<Trending />} />
        <Route path="explore" element={<Explore />} />
        <Route path="category/:name" element={<Category />} />
        <Route path="search" element={<Search />} />
        <Route path="lab" element={<Lab />} />
        <Route path="architecture" element={<Architecture />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
