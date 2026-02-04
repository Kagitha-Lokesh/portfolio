import React from 'react';
import project1 from '../assets/Projects/project1.jpg';
import project2 from '../assets/Projects/project2.png';
import project3 from '../assets/Projects/project3.jpg';
import project4 from '../assets/Projects/project4.jpg';
import project5 from '../assets/Projects/project5.jpg';
import project6 from '../assets/Projects/project6.jpg';

function Projects() {

  const projects = [
    { id: 1, src: project1 },
    { id: 2, src: project2 },
    { id: 3, src: project3 },
    { id: 4, src: project4 },
    { id: 5, src: project5 },
    { id: 6, src: project6 },
  ];

  return (
    <div name='projects' className='bg-gradient-to-b from-black to-gray-800 text-white md:h-screen'>
      <div className='max-w-screen-lg p-4 mx-auto flex flex-col justify-center w-full h-full'>
        
        <div className='pb-8'>
          <p className='text-4xl font-bold inline border-b-4 border-gray-500'>
            Projects
          </p>
          <p className='py-6'>Check out some of my work right here</p>
        </div>

        {/* Grid Wrapper */}
        <div className='grid sm:grid-cols-2 md:grid-cols-3 gap-8 px-12 sm:px-0'>
          {projects.map(({ id, src }) => (
            <div key={id} className='shadow-md shadow-gray-600 rounded-lg'>
              <img
                src={src}
                alt="project"
                className='rounded-md duration-200 hover:scale-105'
              />
              <div className='flex items-center justify-center'>
                <button className='w-1/2 px-6 py-3 m-4 duration-200 hover:scale-105'>
                  Demo
                </button>
                <button className='w-1/2 px-6 py-3 m-4 duration-200 hover:scale-105'>
                  Code
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default Projects;
