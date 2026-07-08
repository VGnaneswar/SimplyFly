using System.ComponentModel.DataAnnotations;

namespace SimplyFly.API.DTOs
{
    public class MakePaymentDto
    {
        public int BookingId { get; set; }

        public List<int> BookingIds { get; set; } = new();

        [Required]
        public string PaymentMethod { get; set; } = string.Empty;

        public string? CardHolderName { get; set; }

        public string? CardNumber { get; set; }

        public string? UpiId { get; set; }
    }
}
