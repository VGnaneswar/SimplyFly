using AutoMapper;
using SimplyFly.API.Data;
using SimplyFly.API.DTOs;
using SimplyFly.API.Helpers;
using SimplyFly.API.Models;
using SimplyFly.API.Services.Interfaces;

namespace SimplyFly.API.Services.Implementations
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IMapper _mapper;

        public UserService(
            ApplicationDbContext context,
            IConfiguration configuration,
            IMapper mapper)
        {
            _context = context;
            _configuration = configuration;
            _mapper = mapper;
        }

        public ApiResponse<User> Register(RegisterUserDto dto)
        {
            var user = _mapper.Map<User>(dto);

            user.PasswordHash =PasswordHelper.HashPassword(dto.Password);

            _context.Users.Add(user);
            _context.SaveChanges();

            return new ApiResponse<User>
            {
                Success = true,
                Message = "User Registered Successfully",
                Data = user
            };
        }

        public ApiResponse<object> Login(LoginUserDto dto)
        {
            var user = _context.Users.FirstOrDefault(u => u.Email == dto.Email);

            if (user == null)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Invalid Email or Password",
                    Data = null
                };
            }


            bool isValidPassword =
                PasswordHelper.VerifyPassword(
                    user.PasswordHash,
                    dto.Password);

            if (!isValidPassword)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Invalid Email or Password",
                    Data = null
                };
            }

            var token =
                JwtHelper.GenerateToken(user, _configuration);

            return new ApiResponse<object>
            {
                Success = true,
                Message = "Login Successful",
                Data = new
                {
                    Token = token
                }
            };
        }
    }
}