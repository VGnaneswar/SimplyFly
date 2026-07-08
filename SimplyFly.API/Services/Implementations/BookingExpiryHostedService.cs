using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SimplyFly.API.Data;

namespace SimplyFly.API.Services.Implementations
{
    public class BookingExpiryHostedService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<BookingExpiryHostedService> _logger;

        public BookingExpiryHostedService(IServiceScopeFactory scopeFactory, ILogger<BookingExpiryHostedService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                    var now = DateTime.Now;
                    var expiredBookings = await db.Bookings
                        .Include(booking => booking.Flight)
                        .Include(booking => booking.Payment)
                        .Where(booking =>
                            booking.Status == "PendingPayment" &&
                            (booking.PaymentDeadline == null || booking.PaymentDeadline <= now))
                        .ToListAsync(stoppingToken);

                    if (expiredBookings.Count > 0)
                    {
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

                        await db.SaveChangesAsync(stoppingToken);
                    }
                }
                catch (Exception exception)
                {
                    _logger.LogError(exception, "Failed to expire unpaid bookings.");
                }

                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }
    }
}
