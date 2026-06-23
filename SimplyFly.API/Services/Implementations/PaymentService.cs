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
            var booking = _context.Bookings
                .FirstOrDefault(b => b.Id == dto.BookingId);

            if (booking == null)
            {
                throw new BookingNotFoundException(dto.BookingId);
            }

            if (booking.Status == "Cancelled")
            {
                throw new BookingAlreadyCancelledException(dto.BookingId);
            }

            if (booking.Status == "Confirmed")
            {
                throw new PaymentAlreadyCompletedException(dto.BookingId);
            }

            var payment = _context.Payments
                .FirstOrDefault(p => p.BookingId == dto.BookingId);

            if (payment == null)
            {
                throw new PaymentNotFoundException(dto.BookingId);
            }

            if (payment.Status == "Paid")
            {
                throw new PaymentAlreadyCompletedException(dto.BookingId);
            }

            payment.Status = "Paid";
            payment.PaymentDate = DateTime.Now;

            booking.Status = "Confirmed";

            _context.SaveChanges();

            return new ApiResponse<object>
            {
                Success = true,
                Message = "Payment successful and booking confirmed",
                Data = new
                {
                    BookingId = booking.Id,
                    BookingStatus = booking.Status,
                    PaymentId = payment.Id,
                    PaymentStatus = payment.Status,
                    Amount = payment.Amount
                }
            };
        }
    }
}
