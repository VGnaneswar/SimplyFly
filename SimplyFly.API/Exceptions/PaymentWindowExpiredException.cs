namespace SimplyFly.API.Exceptions
{
    public class PaymentWindowExpiredException : DomainException
    {
        public PaymentWindowExpiredException(int bookingId)
            : base($"Payment window expired for booking {bookingId}. The booking has been cancelled.")
        {
        }
    }
}
