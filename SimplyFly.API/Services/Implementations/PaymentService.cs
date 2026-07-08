using Microsoft.EntityFrameworkCore;
using SimplyFly.API.Data;
using SimplyFly.API.DTOs;
using SimplyFly.API.Exceptions;
using SimplyFly.API.Models;
using SimplyFly.API.Services.Interfaces;

namespace SimplyFly.API.Services.Implementations
{
    public class PaymentService : IPaymentService
    {
        private readonly ApplicationDbContext _context;

        public PaymentService(ApplicationDbContext context)
        {
            _context = context;
        }

        public ApiResponse<object> MakePayment(MakePaymentDto dto)
        {
            var bookingIds = ResolveBookingIds(dto);

            if (bookingIds.Count == 0)
            {
                throw new InvalidPaymentDetailsException("Provide at least one booking ID before making a payment.");
            }

            ValidatePaymentDetails(dto);

            var bookings = _context.Bookings
                .Include(booking => booking.Payment)
                .Where(booking => bookingIds.Contains(booking.Id))
                .ToList();

            if (bookings.Count != bookingIds.Count)
            {
                var missingBookingId = bookingIds.First(bookingId => bookings.All(booking => booking.Id != bookingId));
                throw new BookingNotFoundException(missingBookingId);
            }

            foreach (var booking in bookings)
            {
                var paymentDeadline = booking.PaymentDeadline ?? booking.BookingDate.AddMinutes(10);

                if (paymentDeadline <= DateTime.Now)
                {
                    booking.Status = "Cancelled";

                    if (booking.Payment != null && booking.Payment.Status == "Pending")
                    {
                        booking.Payment.Status = "Failed";
                    }

                    var flight = _context.Flights.FirstOrDefault(flight => flight.Id == booking.FlightId);
                    if (flight != null)
                    {
                        flight.AvailableSeats++;
                    }

                    _context.SaveChanges();
                    throw new PaymentWindowExpiredException(booking.Id);
                }

                if (booking.Status == "Cancelled")
                {
                    throw new BookingAlreadyCancelledException(booking.Id);
                }

                if (booking.Status == "Confirmed")
                {
                    throw new PaymentAlreadyCompletedException(booking.Id);
                }
            }

            var payments = _context.Payments
                .Where(payment => bookingIds.Contains(payment.BookingId))
                .ToList();

            if (payments.Count != bookingIds.Count)
            {
                var missingBookingId = bookingIds.First(bookingId => payments.All(payment => payment.BookingId != bookingId));
                throw new PaymentNotFoundException(missingBookingId);
            }

            foreach (var payment in payments)
            {
                if (payment.Status == "Paid")
                {
                    throw new PaymentAlreadyCompletedException(payment.BookingId);
                }

                payment.Status = "Paid";
                payment.PaymentDate = DateTime.Now;
            }

            foreach (var booking in bookings)
            {
                booking.Status = "Confirmed";
            }

            _context.SaveChanges();

            var totalAmount = payments.Sum(payment => payment.Amount);

            return new ApiResponse<object>
            {
                Success = true,
                Message = "Payment successful and booking confirmed",
                Data = new
                {
                    BookingIds = bookings.Select(booking => booking.Id).ToList(),
                    BookingStatus = "Confirmed",
                    PaymentIds = payments.Select(payment => payment.Id).ToList(),
                    PaymentStatus = "Paid",
                    TotalAmount = totalAmount,
                    PaymentMethod = dto.PaymentMethod.Trim(),
                    PaymentDetail = BuildMaskedPaymentDetail(dto)
                }
            };
        }

        public ApiResponse<List<PaymentSummaryDto>> GetAllPayments()
        {
            var payments = _context.Payments
                .Include(p => p.Booking)
                .ThenInclude(b => b.User)
                .Include(p => p.Booking)
                .ThenInclude(b => b.Flight)
                .OrderByDescending(p => p.PaymentDate)
                .Select(p => new PaymentSummaryDto
                {
                    Id = p.Id,
                    BookingId = p.BookingId,
                    PassengerName = p.Booking != null && p.Booking.User != null ? p.Booking.User.FullName : string.Empty,
                    FlightId = p.Booking != null ? p.Booking.FlightId : 0,
                    FlightNumber = p.Booking != null && p.Booking.Flight != null ? p.Booking.Flight.FlightNumber : string.Empty,
                    Amount = p.Amount,
                    PaymentDate = p.PaymentDate,
                    Status = p.Status
                })
                .ToList();

            return new ApiResponse<List<PaymentSummaryDto>>
            {
                Success = true,
                Message = "Payments fetched successfully",
                Data = payments
            };
        }

        private static List<int> ResolveBookingIds(MakePaymentDto dto)
        {
            return (dto.BookingIds ?? new List<int>())
                .Concat(dto.BookingId > 0 ? new[] { dto.BookingId } : Array.Empty<int>())
                .Where(bookingId => bookingId > 0)
                .Distinct()
                .ToList();
        }

        private static void ValidatePaymentDetails(MakePaymentDto dto)
        {
            var paymentMethod = Normalize(dto.PaymentMethod);

            if (string.IsNullOrWhiteSpace(paymentMethod))
            {
                throw new InvalidPaymentDetailsException("Choose a payment method before paying.");
            }

            if (paymentMethod.Equals("Card", StringComparison.OrdinalIgnoreCase))
            {
                var cardNumber = NormalizeCardNumber(dto.CardNumber);
                if (cardNumber.Length < 12 || cardNumber.Length > 19 || !cardNumber.All(char.IsDigit))
                {
                    throw new InvalidPaymentDetailsException("Enter a valid card number.");
                }

                if (string.IsNullOrWhiteSpace(Normalize(dto.CardHolderName)))
                {
                    throw new InvalidPaymentDetailsException("Enter the card holder name.");
                }
            }
            else if (paymentMethod.Equals("UPI", StringComparison.OrdinalIgnoreCase))
            {
                var upiId = Normalize(dto.UpiId);
                if (string.IsNullOrWhiteSpace(upiId) || !upiId.Contains('@'))
                {
                    throw new InvalidPaymentDetailsException("Enter a valid UPI tag.");
                }
            }
            else
            {
                throw new InvalidPaymentDetailsException("Payment method must be Card or UPI.");
            }
        }

        private static string BuildMaskedPaymentDetail(MakePaymentDto dto)
        {
            if (Normalize(dto.PaymentMethod).Equals("Card", StringComparison.OrdinalIgnoreCase))
            {
                var cardNumber = NormalizeCardNumber(dto.CardNumber);
                var lastFour = cardNumber.Length >= 4 ? cardNumber[^4..] : cardNumber;
                return $"Card ending {lastFour}";
            }

            return $"UPI {Normalize(dto.UpiId)}";
        }

        private static string Normalize(string? value)
        {
            return value?.Trim() ?? string.Empty;
        }

        private static string NormalizeCardNumber(string? value)
        {
            return new string((value ?? string.Empty).Where(char.IsDigit).ToArray());
        }
    }
}
