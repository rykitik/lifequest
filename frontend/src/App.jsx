import Layout from "./components/Layout";

function App() {
  return (
    <Layout>
      <div className="text-center">
        <h2 className="text-4xl font-bold text-blue-400">Добро пожаловать в LifeQuest!!!</h2>
        <p className="mt-4 text-gray-300">
          Заводи квесты, повышай уровень и прокачивай день!
        </p>
        <button className="mt-6 px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition">
          Начать
        </button>
      </div>
    </Layout>
  );
}

export default App;
