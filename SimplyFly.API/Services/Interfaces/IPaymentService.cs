using SimplyFly.API.DTOs;
using SimplyFly.API.Models;

namespace SimplyFly.API.Services.Interfaces
{
    public interface IPaymentService
    {
        ApiResponse<object> MakePayment(MakePaymentDto dto);

        ApiResponse<List<PaymentSummaryDto>> GetAllPayments();
    }
}
