namespace SimplyFly.API.Exceptions
{
    public sealed class FlightNotFoundException : DomainException
    {
        public FlightNotFoundException(int flightId)
            : base($"Flight with id {flightId} was not found.")
        {
        }
    }
}
