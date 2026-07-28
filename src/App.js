import { BrowserRouter, Routes, Route } from "react-router-dom";
import SagradisEscriturasLogin from "./components/SagradisEscriturasLogin";
import BooksPage from "./components/BooksPage";
import ChaptersPage from "./components/ChaptersPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SagradisEscriturasLogin />} />
        <Route path="/leitura" element={<BooksPage />} />
        <Route path="/leitura/:book" element={<ChaptersPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;