package com.eventhub.dto.response;

import java.util.List;

public class EventWithTicketsResponse {
    private EventResponse event;
    private List<TicketResponse> tickets;

    public EventWithTicketsResponse() {}

    public EventResponse getEvent() { return event; }
    public void setEvent(EventResponse event) { this.event = event; }
    public List<TicketResponse> getTickets() { return tickets; }
    public void setTickets(List<TicketResponse> tickets) { this.tickets = tickets; }
}