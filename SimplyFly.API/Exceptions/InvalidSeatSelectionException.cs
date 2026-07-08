namespace SimplyFly.API.Exceptions
{
    public sealed class InvalidSeatSelectionException : DomainException
    {
        public InvalidSeatSelectionException()
            : base("Please select at least one seat.")
        {
        }
    }
}