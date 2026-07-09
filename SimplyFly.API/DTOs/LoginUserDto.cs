using System.ComponentModel.DataAnnotations;

namespace SimplyFly.API.DTOs
{
    public class LoginUserDto
    {
        [Required]
        [EmailAddress]
        [RegularExpression(@"^[^@\s]+@gmail\.com$", ErrorMessage = "Email must be a Gmail address.")]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }
}
