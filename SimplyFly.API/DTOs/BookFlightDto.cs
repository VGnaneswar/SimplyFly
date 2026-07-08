using System.ComponentModel.DataAnnotations;

namespace SimplyFly.API.DTOs
{
    public class BookFlightDto
    {
        public int FlightId { get; set; }

        public string SeatNumber { get; set; } = string.Empty;

        public List<string> SeatNumbers { get; set; } = new List<string>();
    }
}