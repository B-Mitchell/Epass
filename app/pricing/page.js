'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

const PricingPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[300px] w-full bg-[#1E1E1E] flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Simple, Transparent Pricing</h1>
          <p className="text-xl text-white/90">Choose the perfect plan for your event needs</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        {/* Pricing Section */}
        <div className="grid md:grid-cols-2 gap-12 mb-20">
          {/* Standard Plan */}
          <div className="border rounded-xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 text-[#1E1E1E]">Standard Plan</h2>
            <div className="mb-8">
              <span className="text-4xl font-bold text-[#8B5E3C]">4%</span>
              <span className="text-gray-600 ml-2">per ticket sale</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <svg className="w-6 h-6 text-[#8B5E3C] mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Secure ticket sales through E-pass</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-[#8B5E3C] mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Real-time sales tracking</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-[#8B5E3C] mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Basic event management tools</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-[#8B5E3C] mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Email support</span>
              </li>
            </ul>
            <button 
              onClick={() => router.push('/createAccount')}
              className="w-full bg-[#8B5E3C] text-white py-3 rounded-lg hover:bg-[#1E1E1E] transition-colors duration-300"
            >
              Get Started
            </button>
          </div>

          {/* Premium Services */}
          <div className="border rounded-xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 text-[#1E1E1E]">Premium Services</h2>
            <div className="mb-8">
              <span className="text-4xl font-bold text-[#8B5E3C]">Contact Us</span>
              <span className="text-gray-600 ml-2">for custom pricing</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <svg className="w-6 h-6 text-[#8B5E3C] mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Tag Production Services</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-[#8B5E3C] mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Professional Event Setup</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-[#8B5E3C] mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>On-site Ticket Validation</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-[#8B5E3C] mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Priority Support</span>
              </li>
            </ul>
            <button 
              onClick={() => router.push('/contact')}
              className="w-full bg-[#1E1E1E] text-white py-3 rounded-lg hover:bg-[#8B5E3C] transition-colors duration-300"
            >
              Contact Us
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center text-[#1E1E1E]">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">How is the 4% fee calculated?</h3>
              <p className="text-gray-600">
                The 4% fee is calculated on the total ticket price. For example, if a ticket costs ₦10,000, 
                the fee would be ₦400, making the total amount ₦10,400.
              </p>
            </div>
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">Are there any hidden fees?</h3>
              <p className="text-gray-600">
                No, there are no hidden fees. The 4% fee is the only charge for using our standard services. 
                Additional services like tag production and on-site validation are priced separately.
              </p>
            </div>
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">How do I get started with premium services?</h3>
              <p className="text-gray-600">
                Simply contact us through our contact form or email, and our team will get in touch with you 
                to discuss your specific needs and provide a customized quote.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage; 