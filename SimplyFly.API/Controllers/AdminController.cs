using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SimplyFly.API.Services.Interfaces;

namespace SimplyFly.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IBookingService _bookingService;
        private readonly IPaymentService _paymentService;

        public AdminController(
            IUserService userService,
            IBookingService bookingService,
            IPaymentService paymentService)
        {
            _userService = userService;
            _bookingService = bookingService;
            _paymentService = paymentService;
        }

        [HttpGet("users")]
        public IActionResult GetAllUsers()
        {
            var result = _userService.GetAllUsers();
            return Ok(result);
        }

        [HttpGet("bookings")]
        public IActionResult GetAllBookings()
        {
            var result = _bookingService.GetAllBookings();
            return Ok(result);
        }

        [HttpGet("payments")]
        public IActionResult GetAllPayments()
        {
            var result = _paymentService.GetAllPayments();
            return Ok(result);
        }
    }
}
