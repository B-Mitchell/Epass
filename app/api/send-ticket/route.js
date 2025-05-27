import { Resend } from "resend";
import { PDFDocument, rgb } from 'pdf-lib';

export async function POST(req) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    try {
        const { email, ticketDetails, eventDetails, qrCodeUrl, uniqueTicketId } = await req.json();
        
        // Create PDF with QR code for paid tickets
        let pdfAttachment = null;
        if (ticketDetails.ticketPrice > 0 && qrCodeUrl) {
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([400, 400]);
            
            // Convert QR code data URL to bytes
            const qrCodeImageBytes = Buffer.from(qrCodeUrl.split(',')[1], 'base64');
            const qrCodeImage = await pdfDoc.embedPng(qrCodeImageBytes);
            
            // Add content to PDF
            const { width, height } = page.getSize();
            
            // Center-align all text
            const centerX = width / 2;
            
            // Header
            page.drawText('E-Pass Ticket', {
                x: centerX - 50,
                y: height - 40,
                size: 20,
                color: rgb(0, 0, 0)
            });
            
            // Event details in smaller, centered format
            const eventTitle = `Event: ${eventDetails.title}`;
            page.drawText(eventTitle, {
                x: centerX - (eventTitle.length * 3),
                y: height - 70,
                size: 10
            });
            
            const eventDate = `Date: ${eventDetails.date}`;
            page.drawText(eventDate, {
                x: centerX - (eventDate.length * 3),
                y: height - 90,
                size: 10
            });
            
            const eventTime = `Time: ${eventDetails.startTime} - ${eventDetails.endTime}`;
            page.drawText(eventTime, {
                x: centerX - (eventTime.length * 3),
                y: height - 110,
                size: 10
            });
            
            // Draw QR code in the center
            const qrCodeSize = 200; // Larger QR code
            const qrCodeDims = qrCodeImage.scale(qrCodeSize / qrCodeImage.width);
            page.drawImage(qrCodeImage, {
                x: (width - qrCodeDims.width) / 2,
                y: (height - qrCodeDims.height) / 2 - 20,
                width: qrCodeDims.width,
                height: qrCodeDims.height
            });
            
            // Ticket ID at the bottom
            const ticketIdText = `Ticket ID: ${uniqueTicketId}`;
            page.drawText(ticketIdText, {
                x: centerX - (ticketIdText.length * 3),
                y: 40,
                size: 10
            });
            
            const pdfBytes = await pdfDoc.save();
            pdfAttachment = Buffer.from(pdfBytes);
        }

        // Prepare email content with improved styling
        const emailContent = {
            from: 'E-Pass <tickets@e-pass.xyz>',
            to: email,
            subject: `🎫 Your Ticket for ${eventDetails.title}`,
            html: `
              <!DOCTYPE html>
              <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Your E-Pass Ticket</title>
              </head>
              <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
                  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                      <!-- Header -->
                      <div style="background: linear-gradient(135deg, #FFC0CB 0%, #ff69b4 100%); padding: 30px 20px; text-align: center;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                              🎫 E-Pass
                          </h1>
                          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                              Your Digital Ticket
                          </p>
                      </div>
                      
                      <!-- Main Content -->
                      <div style="padding: 40px 30px;">
                          <!-- Success Message -->
                          <div style="text-align: center; margin-bottom: 30px;">
                              <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                                  <strong>✅ Ticket Confirmed!</strong>
                                  <p style="margin: 5px 0 0 0;">Your ticket has been successfully generated.</p>
                              </div>
                          </div>
                          
                          <!-- Event Details Card -->
                          <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                              <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                                  ${eventDetails.title}
                              </h2>
                              
                              <div style="display: flex; flex-wrap: wrap; gap: 15px;">
                                  <div style="flex: 1; min-width: 200px;">
                                      <div style="display: flex; align-items: center; margin-bottom: 12px;">
                                          <span style="background-color: #FFC0CB; color: #ffffff; padding: 6px 8px; border-radius: 6px; font-size: 12px; margin-right: 10px;">📅</span>
                                          <div>
                                              <strong style="color: #495057;">Date:</strong>
                                              <span style="color: #6c757d; margin-left: 5px;">${eventDetails.date || 'TBA'}</span>
                                          </div>
                                      </div>
                                      
                                      <div style="display: flex; align-items: center; margin-bottom: 12px;">
                                          <span style="background-color: #FFC0CB; color: #ffffff; padding: 6px 8px; border-radius: 6px; font-size: 12px; margin-right: 10px;">⏰</span>
                                          <div>
                                              <strong style="color: #495057;">Time:</strong>
                                              <span style="color: #6c757d; margin-left: 5px;">${eventDetails.startTime || 'TBA'} - ${eventDetails.endTime || 'TBA'}</span>
                                          </div>
                                      </div>
                                      
                                      <div style="display: flex; align-items: center;">
                                          <span style="background-color: #FFC0CB; color: #ffffff; padding: 6px 8px; border-radius: 6px; font-size: 12px; margin-right: 10px;">📍</span>
                                          <div>
                                              <strong style="color: #495057;">Location:</strong>
                                              <span style="color: #6c757d; margin-left: 5px;">${eventDetails.address || 'TBA'}</span>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                          
                          <!-- Ticket Details Card -->
                          <div style="background: linear-gradient(135deg, #fff5f8 0%, #ffe8f0 100%); border: 2px solid #FFC0CB; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                              <h3 style="color: #d63384; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center;">
                                  🎟️ Ticket Details
                              </h3>
                              
                              <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                                      <div>
                                          <strong style="color: #495057;">Ticket Type:</strong>
                                          <div style="color: #6c757d; font-size: 16px;">${ticketDetails.ticketName}</div>
                                      </div>
                                      <div>
                                          <strong style="color: #495057;">Quantity:</strong>
                                          <div style="color: #6c757d; font-size: 16px;">${ticketDetails.quantity || 1}</div>
                                      </div>
                                  </div>
                                  
                                  <div style="border-top: 1px solid #e9ecef; padding-top: 15px;">
                                      <div style="display: flex; justify-content: space-between; align-items: center;">
                                          <strong style="color: #495057; font-size: 18px;">Total Price:</strong>
                                          <span style="color: #28a745; font-size: 20px; font-weight: bold;">
                                              ${ticketDetails.ticketPrice === 0 ? 'FREE' : `NGN ${ticketDetails.ticketPrice.toLocaleString()}`}
                                          </span>
                                      </div>
                                  </div>
                                  
                                  ${uniqueTicketId ? `
                                  <div style="border-top: 1px solid #e9ecef; padding-top: 15px; margin-top: 15px;">
                                      <strong style="color: #495057;">Ticket ID:</strong>
                                      <div style="font-family: 'Courier New', monospace; background-color: #f8f9fa; padding: 8px; border-radius: 4px; font-size: 12px; color: #6c757d; margin-top: 5px;">
                                          ${uniqueTicketId}
                                      </div>
                                  </div>
                                  ` : ''}
                              </div>
                          </div>
                          
                          ${ticketDetails.ticketPrice === 0 ? `
                          <!-- Free Ticket Message -->
                          <div style="background-color: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
                              <p style="margin: 0; font-size: 14px;">
                                  🎉 This is a <strong>FREE</strong> ticket! No QR code is required for entry.
                              </p>
                          </div>
                          ` : `
                          <!-- Paid Ticket Message -->
                          <div style="text-align: center; background-color: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
                              <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 18px;">Your Entry QR Code</h3>
                              <p style="color: #6c757d; margin: 15px 0; font-size: 14px;">
                                  Please find your QR code in the attached PDF. Present this QR code at the event entrance.
                              </p>
                          </div>
                          `}
                          
                          <!-- Important Notes -->
                          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                              <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">📋 Important Notes:</h4>
                              <ul style="color: #856404; margin: 0; padding-left: 20px;">
                                  <li style="margin-bottom: 5px;">Arrive at least 30 minutes before the event starts</li>
                                  <li style="margin-bottom: 5px;">Keep this email handy for entry verification</li>
                                  <li style="margin-bottom: 5px;">Contact support if you encounter any issues</li>
                                  ${ticketDetails.ticketPrice > 0 ? '<li>Keep the attached PDF with QR code safe</li>' : ''}
                              </ul>
                          </div>
                      </div>
                      
                      <!-- Footer -->
                      <div style="background-color: #2c3e50; color: #ffffff; padding: 30px; text-align: center;">
                          <h3 style="margin: 0 0 15px 0; font-size: 18px;">Thank you for choosing E-Pass!</h3>
                          <p style="margin: 0 0 20px 0; font-size: 14px; opacity: 0.8;">
                              We hope you have an amazing experience at the event.
                          </p>
                          
                          <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px; margin-top: 20px;">
                              <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                                  Need help? Contact us at <a href="mailto:support@e-pass.xyz" style="color: #FFC0CB;">support@e-pass.xyz</a>
                              </p>
                              <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.7;">
                                  © 2024 E-Pass. All rights reserved.
                              </p>
                          </div>
                      </div>
                  </div>
              </body>
              </html>
            `
        };

        // Add PDF attachment for paid tickets
        if (pdfAttachment) {
            emailContent.attachments = [{
                filename: `ticket-${uniqueTicketId}.pdf`,
                content: pdfAttachment,
                contentType: 'application/pdf',
            }];
        }

        const { data, error } = await resend.emails.send(emailContent);

        if (error) {
            console.error("Resend API error:", error);
            return new Response(
                JSON.stringify({ error: error.message }), 
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        return new Response(
            JSON.stringify({ success: true, data }), 
            { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.error("Server error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }), 
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}