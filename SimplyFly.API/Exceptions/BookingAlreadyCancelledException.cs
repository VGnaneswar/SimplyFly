namespace SimplyFly.API.Exceptions
{
    public sealed class BookingAlreadyCancelledException : DomainException
    {
        public BookingAlreadyCancelledException(int bookingId)
            : base($"Booking {bookingId} is already cancelled.")
        {
        }
    }
}
