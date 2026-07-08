namespace SimplyFly.API.DTOs
{
    public class BookingSummaryDto
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public string PassengerName { get; set; } = string.Empty;

        public int FlightId { get; set; }

        public string FlightNumber { get; set; } = string.Empty;

        public string FlightName { get; set; } = string.Empty;

        public string SeatNumber { get; set; } = string.Empty;

        public DateTime BookingDate { get; set; }

        public DateTime? PaymentDeadline { get; set; }

        public string Status { get; set; } = string.Empty;
    }
}
