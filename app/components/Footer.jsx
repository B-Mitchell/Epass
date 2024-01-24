import React from 'react';
import twitterImage from '../../public/images/twitter.png'
import facebookImage from '../../public/images/facebook.png'
import instagramImage from '../../public/images/instagram.png'
import Image from 'next/image';
const Footer = () => {
  return (
    <footer className="bg-[#E0BFB8] mt-5 p-5">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold mb-2">Contact Us</h2>
            <p>Email: epass@gmail.com</p>
            <p>Phone: 09137768526</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Quick Links</h2>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/events">Events</a></li>
              <li><a href="/about">About Us</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Connect With Us</h2>
            <div className="flex space-x-4 justify-center">
            <a href="#" className="text-blue-500">
                <Image src={twitterImage} width={20} height={20} />
              </a>
              <a href="#" className="text-red-500">
                <Image src={facebookImage} width={20} height={20} />
              </a>
              <a href="#" className="text-purple-500">
                <Image src={instagramImage} width={20} height={20} />
              </a>
            </div>
          </div>
        </div>

        <hr className="my-4 border-gray-300" />

        <p className="text-center text-gray-600">
          &copy; {new Date().getFullYear()} Epass. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
