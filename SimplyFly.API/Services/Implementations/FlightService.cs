using SimplyFly.API.Data;
using SimplyFly.API.DTOs;
using SimplyFly.API.Models;
using SimplyFly.API.Services.Interfaces;

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
                AvailableSeats = dto.TotalSeats
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
    }
}