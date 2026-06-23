namespace SimplyFly.API.Exceptions
{
    public sealed class BookingNotFoundException : DomainException
    {
        public BookingNotFoundException(int bookingId)
            : base($"Booking with id {bookingId} was not found.")
        {
        }
    }
}
