using SimplyFly.API.DTOs;
using SimplyFly.API.Models;
using System.Security.Claims;

namespace SimplyFly.API.Services.Interfaces
{
    public interface IBookingService
    {
        ApiResponse<object> BookFlight(BookFlightDto dto, ClaimsPrincipal user);

        ApiResponse<FlightSeatMapDto> GetSeatMap(int flightId);

        ApiResponse<List<Booking>> GetBookingHistory(ClaimsPrincipal user);

        ApiResponse<BookingDetailsDto> GetBookingDetails(int id, ClaimsPrincipal user);

        ApiResponse<List<BookingSummaryDto>> GetAllBookings();

        ApiResponse<string> CancelBooking(int id);

        void ExpireUnpaidBookings();
    }
}
