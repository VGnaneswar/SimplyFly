namespace SimplyFly.API.DTOs
{
    public class FlightSeatMapDto
    {
        public int FlightId { get; set; }

        public string FlightNumber { get; set; } = string.Empty;

        public string FlightName { get; set; } = string.Empty;

        public int TotalSeats { get; set; }

        public int AvailableSeats { get; set; }

        public List<string> BookedSeats { get; set; } = new List<string>();
    }
}