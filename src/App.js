import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import SagradisEscriturasLogin from "./components/SagradisEscriturasLogin";
import BooksPage from "./components/BooksPage";
import ChaptersPage from "./components/ChaptersPage";
import ChapterTextPage from "./components/ChapterTextPage";
import SearchResultsPage from "./components/SearchResultsPage";
import LoginPage from "./components/LoginPage";
import ProgressPage from "./components/ProgressPage";
import Navbar from "./components/Navbar";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<SagradisEscriturasLogin />} />
          <Route path="/leitura" element={<BooksPage />} />
          <Route path="/leitura/:book" element={<ChaptersPage />} />
          <Route path="/leitura/:book/:chapter" element={<ChapterTextPage />} />
          <Route path="/pesquisa" element={<SearchResultsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/progresso" element={<ProgressPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;