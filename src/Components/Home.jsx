import React from 'react';
import Image from '../assets/My_Image.jpeg';
import { IoMdArrowRoundForward  } from "react-icons/io";

function Home() {
  return (
    <div name="home" className='h-screen w-full bg-gradient-to-b from-black via-black to-gray-800'>
        <div className='max-w-screen-lg mx-auto flex flex-col items-center justify-center h-full px-4 md:flex-row'>
            <div className='flex flex-col justify-center h-full'>
                <h1 className='text-4xl sm:text-7xl font-bold text-white'>
                    Hi, I’m{' '}
                    <span className='bg-gradient-to-b from-cyan-50 to-cyan-500 bg-clip-text text-transparent'>
                        Lokesh
                    </span>{' '}
                    <br />
                    Full Stack Developer
                </h1>

                <p className='text-gray-400 my-4'>
                    I’m Lokesh, a Full Stack Developer who builds modern, responsive, and scalable web applications using React, Java, REST APIs, and SQL databases. 
I enjoy solving real-world problems through clean UI and efficient backend logic. 
Currently, I’m focused on building production-ready projects and preparing for roles in product-based companies.

                </p>
                <div>
                    <button className='group text-white w-fit px-6 py-3 my-2 flex items-center rounded-md bg-gradient-to-r from-cyan-500 to-blue-500 cursor-pointer'>
                        Projects
                        <span className='group-hover:rotate-90 duration-300'>
                            <IoMdArrowRoundForward className='ml-1.5'/>
                        </span>
                    </button>
                </div>
            </div>
            <div>
                <img src={Image} alt="My Profile"
                    className='bg-gradient-to-r rounded-2xl mx-auto w-2/3 md:w-full' />
                    
            </div>
        </div>
    </div>
  )
}

export default Home