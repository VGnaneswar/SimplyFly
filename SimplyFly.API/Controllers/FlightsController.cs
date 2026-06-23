using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SimplyFly.API.DTOs;
using SimplyFly.API.Services.Interfaces;
using System.Globalization;

namespace SimplyFly.API.Controllers
{
    [ApiVersion("1.0")]
    [Route("api/[controller]")]
    [ApiController]
    public class FlightsController : ControllerBase
    {
        private readonly IFlightService _flightService;

        public FlightsController(IFlightService flightService)
        {
            _flightService = flightService;
        }

        /// <summary>
        /// Adds a new flight
        /// </summary>


        [Authorize(Roles = "Admin,FlightOwner")]
        [HttpPost]
        public IActionResult AddFlight(AddFlightDto dto)
        {
            var result = _flightService.AddFlight(dto);

            return Ok(result);
        }

        [AllowAnonymous]
        [HttpGet]
        public IActionResult GetAllFlights(
            int pageNumber = 1,
            int pageSize = 5,
            string? origin = null,
            string? sortBy = null)
        {
            var result = _flightService.GetAllFlights(
                pageNumber,
                pageSize,
                origin,
                sortBy);

            return Ok(result);
        }

        [AllowAnonymous]
        [HttpGet("search")]
        public IActionResult SearchFlights(
            string origin,
            string destination,
            DateTime date)
        {
            var result = _flightService.SearchFlights(
                origin,
                destination,
                date);

            return Ok(result);
        }
    }
}