import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
    try {
        const { email, ticketDetails, eventDetails, qrCodeUrl } = await req.json();
        
        // Prepare email content
        const emailContent = {
            from: 'E-Pass <tickets@e-pass.xyz>',
            to: email,
            subject: `Your Ticket for ${eventDetails.title}`,
            html: `
              <div>
                <h1>Your Ticket for ${eventDetails.title}</h1>
                <p>Event Details:</p>
                <ul>
                  <li>Date: ${eventDetails.date}</li>
                  <li>Time: ${eventDetails.startTime} - ${eventDetails.endTime}</li>
                  <li>Location: ${eventDetails.address}</li>
                </ul>
                <p>Ticket Details:</p>
                <ul>
                  <li>Ticket Type: ${ticketDetails.ticketName}</li>
                  <li>Quantity: ${ticketDetails.quantity}</li>
                  <li>Price: ${ticketDetails.ticketPrice === 0 ? 'Free' : `NGN ${ticketDetails.ticketPrice}`}</li>
                </ul>
                ${ticketDetails.ticketPrice === 0 
                  ? '<p>This is a free ticket. Please show this email at the event entrance.</p>'
                  : '<p>Please find your QR code attached to this email. You will need to show this QR code at the event entrance.</p>'
                }
                <p>Thank you for registering!</p>
              </div>
            `
        };

        // Add QR code attachment only if it exists (paid tickets)
        if (qrCodeUrl) {
            const qrCodeBuffer = Buffer.from(qrCodeUrl.split(',')[1], "base64");
            emailContent.attachments = [{
                filename: 'ticket-qr.png',
                content: qrCodeBuffer,
            }];
        }

        const { data, error } = await resend.emails.send(emailContent);

        if (error) {
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
        return new Response(
            JSON.stringify({ error: error.message }), 
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}