import { BrowserRouter, Routes, Route } from "react-router-dom";

function Home() {
  return <div className="p-8"><h1 className="text-2xl font-bold">SUPMEAL</h1></div>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
