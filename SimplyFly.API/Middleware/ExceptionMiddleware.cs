using System.Net;
using System.Text.Json;
using SimplyFly.API.Exceptions;
using SimplyFly.API.Models;

namespace SimplyFly.API.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                context.Response.ContentType = "application/json";
                context.Response.StatusCode = GetStatusCode(ex);

                var response = new ApiResponse<string>
                {
                    Success = false,
                    Message = ex.Message,
                    Data = null
                };

                var json = JsonSerializer.Serialize(response);
                await context.Response.WriteAsync(json);
            }
        }

        private static int GetStatusCode(Exception ex)
        {
            return ex switch
            {
                FlightNotFoundException => (int)HttpStatusCode.NotFound,
                BookingNotFoundException => (int)HttpStatusCode.NotFound,
                PaymentNotFoundException => (int)HttpStatusCode.NotFound,

                SeatAlreadyBookedException => (int)HttpStatusCode.Conflict,
                NoSeatsAvailableException => (int)HttpStatusCode.Conflict,
                BookingAlreadyCancelledException => (int)HttpStatusCode.Conflict,
                PaymentAlreadyCompletedException => (int)HttpStatusCode.Conflict,
                PaymentWindowExpiredException => (int)HttpStatusCode.Conflict,

                InvalidSeatSelectionException => (int)HttpStatusCode.BadRequest,
                InvalidPaymentDetailsException => (int)HttpStatusCode.BadRequest,

                _ => (int)HttpStatusCode.InternalServerError
            };
        }
    }
}
