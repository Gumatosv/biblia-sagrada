import { BrowserRouter, Routes, Route } from "react-router-dom";
import SagradisEscriturasLogin from "./components/SagradisEscriturasLogin";
import BooksPage from "./components/BooksPage";
import ChaptersPage from "./components/ChaptersPage";
import ChapterTextPage from "./components/ChapterTextPage";
import SearchResultsPage from "./components/SearchResultsPage";
import LoginPage from "./components/LoginPage";
import UserMenu from "./components/UserMenu";

function App() {
  return (
    <BrowserRouter>
      <UserMenu />
      <Routes>
        <Route path="/" element={<SagradisEscriturasLogin />} />
        <Route path="/leitura" element={<BooksPage />} />
        <Route path="/leitura/:book" element={<ChaptersPage />} />
        <Route path="/leitura/:book/:chapter" element={<ChapterTextPage />} />
        <Route path="/pesquisa" element={<SearchResultsPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;