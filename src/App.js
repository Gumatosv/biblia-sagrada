import { BrowserRouter, Routes, Route } from "react-router-dom";
import SagradisEscriturasLogin from "./components/SagradisEscriturasLogin";
import BooksPage from "./components/BooksPage";
import ChaptersPage from "./components/ChaptersPage";
import ChapterTextPage from "./components/ChapterTextPage";
import SearchResultsPage from "./components/SearchResultsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SagradisEscriturasLogin />} />
        <Route path="/leitura" element={<BooksPage />} />
        <Route path="/leitura/:book" element={<ChaptersPage />} />
        <Route path="/leitura/:book/:chapter" element={<ChapterTextPage />} />
        <Route path="/pesquisa" element={<SearchResultsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;