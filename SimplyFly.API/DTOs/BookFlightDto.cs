using System.ComponentModel.DataAnnotations;

namespace SimplyFly.API.DTOs
{
    public class BookFlightDto
    {
        [Required]
        public int FlightId { get; set; }

        [Required]
        public string SeatNumber { get; set; } = string.Empty;
    }
}