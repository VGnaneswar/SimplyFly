namespace SimplyFly.API.Exceptions
{
    public class InvalidPaymentDetailsException : DomainException
    {
        public InvalidPaymentDetailsException(string message)
            : base(message)
        {
        }
    }
}
