import Navbar from './assets/components/navbar';
import Hero from './assets/components/hero';
import CardSlider from './assets/components/card_slider';
import Hero2 from './assets/components/hero2';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <Hero />
      <CardSlider />
      <Hero2 />
    </div>
  );
}

export default App;