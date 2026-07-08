using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SimplyFly.API.DTOs;
using SimplyFly.API.Models;
using SimplyFly.API.Services;
using SimplyFly.API.Services.Interfaces;
using System.Security.Claims;

namespace SimplyFly.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookingsController : ControllerBase
    {
        private readonly IBookingService _bookingService;

        public BookingsController(IBookingService bookingService)
        {
            _bookingService = bookingService;
        }


        /// <summary>
        /// Books a flight for the logged-in passenger
        /// </summary>
        
        [Authorize(Roles = "Passenger")]
        [HttpPost]
        public IActionResult BookFlight(BookFlightDto dto)
        {
            var result = _bookingService.BookFlight(dto, User);

            return Ok(result);
        }

        /// <summary>
        /// Gets the seat map for a flight so passengers can pick multiple seats.
        /// </summary>
        [AllowAnonymous]
        [HttpGet("flight/{flightId}/seats")]
        public IActionResult GetSeatMap(int flightId)
        {
            var result = _bookingService.GetSeatMap(flightId);

            return Ok(result);
        }

        /// <summary>
        /// Get all booking history for the logged-in passenger
        /// </summary>

        [Authorize(Roles = "Passenger")]
        [HttpGet("history")]
        public IActionResult GetBookingHistory()
        {
            var result = _bookingService.GetBookingHistory(User);

            return Ok(result);
        }

        [Authorize(Roles = "Passenger")]
        [HttpGet("{id}")]
        public IActionResult GetBookingDetails(int id)
        {
            var result = _bookingService.GetBookingDetails(id, User);

            return Ok(result);
        }

        /// <summary>
        /// Cancels a booking for the logged-in passenger. Only bookings with status "Booked" can be cancelled.
        /// </summary>
        [Authorize(Roles = "Passenger")]
        [HttpPut("cancel/{id}")]
        public IActionResult CancelBooking(int id)
        {
            var result = _bookingService.CancelBooking(id);

            return Ok(result);
        }
    }
}
