namespace SimplyFly.API.DTOs
{
    public class PaymentSummaryDto
    {
        public int Id { get; set; }

        public int BookingId { get; set; }

        public string PassengerName { get; set; } = string.Empty;

        public int FlightId { get; set; }

        public string FlightNumber { get; set; } = string.Empty;

        public decimal Amount { get; set; }

        public DateTime PaymentDate { get; set; }

        public string Status { get; set; } = string.Empty;
    }
}
