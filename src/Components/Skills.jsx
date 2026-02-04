import React from 'react';
import cssLogo from '../assets/skills/cssLogo.webp';
import htmlLogo from '../assets/skills/htmlLogo.webp';
import jsLogo from '../assets/skills/jsLogo.webp';
import reactLogo from '../assets/skills/reactJs.webp';
import gitHubLogo from '../assets/skills/gitHubLogo.webp';
import pythonLogo from '../assets/skills/python.jpg';
import javaLogo from '../assets/skills/javaLogo.jpg';

function Skills() {
  const skills = [
    { id: 1, src: htmlLogo, title: 'HTML', style: 'shadow-orange-500' },
    { id: 2, src: cssLogo, title: 'CSS', style: 'shadow-blue-500' },
    { id: 3, src: jsLogo, title: 'JavaScript', style: 'shadow-yellow-500' },
    { id: 4, src: reactLogo, title: 'ReactJs', style: 'shadow-blue-600' },
    { id: 5, src: gitHubLogo, title: 'GitHub', style: 'shadow-gray-500' },
    { id: 6, src: pythonLogo, title: 'Python', style: 'shadow-yellow-600' },
    { id: 7, src: javaLogo, title: 'Java', style: 'shadow-red-600' },
  ];

  return (
    <div name='skills' className='bg-gradient-to-b from-gray-800 to-black w-full h-screen'>
      <div className='max-w-screen-lg mx-auto p-4 flex flex-col justify-center w-full h-full text-white'>
        
        <div>
          <p className='text-4xl font-bold border-b-4 border-gray-500 p-2 inline'>
            Skills
          </p>
          <p className='py-6'>
            These are the technologies I’ve been working with
          </p>
        </div>

        <div className='w-full grid grid-cols-2 sm:grid-cols-3 gap-8 text-center py-8 px-12 sm:px-0'>
          {skills.map(({ id, src, title, style }) => (
            <div
              key={id}
              className={`shadow-md hover:scale-105 duration-300 py-2 rounded-lg ${style}`}
            >
              <img src={src} alt={title} className='w-20 mx-auto' />
              <p className='mt-4'>{title}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default Skills;
