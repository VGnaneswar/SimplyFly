namespace SimplyFly.API.Exceptions
{
    public sealed class NoSeatsAvailableException : DomainException
    {
        public NoSeatsAvailableException(int flightId)
            : base($"No seats are available for flight {flightId}.")
        {
        }
    }
}
