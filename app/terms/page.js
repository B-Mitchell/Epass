'use client';
import React from 'react';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[200px] w-full bg-[#1E1E1E] flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white">Terms and Conditions</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-lg">
          <p className="text-gray-600 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-[#1E1E1E]">1. Introduction</h2>
            <p className="text-gray-600">
              Welcome to Epass Limited ("we," "our," or "us"). These Terms and Conditions govern your use of our E-pass platform and services. By accessing or using our services, you agree to be bound by these terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-[#1E1E1E]">2. Definitions</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>"Platform" refers to the E-pass website and mobile application</li>
              <li>"Services" refers to all services provided by Epass Limited</li>
              <li>"User" refers to any person or entity using our Platform</li>
              <li>"Event Organizer" refers to users who create and manage events</li>
              <li>"Attendee" refers to users who purchase tickets for events</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-[#1E1E1E]">3. Account Registration</h2>
            <p className="text-gray-600">
              To use our Services, you must register for an account. You agree to provide accurate and complete information and to keep this information updated. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-[#1E1E1E]">4. Ticket Sales and Fees</h2>
            <p className="text-gray-600">
              Epass Limited charges a 4% fee on all ticket sales. This fee is automatically added to the ticket price and is non-refundable. Event Organizers are responsible for setting ticket prices and ensuring compliance with all applicable laws.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-[#1E1E1E]">5. Refund Policy</h2>
            <p className="text-gray-600">
              All ticket sales are final and non-refundable. This policy applies to all circumstances, including but not limited to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
              <li>Event cancellation or postponement</li>
              <li>Change of event date, time, or venue</li>
              <li>Personal circumstances of the attendee</li>
              <li>Technical issues or errors</li>
            </ul>
            <p className="text-gray-600 mt-4">
              In the event of a cancelled event, the Event Organizer may, at their discretion, offer alternative arrangements or credits. Epass Limited is not responsible for any refunds or compensation.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-[#1E1E1E]">6. Event Organizer Responsibilities</h2>
            <p className="text-gray-600">
              Event Organizers are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
              <li>Accurate event information</li>
              <li>Compliance with all applicable laws and regulations</li>
              <li>Handling attendee inquiries and issues</li>
              <li>Providing necessary event access to ticket holders</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-[#1E1E1E]">7. Attendee Responsibilities</h2>
            <p className="text-gray-600">
              Attendees are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
              <li>Providing accurate information when purchasing tickets</li>
              <li>Keeping their ticket secure and not sharing it with others</li>
              <li>Arriving on time for the event</li>
              <li>Following event rules and regulations</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-[#1E1E1E]">8. Intellectual Property</h2>
            <p className="text-gray-600">
              All content on the Platform, including logos, designs, and software, is the property of Epass Limited and is protected by intellectual property laws. Users may not use our content without express written permission.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-[#1E1E1E]">9. Limitation of Liability</h2>
            <p className="text-gray-600">
              Epass Limited is not liable for any indirect, incidental, or consequential damages arising from the use of our Services. Our liability is limited to the amount paid for the specific ticket or service in question.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-[#1E1E1E]">10. Changes to Terms</h2>
            <p className="text-gray-600">
              We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to the Platform. Continued use of our Services after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-[#1E1E1E]">11. Governing Law</h2>
            <p className="text-gray-600">
              These Terms are governed by the laws of Nigeria. Any disputes shall be resolved in the courts of Nigeria.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-[#1E1E1E]">12. Contact Information</h2>
            <p className="text-gray-600">
              For questions about these Terms, please contact us at:
              <br />
              Email: support@epass.com
              <br />
              Phone: [Your Contact Number]
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage; 