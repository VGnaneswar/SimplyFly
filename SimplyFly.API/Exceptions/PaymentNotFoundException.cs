namespace SimplyFly.API.Exceptions
{
    public sealed class PaymentNotFoundException : DomainException
    {
        public PaymentNotFoundException(int bookingId)
            : base($"Payment record for booking {bookingId} was not found.")
        {
        }
    }
}
