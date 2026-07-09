using System.ComponentModel.DataAnnotations;

namespace SimplyFly.API.DTOs
{
    public class RegisterUserDto
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [RegularExpression(@"^[^@\s]+@gmail\.com$", ErrorMessage = "Email must be a Gmail address.")]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public string Role { get; set; } = string.Empty;
    }
}
