using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SimplyFly.API.DTOs;
using SimplyFly.API.Services.Interfaces;

namespace SimplyFly.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentsController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [Authorize(Roles = "Passenger")]
        [HttpPost]
        public IActionResult MakePayment(MakePaymentDto dto)
        {
            var result = _paymentService.MakePayment(dto);

            return Ok(result);
        }
    }
}