export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { uniqueTicketId } = req.body;
    if (!uniqueTicketId) {
      return res.status(400).json({ error: 'Missing ticket ID' });
    }
  
    const { data, error } = await supabase.rpc('mark_ticket_used', {
      p_unique_ticket_id: uniqueTicketId,
    });
  
    if (error) {
      console.error('Error verifying ticket:', error);
      return res.status(500).json({ error: 'Failed to verify ticket' });
    }
    if (!data) {
      return res.status(400).json({ error: 'Ticket already used or invalid' });
    }
  
    return res.status(200).json({ message: 'Ticket verified' });
  }