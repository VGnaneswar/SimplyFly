using SimplyFly.API.DTOs;
using SimplyFly.API.Models;

namespace SimplyFly.API.Services.Interfaces
{
    public interface IUserService
    {
        ApiResponse<User> Register(RegisterUserDto dto);

        ApiResponse<object> Login(LoginUserDto dto);

        ApiResponse<List<UserSummaryDto>> GetAllUsers();
    }
}
