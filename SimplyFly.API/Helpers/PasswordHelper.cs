using Microsoft.AspNetCore.Identity;

namespace SimplyFly.API.Helpers
{
    public static class PasswordHelper
    {
        private static readonly PasswordHasher<string> _hasher
            = new PasswordHasher<string>();

        public static string HashPassword(string password)
        {
            return _hasher.HashPassword(null!, password);
        }

        public static bool VerifyPassword(
            string hashedPassword,
            string password)
        {
            var result = _hasher.VerifyHashedPassword(
                null!,
                hashedPassword,
                password);

            return result == PasswordVerificationResult.Success;
        }
    }
}