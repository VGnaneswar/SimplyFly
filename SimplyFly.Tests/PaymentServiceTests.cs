using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using SimplyFly.API.Data;
using SimplyFly.API.DTOs;
using SimplyFly.API.Exceptions;
using SimplyFly.API.Models;
using SimplyFly.API.Services.Implementations;

namespace SimplyFly.Tests
{
    [TestFixture]
    public class PaymentServiceTests
    {
        private ApplicationDbContext _context;
        private PaymentService _paymentService;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _paymentService = new PaymentService(_context);

            _context.Flights.Add(new Flight
            {
                Id = 1,
                FlightNumber = "SF101",
                FlightName = "SimplyFly One",
                Origin = "Hyderabad",
                Destination = "Bangalore",
                DepartureTime = DateTime.Now.AddHours(2),
                ArrivalTime = DateTime.Now.AddHours(4),
                Fare = 5000,
                TotalSeats = 10,
                AvailableSeats = 10
            });

            _context.SaveChanges();
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        [Test]
        public void When_MakePayment_ValidDetails_ConfirmsBookingAndMarksPaymentPaid()
        {
            _context.Bookings.Add(new Booking
            {
                Id = 1,
                UserId = 101,
                FlightId = 1,
                SeatNumber = "A1",
                BookingDate = DateTime.Now,
                Status = "PendingPayment"
            });

            _context.Payments.Add(new Payment
            {
                Id = 1,
                BookingId = 1,
                Amount = 5000,
                PaymentDate = DateTime.Now,
                Status = "Pending"
            });

            _context.SaveChanges();

            MakePaymentDto dto = new MakePaymentDto
            {
                BookingId = 1,
                PaymentMethod = "Card",
                CardHolderName = "Test User",
                CardNumber = "4111111111111111"
            };

            ApiResponse<object> result = _paymentService.MakePayment(dto);

            Assert.That(result.Success, Is.True);
            Assert.That(result.Message, Is.EqualTo("Payment successful and booking confirmed"));
            Assert.That(_context.Bookings.First(b => b.Id == 1).Status, Is.EqualTo("Confirmed"));
            Assert.That(_context.Payments.First(p => p.BookingId == 1).Status, Is.EqualTo("Paid"));
        }

        [Test]
        public void When_MakePayment_BookingNotFound_ThrowsBookingNotFoundException()
        {
            MakePaymentDto dto = new MakePaymentDto
            {
                BookingId = 999,
                PaymentMethod = "Card",
                CardHolderName = "Test User",
                CardNumber = "4111111111111111"
            };

            var ex = Assert.Throws<BookingNotFoundException>(
                new TestDelegate(() => _paymentService.MakePayment(dto)));

            Assert.That(ex!.Message, Is.EqualTo("Booking with id 999 was not found."));
        }

        [Test]
        public void When_MakePayment_BookingCancelled_ThrowsBookingAlreadyCancelledException()
        {
            _context.Bookings.Add(new Booking
            {
                Id = 2,
                UserId = 101,
                FlightId = 1,
                SeatNumber = "A2",
                BookingDate = DateTime.Now,
                Status = "Cancelled"
            });

            _context.Payments.Add(new Payment
            {
                Id = 2,
                BookingId = 2,
                Amount = 5000,
                PaymentDate = DateTime.Now,
                Status = "Pending"
            });

            _context.SaveChanges();

            MakePaymentDto dto = new MakePaymentDto
            {
                BookingId = 2,
                PaymentMethod = "Card",
                CardHolderName = "Test User",
                CardNumber = "4111111111111111"
            };

            var ex = Assert.Throws<BookingAlreadyCancelledException>(
                new TestDelegate(() => _paymentService.MakePayment(dto)));

            Assert.That(ex!.Message, Is.EqualTo("Booking 2 is already cancelled."));
        }

        [Test]
        public void When_MakePayment_BookingAlreadyConfirmed_ThrowsPaymentAlreadyCompletedException()
        {
            _context.Bookings.Add(new Booking
            {
                Id = 3,
                UserId = 101,
                FlightId = 1,
                SeatNumber = "A3",
                BookingDate = DateTime.Now,
                Status = "Confirmed"
            });

            _context.Payments.Add(new Payment
            {
                Id = 3,
                BookingId = 3,
                Amount = 5000,
                PaymentDate = DateTime.Now,
                Status = "Paid"
            });

            _context.SaveChanges();

            MakePaymentDto dto = new MakePaymentDto
            {
                BookingId = 3,
                PaymentMethod = "Card",
                CardHolderName = "Test User",
                CardNumber = "4111111111111111"
            };

            var ex = Assert.Throws<PaymentAlreadyCompletedException>(
                new TestDelegate(() => _paymentService.MakePayment(dto)));

            Assert.That(ex!.Message, Is.EqualTo("Payment for booking 3 is already completed."));
        }

        [Test]
        public void When_MakePayment_PaymentMissing_ThrowsPaymentNotFoundException()
        {
            _context.Bookings.Add(new Booking
            {
                Id = 4,
                UserId = 101,
                FlightId = 1,
                SeatNumber = "A4",
                BookingDate = DateTime.Now,
                Status = "PendingPayment"
            });

            _context.SaveChanges();

            MakePaymentDto dto = new MakePaymentDto
            {
                BookingId = 4,
                PaymentMethod = "UPI",
                UpiId = "user@upi"
            };

            var ex = Assert.Throws<PaymentNotFoundException>(
                new TestDelegate(() => _paymentService.MakePayment(dto)));

            Assert.That(ex!.Message, Is.EqualTo("Payment record for booking 4 was not found."));
        }

        [Test]
        public void When_MakePayment_PaymentAlreadyPaid_ThrowsPaymentAlreadyCompletedException()
        {
            _context.Bookings.Add(new Booking
            {
                Id = 5,
                UserId = 101,
                FlightId = 1,
                SeatNumber = "A5",
                BookingDate = DateTime.Now,
                Status = "PendingPayment"
            });

            _context.Payments.Add(new Payment
            {
                Id = 5,
                BookingId = 5,
                Amount = 5000,
                PaymentDate = DateTime.Now,
                Status = "Paid"
            });

            _context.SaveChanges();

            MakePaymentDto dto = new MakePaymentDto
            {
                BookingId = 5,
                PaymentMethod = "Card",
                CardHolderName = "Test User",
                CardNumber = "4111111111111111"
            };

            var ex = Assert.Throws<PaymentAlreadyCompletedException>(
                new TestDelegate(() => _paymentService.MakePayment(dto)));

            Assert.That(ex!.Message, Is.EqualTo("Payment for booking 5 is already completed."));
        }

        [Test]
        public void When_MakePayment_MultipleBookings_ConfirmsAllPayments()
        {
            _context.Bookings.AddRange(
                new Booking
                {
                    Id = 6,
                    UserId = 101,
                    FlightId = 1,
                    SeatNumber = "A6",
                    BookingDate = DateTime.Now,
                    Status = "PendingPayment"
                },
                new Booking
                {
                    Id = 7,
                    UserId = 101,
                    FlightId = 1,
                    SeatNumber = "A7",
                    BookingDate = DateTime.Now,
                    Status = "PendingPayment"
                });

            _context.Payments.AddRange(
                new Payment
                {
                    Id = 6,
                    BookingId = 6,
                    Amount = 5000,
                    PaymentDate = DateTime.Now,
                    Status = "Pending"
                },
                new Payment
                {
                    Id = 7,
                    BookingId = 7,
                    Amount = 5000,
                    PaymentDate = DateTime.Now,
                    Status = "Pending"
                });

            _context.SaveChanges();

            var dto = new MakePaymentDto
            {
                BookingIds = new List<int> { 6, 7 },
                PaymentMethod = "UPI",
                UpiId = "user@upi"
            };

            var result = _paymentService.MakePayment(dto);

            Assert.That(result.Success, Is.True);
            Assert.That(_context.Bookings.Count(booking => booking.Status == "Confirmed"), Is.EqualTo(2));
            Assert.That(_context.Payments.Count(payment => payment.Status == "Paid"), Is.EqualTo(2));
        }
    }
}
