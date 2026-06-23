using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SimplyFly.API.Data;
using SimplyFly.API.DTOs;
using SimplyFly.API.Helpers;
using SimplyFly.API.Models;
using System.Data;
using AutoMapper;
using SimplyFly.API.Services.Interfaces;

namespace SimplyFly.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }
        /// <summary>
        /// Registers a new user in the system
        /// </summary>
        /// <param name="dto">User registration details</param>
        /// <returns>Returns created user details</returns>
        
        
        [HttpPost("register")]
        public IActionResult Register(RegisterUserDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = _userService.Register(dto);

            return Ok(result);
        }


        /// <summary>
        /// Authenticates a user and generates JWT token
        /// </summary>
        /// <param name="dto">User login credentials</param>
        /// <returns>Returns JWT token if login is successful</returns>
        [HttpPost("login")]
        public IActionResult Login(LoginUserDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = _userService.Login(dto);

            return Ok(result);
        }

        [Authorize]
        [HttpGet("profile")]
        public IActionResult GetProfile()
        {
            return Ok("Protected Profile Data");
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("admin-dashboard")]
        public IActionResult AdminDashboard()
        {
            return Ok("Welcome Admin");
        }
        [Authorize(Roles = "FlightOwner")]
        [HttpGet("flight-owner-dashboard")]
        public IActionResult FlightOwnerDashboard()
        {
            return Ok("Welcome Flight Owner");
        }
        [Authorize(Roles = "Passenger")]
        [HttpGet("passenger-dashboard")]
        public IActionResult PassengerDashboard()
        {
            return Ok("Welcome Passenger");
        }
    }
}