
import './App.css';
import React from 'react';
import NavBar from './Components/NavBar.jsx';
import Home from './Components/Home.jsx';
import SocialLinks from './Components/SocialLinks.jsx';
import About from './Components/About.jsx';
import Projects from './Components/Projects.jsx';
import Skills from './Components/Skills.jsx';
import Contact from './Components/Contact.jsx';
function App() {
  return (
    <div className="App">
      <NavBar />
      <Home />

      <SocialLinks/>
      <About/>
      <Projects/>
      <Skills/>
      <Contact/>
    </div>
  );
}

export default App;
