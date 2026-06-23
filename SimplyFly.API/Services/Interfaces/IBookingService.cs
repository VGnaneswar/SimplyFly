using SimplyFly.API.DTOs;
using SimplyFly.API.Models;
using System.Security.Claims;

namespace SimplyFly.API.Services
{
    public interface IBookingService
    {
        ApiResponse<object> BookFlight(BookFlightDto dto, ClaimsPrincipal user);

        ApiResponse<List<Booking>> GetBookingHistory(ClaimsPrincipal user);

        ApiResponse<string> CancelBooking(int id);
    }
}