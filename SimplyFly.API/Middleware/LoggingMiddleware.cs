namespace SimplyFly.API.Middleware
{
    public class LoggingMiddleware
    {
        private readonly RequestDelegate _next;

        public LoggingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            Console.WriteLine(
                $"Request: {context.Request.Method} " +
                $"{context.Request.Path} " +
                $"at {DateTime.Now}");

            await _next(context);

            Console.WriteLine(
                $"Response Status: {context.Response.StatusCode}");
        }
    }
}