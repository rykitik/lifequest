function Header() {
  return (
    <header className="bg-gray-800 text-white px-6 py-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">LifeQuest</h1>
        <nav className="space-x-4">
          <a href="#" className="hover:underline">Главная</a>
          <a href="#" className="hover:underline">Квесты</a>
          <a href="#" className="hover:underline">Профиль</a>
          <a href="#" className="hover:underline">Тест</a>
        </nav>
      </div>
    </header>
  );
}

export default Header;