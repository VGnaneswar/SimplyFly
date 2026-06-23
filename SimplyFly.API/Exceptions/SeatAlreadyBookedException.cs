namespace SimplyFly.API.Exceptions
{
    public sealed class SeatAlreadyBookedException : DomainException
    {
        public SeatAlreadyBookedException(string seatNumber)
            : base($"Seat {seatNumber} is already booked.")
        {
        }
    }
}
