using Microsoft.EntityFrameworkCore;
using SimplyFly.API.Data;
using SimplyFly.API.DTOs;
using SimplyFly.API.Exceptions;
using SimplyFly.API.Models;
using SimplyFly.API.Services.Interfaces;
using System.Security.Claims;

namespace SimplyFly.API.Services.Implementations
{
    public class FlightService : IFlightService
    {
        private readonly ApplicationDbContext _context;

        public FlightService(ApplicationDbContext context)
        {
            _context = context;
        }

        public ApiResponse<Flight> AddFlight(AddFlightDto dto)
        {
            return AddFlight(dto, null);
        }

        public ApiResponse<Flight> AddFlight(AddFlightDto dto, ClaimsPrincipal? user)
        {
            var flight = new Flight
            {
                FlightNumber = dto.FlightNumber,
                FlightName = dto.FlightName,
                Origin = dto.Origin,
                Destination = dto.Destination,
                DepartureTime = dto.DepartureTime,
                ArrivalTime = dto.ArrivalTime,
                Fare = dto.Fare,
                TotalSeats = dto.TotalSeats,
                AvailableSeats = dto.TotalSeats,
                FlightOwnerId = GetFlightOwnerId(user)
            };

            _context.Flights.Add(flight);
            _context.SaveChanges();

            return new ApiResponse<Flight>
            {
                Success = true,
                Message = "Flight Added Successfully",
                Data = flight
            };
        }

        public ApiResponse<Flight> UpdateFlight(int id, UpdateFlightDto dto, ClaimsPrincipal user)
        {
            var flight = _context.Flights.FirstOrDefault(f => f.Id == id);

            if (flight == null)
            {
                throw new FlightNotFoundException(id);
            }

            if (!CanManageFlight(user, flight))
            {
                return new ApiResponse<Flight>
                {
                    Success = false,
                    Message = "You can only edit your own flights."
                };
            }

            flight.FlightNumber = dto.FlightNumber;
            flight.FlightName = dto.FlightName;
            flight.Origin = dto.Origin;
            flight.Destination = dto.Destination;
            flight.DepartureTime = dto.DepartureTime;
            flight.ArrivalTime = dto.ArrivalTime;
            flight.Fare = dto.Fare;
            flight.TotalSeats = dto.TotalSeats;

            if (flight.AvailableSeats > dto.TotalSeats)
            {
                flight.AvailableSeats = dto.TotalSeats;
            }

            _context.SaveChanges();

            return new ApiResponse<Flight>
            {
                Success = true,
                Message = "Flight updated successfully",
                Data = flight
            };
        }

        public ApiResponse<object> GetAllFlights(
            int pageNumber,
            int pageSize,
            string? origin,
            string? sortBy)
        {
            var query = _context.Flights.AsQueryable();

            if (!string.IsNullOrEmpty(origin))
            {
                query = query.Where(f => f.Origin == origin);
            }

            if (!string.IsNullOrEmpty(sortBy))
            {
                query = sortBy.ToLower() switch
                {
                    "fare" => query.OrderBy(f => f.Fare),

                    "departure" => query.OrderBy(f => f.DepartureTime),

                    "fare_desc" => query.OrderByDescending(f => f.Fare),

                    _ => query
                };
            }
            else
            {
                query = query.OrderBy(f => f.Id);
            }

            var totalRecords = query.Count();

            var flights = query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new ApiResponse<object>
            {
                Success = true,
                Message = "Flights fetched successfully",
                Data = new
                {
                    TotalRecords = totalRecords,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    Flights = flights
                }
            };
        }

        public ApiResponse<List<Flight>> SearchFlights(
            string origin,
            string destination,
            DateTime date)
        {
            var flights = _context.Flights
                .Where(f =>
                    f.Origin == origin &&
                    f.Destination == destination &&
                    f.DepartureTime.Date == date.Date)
                .ToList();

            return new ApiResponse<List<Flight>>
            {
                Success = true,
                Message = "Flights fetched successfully",
                Data = flights
            };
        }

        public ApiResponse<List<BookingSummaryDto>> GetBookingsForFlight(int flightId, ClaimsPrincipal user)
        {
            var flight = _context.Flights.FirstOrDefault(f => f.Id == flightId);

            if (flight == null)
            {
                throw new FlightNotFoundException(flightId);
            }

            if (!CanManageFlight(user, flight))
            {
                return new ApiResponse<List<BookingSummaryDto>>
                {
                    Success = false,
                    Message = "You can only view bookings for your own flights.",
                    Data = new List<BookingSummaryDto>()
                };
            }

            var bookings = _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Flight)
                .Where(b => b.FlightId == flightId)
                .OrderByDescending(b => b.BookingDate)
                .Select(b => new BookingSummaryDto
                {
                    Id = b.Id,
                    UserId = b.UserId,
                    PassengerName = b.User != null ? b.User.FullName : string.Empty,
                    FlightId = b.FlightId,
                    FlightNumber = b.Flight != null ? b.Flight.FlightNumber : string.Empty,
                    FlightName = b.Flight != null ? b.Flight.FlightName : string.Empty,
                    SeatNumber = b.SeatNumber,
                    BookingDate = b.BookingDate,
                    Status = b.Status
                })
                .ToList();

            return new ApiResponse<List<BookingSummaryDto>>
            {
                Success = true,
                Message = "Flight bookings fetched successfully",
                Data = bookings
            };
        }

        private static int? GetFlightOwnerId(ClaimsPrincipal? user)
        {
            if (user == null || user.Identity?.IsAuthenticated != true || !user.IsInRole("FlightOwner"))
            {
                return null;
            }

            var userIdText = user.FindFirstValue(ClaimTypes.NameIdentifier);

            return int.TryParse(userIdText, out var userId) ? userId : null;
        }

        private static bool CanManageFlight(ClaimsPrincipal user, Flight flight)
        {
            if (user.IsInRole("Admin"))
            {
                return true;
            }

            if (!user.IsInRole("FlightOwner"))
            {
                return false;
            }

            var userIdText = user.FindFirstValue(ClaimTypes.NameIdentifier);

            return int.TryParse(userIdText, out var userId) &&
                   flight.FlightOwnerId.HasValue &&
                   flight.FlightOwnerId.Value == userId;
        }
    }
}
