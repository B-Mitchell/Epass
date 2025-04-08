'use client';
import React from 'react';
import Image from 'next/image';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Parallax Effect */}
      <div className="relative h-[500px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50 z-10" />
        <Image
          src="/about-hero.jpg"
          alt="About Us"
          fill
          className="object-cover transform scale-105 hover:scale-100 transition-transform duration-700"
          priority
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">About Epass Limited</h1>
          <p className="text-xl text-white/90 max-w-2xl">Revolutionizing event experiences across Africa through E-pass, our innovative ticketing solution</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        {/* Vision & Mission */}
        <section className="mb-20">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-[#1E1E1E] p-8 rounded-xl text-white">
              <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
              <p className="text-lg leading-relaxed">
                To become the most trusted and innovative event ticketing platform globally through E-pass, 
                connecting people with unforgettable experiences while ensuring security, 
                convenience, and transparency in every transaction.
              </p>
            </div>
            <div className="bg-[#8B5E3C] p-8 rounded-xl text-white">
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg leading-relaxed">
                To provide a seamless, secure, and user-friendly platform through E-pass that empowers 
                event organizers and enhances the experience of event attendees through 
                innovative technology and exceptional service.
              </p>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center text-[#1E1E1E]">Our Services</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 border rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-[#8B5E3C] rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">E-pass Ticketing</h3>
              <p className="text-gray-600">
                Secure and efficient ticket sales through E-pass for events of all sizes, from local gatherings to major concerts.
              </p>
            </div>
            <div className="p-8 border rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-[#8B5E3C] rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">E-pass Management</h3>
              <p className="text-gray-600">
                Comprehensive tools through E-pass for event organizers to manage their events, track sales, and engage with attendees.
              </p>
            </div>
            <div className="p-8 border rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-[#8B5E3C] rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Customer Support</h3>
              <p className="text-gray-600">
                24/7 dedicated support to ensure smooth experiences for both organizers and attendees using E-pass.
              </p>
            </div>
          </div>
        </section>

        {/* Team */}
        <section>
          <h2 className="text-4xl font-bold mb-12 text-center text-[#1E1E1E]">Meet Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden border-4 border-[#8B5E3C] group-hover:border-[#1E1E1E] transition-colors duration-300">
                <Image
                  src="/team-1.jpg"
                  alt="Olofinsawe Samuel"
                  width={160}
                  height={160}
                  className="object-cover w-full h-full"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">Olofinsawe Samuel</h3>
              <p className="text-[#8B5E3C] font-medium">CEO & Founder</p>
            </div>
            <div className="text-center group">
              <div className="w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden border-4 border-[#8B5E3C] group-hover:border-[#1E1E1E] transition-colors duration-300">
                <Image
                  src="/team-2.jpg"
                  alt="Mitchell Onuorah"
                  width={160}
                  height={160}
                  className="object-cover w-full h-full"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">Mitchell Onuorah</h3>
              <p className="text-[#8B5E3C] font-medium">CTO & Co-Founder</p>
            </div>
            <div className="text-center group">
              <div className="w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden border-4 border-[#8B5E3C] group-hover:border-[#1E1E1E] transition-colors duration-300">
                <Image
                  src="/team-3.jpg"
                  alt="Clinton Odira"
                  width={160}
                  height={160}
                  className="object-cover w-full h-full"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">Clinton Odira</h3>
              <p className="text-[#8B5E3C] font-medium">Chief Marketing & Co-Founder</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage; 