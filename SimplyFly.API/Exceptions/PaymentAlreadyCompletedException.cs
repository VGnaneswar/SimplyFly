namespace SimplyFly.API.Exceptions
{
    public sealed class PaymentAlreadyCompletedException : DomainException
    {
        public PaymentAlreadyCompletedException(int bookingId)
            : base($"Payment for booking {bookingId} is already completed.")
        {
        }
    }
}
