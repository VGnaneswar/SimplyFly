using SimplyFly.API.DTOs;
using SimplyFly.API.Models;
using System.Security.Claims;

namespace SimplyFly.API.Services.Interfaces
{
    public interface IFlightService
    {
        ApiResponse<Flight> AddFlight(AddFlightDto dto);

        ApiResponse<Flight> AddFlight(AddFlightDto dto, ClaimsPrincipal? user);

        ApiResponse<Flight> UpdateFlight(int id, UpdateFlightDto dto, ClaimsPrincipal user);

        ApiResponse<object> GetAllFlights(
            int pageNumber,
            int pageSize,
            string? origin,
            string? sortBy);

        ApiResponse<List<Flight>> SearchFlights(
            string origin,
            string destination,
            DateTime date);

        ApiResponse<List<BookingSummaryDto>> GetBookingsForFlight(int flightId, ClaimsPrincipal user);
    }
}
