export type TicketTypeInput = {
  name: string;
  priceCents: number;
  quantity: number;
};

export type TicketType = {
  id: string;
  name: string;
  priceCents: number;
  quantity: number;
  soldCount: number;
  available: number;
  eventSlug: string | null;
};

export type Ticket = {
  id: string;
  ticketCode: string;
  eventSlug: string;
  eventTitle: string;
  ticketTypeName: string;
  venue: string;
  eventDay: string;
  eventTime: string;
  buyerEmail: string;
  status: string;
};
