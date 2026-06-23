using System.ComponentModel.DataAnnotations;

namespace SimplyFly.API.DTOs
{
    public class AddFlightDto
    {
        [Required]
        public string FlightNumber { get; set; } = string.Empty;

        [Required]
        public string FlightName { get; set; } = string.Empty;

        [Required]
        public string Origin { get; set; } = string.Empty;

        [Required]
        public string Destination { get; set; } = string.Empty;

        [Required]
        public DateTime DepartureTime { get; set; }

        [Required]
        public DateTime ArrivalTime { get; set; }

        [Required]
        public decimal Fare { get; set; }

        [Required]
        public int TotalSeats { get; set; }
    }
}