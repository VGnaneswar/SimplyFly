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
            var flight = _context.Flights
                .FirstOrDefault(f => f.Id == dto.FlightId);

            if (flight == null)
            {
                throw new FlightNotFoundException(dto.FlightId);
            }

            if (flight.AvailableSeats <= 0)
            {
                throw new NoSeatsAvailableException(dto.FlightId);
            }

            var seatExists = _context.Bookings.Any(b =>
                b.FlightId == dto.FlightId &&
                b.SeatNumber == dto.SeatNumber &&
                b.Status != "Cancelled");

            if (seatExists)
            {
                throw new SeatAlreadyBookedException(dto.SeatNumber);
            }

            var userId = int.Parse(
                user.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var booking = new Booking
            {
                UserId = userId,
                FlightId = dto.FlightId,
                SeatNumber = dto.SeatNumber,
                BookingDate = DateTime.Now,
                Status = "PendingPayment"
            };

            flight.AvailableSeats--;

            _context.Bookings.Add(booking);
            _context.SaveChanges();

            var payment = new Payment
            {
                BookingId = booking.Id,
                Amount = flight.Fare,
                PaymentDate = DateTime.Now,
                Status = "Pending"
            };

            _context.Payments.Add(payment);
            _context.SaveChanges();

            return new ApiResponse<object>
            {
                Success = true,
                Message = "Booking created. Please complete payment to confirm booking.",
                Data = new
                {
                    BookingId = booking.Id,
                    FlightId = booking.FlightId,
                    SeatNumber = booking.SeatNumber,
                    BookingStatus = booking.Status,
                    PaymentId = payment.Id,
                    Amount = payment.Amount,
                    PaymentStatus = payment.Status
                }
            };
        }

        public ApiResponse<List<Booking>> GetBookingHistory(ClaimsPrincipal user)
        {
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

        public ApiResponse<string> CancelBooking(int id)
        {
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
    }
}
