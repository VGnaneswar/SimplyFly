using Microsoft.EntityFrameworkCore;
using SimplyFly.API.Data;
using SimplyFly.API.DTOs;
using SimplyFly.API.Exceptions;
using SimplyFly.API.Models;
using SimplyFly.API.Services.Interfaces;
using System.Security.Claims;

namespace SimplyFly.API.Services.Implementations
{
    public class BookingService : IBookingService
    {
        private readonly ApplicationDbContext _context;

        public BookingService(ApplicationDbContext context)
        {
            _context = context;
        }

        public ApiResponse<object> BookFlight(BookFlightDto dto, ClaimsPrincipal user)
        {
            var seatNumbers = ResolveSeatNumbers(dto);

            if (seatNumbers.Count == 0)
            {
                throw new InvalidSeatSelectionException();
            }

            var flight = _context.Flights
                .FirstOrDefault(f => f.Id == dto.FlightId);

            if (flight == null)
            {
                throw new FlightNotFoundException(dto.FlightId);
            }

            if (flight.AvailableSeats < seatNumbers.Count)
            {
                throw new NoSeatsAvailableException(dto.FlightId);
            }

            var existingSeats = _context.Bookings
                .Where(b => b.FlightId == dto.FlightId && b.Status != "Cancelled")
                .Select(b => b.SeatNumber)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var conflictingSeat = seatNumbers.FirstOrDefault(seat => existingSeats.Contains(seat));

            if (!string.IsNullOrWhiteSpace(conflictingSeat))
            {
                throw new SeatAlreadyBookedException(conflictingSeat);
            }

            var userId = int.Parse(
                user.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var transaction = _context.Database.IsRelational()
                ? _context.Database.BeginTransaction()
                : null;

            try
            {
                var bookings = new List<Booking>();

                foreach (var seatNumber in seatNumbers)
                {
                    bookings.Add(new Booking
                    {
                        UserId = userId,
                        FlightId = dto.FlightId,
                        SeatNumber = seatNumber,
                        BookingDate = DateTime.Now,
                        PaymentDeadline = DateTime.Now.AddMinutes(10),
                        Status = "PendingPayment"
                    });
                }

                flight.AvailableSeats -= seatNumbers.Count;

                _context.Bookings.AddRange(bookings);
                _context.SaveChanges();

                var payments = bookings.Select(booking => new Payment
                {
                    BookingId = booking.Id,
                    Amount = flight.Fare,
                    PaymentDate = DateTime.Now,
                    Status = "Pending"
                }).ToList();

                _context.Payments.AddRange(payments);
                _context.SaveChanges();

                transaction?.Commit();

                return new ApiResponse<object>
                {
                    Success = true,
                    Message = seatNumbers.Count == 1
                        ? "Booking created. Please complete payment to confirm booking."
                        : $"Booking created for {seatNumbers.Count} seats. Please complete payment to confirm booking.",
                    Data = new
                    {
                        BookingIds = bookings.Select(booking => booking.Id).ToList(),
                        FlightId = dto.FlightId,
                        SeatNumbers = seatNumbers,
                        BookingStatus = "PendingPayment",
                        PaymentIds = payments.Select(payment => payment.Id).ToList(),
                        Amount = flight.Fare,
                        TotalAmount = flight.Fare * seatNumbers.Count,
                        PaymentDeadline = bookings.First().PaymentDeadline,
                        PaymentStatus = "Pending"
                    }
                };
            }
            catch
            {
                transaction?.Rollback();
                throw;
            }
        }

        public ApiResponse<FlightSeatMapDto> GetSeatMap(int flightId)
        {
            var flight = _context.Flights.FirstOrDefault(f => f.Id == flightId);

            if (flight == null)
            {
                throw new FlightNotFoundException(flightId);
            }

            var bookedSeats = _context.Bookings
                .Where(b => b.FlightId == flightId && b.Status != "Cancelled")
                .Select(b => b.SeatNumber)
                .ToList();

            return new ApiResponse<FlightSeatMapDto>
            {
                Success = true,
                Message = "Seat map fetched successfully",
                Data = new FlightSeatMapDto
                {
                    FlightId = flight.Id,
                    FlightNumber = flight.FlightNumber,
                    FlightName = flight.FlightName,
                    TotalSeats = flight.TotalSeats,
                    AvailableSeats = flight.AvailableSeats,
                    BookedSeats = bookedSeats
                }
            };
        }

        private static List<string> ResolveSeatNumbers(BookFlightDto dto)
        {
            var seatNumbers = dto.SeatNumbers
                .Concat(string.IsNullOrWhiteSpace(dto.SeatNumber) ? Array.Empty<string>() : new[] { dto.SeatNumber })
                .Select(seat => seat.Trim())
                .Where(seat => !string.IsNullOrWhiteSpace(seat))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            return seatNumbers;
        }

        public ApiResponse<List<Booking>> GetBookingHistory(ClaimsPrincipal user)
        {
            ExpireUnpaidBookings();

            var userId = int.Parse(
                user.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var bookings = _context.Bookings
                .Where(b => b.UserId == userId)
                .ToList();

            return new ApiResponse<List<Booking>>
            {
                Success = true,
                Message = "Booking history fetched successfully",
                Data = bookings
            };
        }

        public ApiResponse<BookingDetailsDto> GetBookingDetails(int id, ClaimsPrincipal user)
        {
            ExpireUnpaidBookings();

            var userId = int.Parse(
                user.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var booking = _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Flight)
                .FirstOrDefault(b => b.Id == id && b.UserId == userId);

            if (booking == null)
            {
                throw new BookingNotFoundException(id);
            }

            var payment = _context.Payments
                .FirstOrDefault(p => p.BookingId == id);

            return new ApiResponse<BookingDetailsDto>
            {
                Success = true,
                Message = "Booking details fetched successfully",
                Data = new BookingDetailsDto
                {
                    Id = booking.Id,
                    UserId = booking.UserId,
                    PassengerName = booking.User != null ? booking.User.FullName : string.Empty,
                    FlightId = booking.FlightId,
                    FlightNumber = booking.Flight != null ? booking.Flight.FlightNumber : string.Empty,
                    FlightName = booking.Flight != null ? booking.Flight.FlightName : string.Empty,
                    SeatNumber = booking.SeatNumber,
                    BookingDate = booking.BookingDate,
                    PaymentDeadline = booking.PaymentDeadline,
                    Status = booking.Status,
                    Amount = payment?.Amount ?? 0
                }
            };
        }

        public ApiResponse<List<BookingSummaryDto>> GetAllBookings()
        {
            ExpireUnpaidBookings();

            var bookings = _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Flight)
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
                    PaymentDeadline = b.PaymentDeadline,
                    Status = b.Status
                })
                .ToList();

            return new ApiResponse<List<BookingSummaryDto>>
            {
                Success = true,
                Message = "Bookings fetched successfully",
                Data = bookings
            };
        }

        public ApiResponse<string> CancelBooking(int id)
        {
            ExpireUnpaidBookings();

            var booking = _context.Bookings
                .FirstOrDefault(b => b.Id == id);

            if (booking == null)
            {
                throw new BookingNotFoundException(id);
            }

            if (booking.Status == "Cancelled")
            {
                throw new BookingAlreadyCancelledException(id);
            }

            booking.Status = "Cancelled";

            var payment = _context.Payments
                .FirstOrDefault(p => p.BookingId == booking.Id);

            if (payment != null && payment.Status == "Pending")
            {
                payment.Status = "Failed";
            }

            var flight = _context.Flights
                .FirstOrDefault(f => f.Id == booking.FlightId);

            if (flight != null)
            {
                flight.AvailableSeats++;
            }

            _context.SaveChanges();

            return new ApiResponse<string>
            {
                Success = true,
                Message = "Booking cancelled successfully"
            };
        }

        public void ExpireUnpaidBookings()
        {
            var now = DateTime.Now;

            var expiredBookings = _context.Bookings
                .Include(booking => booking.Flight)
                .Include(booking => booking.Payment)
                .Where(booking =>
                    booking.Status == "PendingPayment" &&
                    booking.PaymentDeadline != null &&
                    booking.PaymentDeadline <= now)
                .ToList();

            if (expiredBookings.Count == 0)
            {
                return;
            }

            foreach (var booking in expiredBookings)
            {
                booking.Status = "Cancelled";

                if (booking.Payment != null && booking.Payment.Status == "Pending")
                {
                    booking.Payment.Status = "Failed";
                }

                if (booking.Flight != null)
                {
                    booking.Flight.AvailableSeats++;
                }
            }

            _context.SaveChanges();
        }
    }
}
