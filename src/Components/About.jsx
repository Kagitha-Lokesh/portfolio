import React from 'react'

function About() {
  return (
    <div name="about" className='w-full bg-gradient-to-b from-gray-800 to-black text-white'>
        <div className='max-w-screen-lg p-4 mx-auto flex flex-col justify-center w-full h-full'>
            <div className='pb-8'>
                <p className='text-4xl font-bold inline border-b-4 border-gray-500'>About</p>
                
            </div>
                <p className='text-xl mt-20'>Hi, I’m Lokesh, a Full Stack Developer with a strong interest in building modern, responsive, and scalable web applications. I enjoy working across the stack — from creating clean user interfaces with React to developing reliable backend services using Java, REST APIs, and SQL databases. I like turning real-world problems into simple, efficient software solutions that users can actually enjoy using.
</p>
                <br/>
                <p className='text-xl'>I have hands-on experience building full-stack projects such as portfolio websites, dashboards, and CRUD-based web applications with API and database integration. I focus on writing clean, maintainable code and following best practices. Currently, I’m strengthening my backend fundamentals, learning system design basics, and preparing for software engineering roles in product-based companies.</p>
            
        </div>
    </div>
  )
}

export default About;