namespace SimplyFly.API.Models
{
    public class Flight
    {
        public int Id { get; set; }

        public string FlightNumber { get; set; } = string.Empty;

        public string FlightName { get; set; } = string.Empty;

        public string Origin { get; set; } = string.Empty;

        public string Destination { get; set; } = string.Empty;

        public DateTime DepartureTime { get; set; }

        public DateTime ArrivalTime { get; set; }

        public decimal Fare { get; set; }

        public int TotalSeats { get; set; }

        public int AvailableSeats { get; set; }

        public int? FlightOwnerId { get; set; }

        public User? FlightOwner { get; set; }

        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}
