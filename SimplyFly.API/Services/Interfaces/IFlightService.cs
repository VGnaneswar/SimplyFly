using SimplyFly.API.DTOs;
using SimplyFly.API.Models;

namespace SimplyFly.API.Services.Interfaces
{
    public interface IFlightService
    {
        ApiResponse<Flight> AddFlight(AddFlightDto dto);

        ApiResponse<object> GetAllFlights(
            int pageNumber,
            int pageSize,
            string? origin,
            string? sortBy);

        ApiResponse<List<Flight>> SearchFlights(
            string origin,
            string destination,
            DateTime date);
    }
}
