using System.ComponentModel.DataAnnotations;

namespace SimplyFly.API.Models
{
    public class Booking
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }

        public int FlightId { get; set; }

        public string SeatNumber { get; set; } = string.Empty;

        public DateTime BookingDate { get; set; }

        public string Status { get; set; } = "PendingPayment";

        public User? User { get; set; }

        public Flight? Flight { get; set; }

        public Payment? Payment { get; set; }
    }
}
