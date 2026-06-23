using System.ComponentModel.DataAnnotations;

namespace SimplyFly.API.DTOs
{
    public class MakePaymentDto
    {
        [Required]
        public int BookingId { get; set; }
    }
}
